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

// WebBrowser.maybeCompleteAuthSession(); // required for web only

// Use explicit redirect URI instead of makeRedirectUri() to avoid malformed URLs
const redirectTo = 'practicepro://auth/callback';
console.log("Using redirect URI:", redirectTo);
const createSessionFromUrl = async (url: string) => {
	try {
		console.log("Creating session from URL:", url);
		const { params, errorCode } = QueryParams.getQueryParams(url);
		if (errorCode) {
			console.error("Query params error:", errorCode);
			throw new Error(errorCode);
		}
		const { access_token, refresh_token } = params;
		if (!access_token) {
			console.log("No access token found in URL");
			return;
		}
		console.log("Found access token, setting session...");
		const { data, error } = await supabase.auth.setSession({
			access_token,
			refresh_token,
		});
		if (error) {
			console.error("Session error:", error);
			throw error;
		}
		console.log("Session created successfully");
		return data.session;
	} catch (error) {
		console.error("Error creating session from URL:", error);
		throw error;
	}
};
const performOAuth = async () => {
	const { data, error } = await supabase.auth.signInWithOAuth({
		provider: "github",
		options: {
			redirectTo,
			skipBrowserRedirect: true,
		},
	});
	if (error) throw error;
	const res = await WebBrowser.openAuthSessionAsync(
		data?.url ?? "",
		redirectTo
	);
	if (res.type === "success") {
		const { url } = res;
		await createSessionFromUrl(url);
	}
};
const sendMagicLink = async (email: string) => {
	try {
		console.log(`Sending magic link to: ${email}`);
		const { error } = await supabase.auth.signInWithOtp({
			email: email,
			options: {
				emailRedirectTo: redirectTo,
			},
		});
		
		if (error) {
			console.error("Magic link error:", error);
			Alert.alert("Magic Link Error", error.message);
		} else {
			console.log("Magic link sent successfully");
			Alert.alert(
				"Magic Link Sent!", 
				"Check your email and click the link to sign in. The link will open your app automatically."
			);
		}
	} catch (error) {
		console.error("Magic link exception:", error);
		Alert.alert(
			"Magic Link Failed", 
			error instanceof Error ? error.message : "An unexpected error occurred. Please try again."
		);
	}
};

export default function Auth() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);

	// Handle linking into app from email app.
	const url = Linking.useURL();
	console.log("Deep link URL received:", url);

	// Only process URLs that contain auth parameters and are properly formatted
	if (url && url.includes('access_token') && !url.endsWith(':///')) {
		console.log("✅ Processing auth URL:", url);
		createSessionFromUrl(url);
	} else if (url && url.endsWith(':///')) {
		console.log("⚠️  Ignoring malformed deep link (empty path):", url);
		console.log("   This usually happens when testing with 'practicepro://'");
		console.log("   Use a proper auth callback URL for testing");
	} else if (url) {
		console.log("ℹ️  Received non-auth deep link:", url);
	}

	async function signInWithEmail() {
		if (!email || !password) {
			Alert.alert("Error", "Please enter both email and password");
			return;
		}

		setLoading(true);
		try {
			console.log("Signing in...");
			const { error } = await supabase.auth.signInWithPassword({
				email: email,
				password: password,
			});

			if (error) {
				console.error("Sign in error:", error);
				Alert.alert("Sign In Error", error.message);
			} else {
				console.log("Sign in successful");
				Alert.alert("Success", "Signed in successfully!");
			}
		} catch (error) {
			console.error("Sign in exception:", error);
			Alert.alert("Sign In Failed", error instanceof Error ? error.message : "An unexpected error occurred");
		} finally {
			setLoading(false);
		}
	}

	async function signUpWithEmail() {
		if (!email || !password) {
			Alert.alert("Error", "Please enter both email and password");
			return;
		}

		setLoading(true);
		try {
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

			if (error) {
				console.error("Signup error:", error);
				Alert.alert("Signup Error", error.message);
			} else if (!session) {
				console.log("Signup successful, email verification required");
				Alert.alert(
					"Account Created!", 
					"Please check your inbox for email verification. Click the link in your email to complete signup."
				);
			} else {
				console.log("Signup successful with session");
			}
		} catch (error) {
			console.error("Signup exception:", error);
			Alert.alert(
				"Signup Failed", 
				error instanceof Error ? error.message : "An unexpected error occurred. Please try again."
			);
		} finally {
			setLoading(false);
		}
	}

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
						<Text style={styles.buttonText}>
							{loading ? "Signing In..." : "Sign In"}
						</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={[styles.button, styles.signUpButton]}
						onPress={signUpWithEmail}
						disabled={loading}
					>
						<Text style={styles.buttonText}>
							{loading ? "Creating Account..." : "Sign Up"}
						</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={[styles.button, styles.magicLinkButton]}
						onPress={async () => {
							if (!email) {
								Alert.alert("Error", "Please enter your email address");
								return;
							}
							setLoading(true);
							await sendMagicLink(email);
							setLoading(false);
						}}
						disabled={loading}
					>
						<Text style={styles.buttonText}>
							{loading ? "Sending..." : "Send Magic Link"}
						</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={[styles.button, styles.testButton]}
						onPress={() => {
							const testUrl =
								"practicepro://auth/callback?access_token=test_token&refresh_token=test_refresh&type=recovery";
							console.log("🧪 Testing proper auth deep link:", testUrl);
							createSessionFromUrl(testUrl).catch(console.error);
						}}
					>
						<Text style={styles.buttonText}>Test Auth Deep Link</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={[styles.button, styles.testButton]}
						onPress={() => {
							const testUrl = "practicepro://";
							console.log("🧪 Testing malformed deep link:", testUrl);
							// This should be ignored by our logic
						}}
					>
						<Text style={styles.buttonText}>Test Malformed Deep Link</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={[styles.button, styles.testButton]}
						onPress={async () => {
							if (!email) {
								Alert.alert("Error", "Please enter an email address first");
								return;
							}
							console.log("🧪 Testing email configuration with:", email);
							await sendMagicLink(email);
						}}
					>
						<Text style={styles.buttonText}>Test Email Config</Text>
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
