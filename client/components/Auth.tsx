import React, { useState, useEffect } from "react";
import {
	Alert,
	StyleSheet,
	View,
	AppState,
	TouchableOpacity,
	Text,
	TextInput,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
} from "react-native";
import { supabase } from "../lib/supabase";
import { makeRedirectUri } from "expo-auth-session";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { MaterialIcons } from "@expo/vector-icons";
import theme from "./styles/theme";

WebBrowser.maybeCompleteAuthSession(); // required for web only

// Use the proper deep link scheme for mobile apps
const redirectTo = makeRedirectUri();

// Debug: Log the redirect URI
console.log("Generated redirect URI:", { redirectTo });

Linking.addEventListener("url", (event) => {
	console.log("Incoming URL:", event.url);
	// parse token from URL and complete sign-in
});

const createSessionFromUrl = async (url: string) => {
	console.log("Creating session from URL:", url);


	const { params, errorCode } = QueryParams.getQueryParams(url);
	console.log("URL params:", params);
	console.log("Error code:", errorCode);

	if (errorCode) throw new Error(errorCode);
	const { access_token, refresh_token } = params;

	if (!access_token) {
		console.log("No access token found in URL");
		return;
	}

	const { data, error } = await supabase.auth.setSession({
		access_token,
		refresh_token,
	});
	if (error) throw error;
	console.log("Session created successfully");
	return data.session;
};

// Tells Supabase Auth to continuously refresh the session automatically if
// the app is in the foreground. When this is added, you will continue to receive
// `onAuthStateChange` events with the `TOKEN_REFRESHED` or `SIGNED_OUT` event
// if the user's session is terminated. This should only be registered once.
AppState.addEventListener("change", (state) => {
	if (state === "active") {
		supabase.auth.startAutoRefresh();
	} else {
		supabase.auth.stopAutoRefresh();
	}
});

export default function Auth() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);

	// Handle linking into app from email app.
	const url = Linking.useURL();
	console.log("Deep link URL received:", url);

	useEffect(() => {
		if (url) {
			console.log("Processing deep link URL:", url);
			createSessionFromUrl(url).catch(console.error);
		}
	}, [url]);

	async function signInWithEmail() {
		setLoading(true);
		const { error } = await supabase.auth.signInWithPassword({
			email: email,
			password: password,
		});

		if (error) Alert.alert(error.message);
		setLoading(false);
	}

	async function signUpWithEmail() {
		setLoading(true);
		const {
			data: { session },
			error,
		} = await supabase.auth.signUp({
			email: email,
			password: password,
			options: {
				emailRedirectTo: redirectTo,
			},
		});

		if (error) Alert.alert(error.message);
		if (!session)
			Alert.alert("Please check your inbox for email verification!");
		setLoading(false);
	}

	const sendMagicLink = async () => {
		setLoading(true);
		const { error } = await supabase.auth.signInWithOtp({
			email: email,
			options: {
				emailRedirectTo: redirectTo,
			},
		});

		if (error) {
			Alert.alert(error.message);
		} else {
			Alert.alert(
				"Magic link sent! Check your email and click the link directly in your browser."
			);
		}
		setLoading(false);
	};

	return (
		<KeyboardAvoidingView
			style={styles.container}
			behavior={Platform.OS === "ios" ? "padding" : "height"}
		>
			<ScrollView
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
				keyboardShouldPersistTaps="handled"
			>
				<View style={styles.header}>
					<MaterialIcons
						name="sports-soccer"
						size={80}
						color={theme.colors.primary}
					/>
					<Text style={styles.title}>PracticePro Volleyball</Text>
					<Text style={styles.subtitle}>
						Sign in to manage your practices
					</Text>
				</View>

				<View style={styles.formContainer}>
					<View style={styles.inputContainer}>
						<Text style={styles.inputLabel}>Email</Text>
						<View style={styles.inputWrapper}>
							<MaterialIcons
								name="email"
								size={20}
								color={theme.colors.textMuted}
								style={styles.inputIcon}
							/>
							<TextInput
								style={styles.textInput}
								onChangeText={(text: string) => setEmail(text)}
								value={email}
								placeholder="Enter your email"
								placeholderTextColor={theme.colors.textMuted}
								autoCapitalize="none"
								keyboardType="email-address"
								returnKeyType="next"
								keyboardAppearance="dark"
							/>
						</View>
					</View>

					<View style={styles.inputContainer}>
						<Text style={styles.inputLabel}>Password</Text>
						<View style={styles.inputWrapper}>
							<MaterialIcons
								name="lock"
								size={20}
								color={theme.colors.textMuted}
								style={styles.inputIcon}
							/>
							<TextInput
								style={styles.textInput}
								onChangeText={(text: string) =>
									setPassword(text)
								}
								value={password}
								placeholder="Enter your password"
								placeholderTextColor={theme.colors.textMuted}
								secureTextEntry={true}
								autoCapitalize="none"
								returnKeyType="done"
								keyboardAppearance="dark"
							/>
						</View>
					</View>

					<TouchableOpacity
						style={[styles.button, styles.signInButton]}
						onPress={signInWithEmail}
						disabled={loading}
					>
						<Text style={styles.buttonText}>Sign In</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={[styles.button, styles.signUpButton]}
						onPress={signUpWithEmail}
						disabled={loading}
					>
						<Text style={styles.buttonText}>Sign Up</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={[styles.button, styles.magicLinkButton]}
						onPress={sendMagicLink}
						disabled={loading}
					>
						<Text style={styles.buttonText}>Send Magic Link</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={[styles.button, styles.testButton]}
						onPress={() => {
							const testUrl =
								"com.supabase://auth/callback?access_token=test&refresh_token=test";
							console.log("Testing deep link:", testUrl);
							createSessionFromUrl(testUrl).catch(console.error);
						}}
					>
						<Text style={styles.buttonText}>Test Deep Link</Text>
					</TouchableOpacity>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: theme.colors.background,
	},
	scrollContent: {
		flexGrow: 1,
		justifyContent: "center",
		padding: 20,
	},
	header: {
		alignItems: "center",
		marginBottom: 40,
	},
	title: {
		fontSize: 28,
		fontWeight: "bold",
		color: theme.colors.textPrimary,
		marginTop: 16,
		marginBottom: 8,
	},
	subtitle: {
		fontSize: 16,
		color: theme.colors.textMuted,
		textAlign: "center",
	},
	formContainer: {
		width: "100%",
	},
	inputContainer: {
		marginBottom: 20,
	},
	inputLabel: {
		fontSize: 16,
		fontWeight: "600",
		color: theme.colors.textPrimary,
		marginBottom: 8,
	},
	inputWrapper: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: theme.colors.surface,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: theme.colors.border,
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
	inputIcon: {
		marginRight: 12,
	},
	textInput: {
		flex: 1,
		fontSize: 16,
		color: theme.colors.textPrimary,
	},
	button: {
		paddingVertical: 16,
		paddingHorizontal: 24,
		borderRadius: 12,
		alignItems: "center",
		marginBottom: 12,
	},
	signInButton: {
		backgroundColor: theme.colors.primary,
	},
	signUpButton: {
		backgroundColor: theme.colors.secondary,
	},
	magicLinkButton: {
		backgroundColor: theme.colors.accent,
	},
	testButton: {
		backgroundColor: "#666",
	},
	buttonText: {
		fontSize: 16,
		fontWeight: "600",
		color: theme.colors.white,
	},
});
