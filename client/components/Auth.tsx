import React, { useState, useEffect } from "react";
import {
	Alert,
	StyleSheet,
	View,
	TouchableOpacity,
	Text,
	TextInput,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
} from "react-native";
import * as Linking from "expo-linking";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import * as WebBrowser from "expo-web-browser";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import theme from "./styles/theme";

import { supabase } from "../lib/supabase";
import Purchases from "react-native-purchases";
import { makeRedirectUri } from "expo-auth-session";

// Add Buffer shim for query parameter parsing
global.Buffer = global.Buffer || require("buffer").Buffer;

const parseSupabaseUrl = (url: string): string => {
	// Supabase uses # instead of ? for query parameters
	let parsedUrl = url;
	if (url.includes("#")) {
		parsedUrl = url.replace("#", "?");
	}
	return parsedUrl;
};

const Auth = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const navigation = useNavigation();

	// Compute redirect URI (must match scheme / whitelisted in Supabase)
	const redirectTo = makeRedirectUri();
	console.log("Using redirect URI:", redirectTo);

	// Deep link / incoming URL handler
	useEffect(() => {
		const handleDeepLink = async (rawUrl: string) => {
			console.log("🔍 DEBUG - Raw URL:", rawUrl);
			
			// Parse the Supabase URL format
			const transformedUrl = parseSupabaseUrl(rawUrl);
			console.log("🔍 DEBUG - Transformed URL:", transformedUrl);
			
			const parsedUrl = Linking.parse(transformedUrl);
			console.log("🔍 DEBUG - Parsed URL:", parsedUrl);
			
			const access_token = parsedUrl.queryParams?.access_token;
			const refresh_token = parsedUrl.queryParams?.refresh_token;
			const type = parsedUrl.queryParams?.type;
			
			console.log("🔍 DEBUG - Type:", type);
			console.log("🔍 DEBUG - Access token exists:", !!access_token);
			console.log("🔍 DEBUG - Refresh token exists:", !!refresh_token);

			// Handle password recovery flow
			if (type === "recovery" && access_token && refresh_token) {
				console.log("🔄 Password recovery detected - setting session and navigating");
				
				try {
					// Set the session using the tokens from the URL
					const { data, error } = await supabase.auth.setSession({
						access_token: access_token as string,
						refresh_token: refresh_token as string,
					});
					
					if (error) {
						console.error("❌ Error setting recovery session:", error);
						Alert.alert(
							"Recovery Error", 
							"Unable to verify recovery link. Please try requesting a new password reset."
						);
						return;
					}
					
					console.log("✅ Recovery session established:", data.session?.user?.email);
					
					// Navigate to reset password screen
					(navigation as any).navigate("ResetPassword", {
						recovery: true,
						sessionEstablished: true
					});
					
				} catch (err) {
					console.error("❌ Recovery session error:", err);
					Alert.alert(
						"Recovery Error", 
						"Failed to establish recovery session. Please try again."
					);
				}
			}
			// Handle other auth flows (normal login, magic links, etc.)
			else if (access_token && refresh_token && type !== "recovery") {
				console.log("🔄 Normal auth flow detected");
				try {
					const { data, error } = await supabase.auth.setSession({
						access_token: access_token as string,
						refresh_token: refresh_token as string,
					});
					
					if (error) {
						console.error("❌ Error setting session:", error);
					} else {
						console.log("✅ Normal session established:", data.session?.user?.email);
						// User is logged in normally
					}
				} catch (err) {
					console.error("❌ Session error:", err);
				}
			}
			else if (rawUrl && rawUrl.endsWith(":///")) {
				console.log("⚠️ Ignoring malformed deep link (empty path):", rawUrl);
			} else {
				console.log("ℹ️ Received non-auth / unrelated deep link:", rawUrl);
			}
		};

		// If app is launched via deep link
		Linking.getInitialURL().then((initialUrl) => {
			if (initialUrl) {
				handleDeepLink(initialUrl);
			}
		});

		const subscription = Linking.addEventListener("url", (event) => {
			handleDeepLink(event.url);
		});
		
		return () => {
			subscription.remove();
		};
	}, [navigation]);

	const signInWithEmail = async () => {
		if (!email || !password) {
			Alert.alert("Error", "Please enter both email and password");
			return;
		}
		setLoading(true);
		try {
			const {
				data: { session },
				error,
			} = await supabase.auth.signInWithPassword({
				email,
				password,
			});

			if (error) {
				console.error("Sign in error:", error);
				Alert.alert("Sign In Error", error.message);
			} else {
				console.log("Sign in successful:", session);
				if (session?.user?.id) {
					const { customerInfo } = await Purchases.logIn(
						session.user.id
					);
					console.log("RevenueCat customer:", customerInfo);
				}
			}
		} catch (err) {
			console.error("Sign in exception:", err);
			Alert.alert(
				"Sign In Failed",
				err instanceof Error ? err.message : "Unexpected error"
			);
		} finally {
			setLoading(false);
		}
	};

	const signUpWithEmail = async () => {
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
				email,
				password,
				options: {
					emailRedirectTo: redirectTo,
				},
			});

			if (error) {
				console.error("Signup error:", error);
				Alert.alert("Signup Error", error.message);
			} else if (!session) {
				console.log("Signup initiated, check email to verify or reset");
				Alert.alert(
					"Account Created!",
					"Please check your email for a confirmation / verification link."
				);
			} else {
				console.log("Signup created a session:", session);
			}
		} catch (err) {
			console.error("Signup exception:", err);
			Alert.alert(
				"Signup Failed",
				err instanceof Error ? err.message : "Unexpected error"
			);
		} finally {
			setLoading(false);
		}
	};

	const resetPassword = async () => {
		// Create the reset password URL
		const resetPasswordUrl = Linking.createURL("ResetPassword");
		console.log("🔗 Reset password URL:", resetPasswordUrl);
		
		if (!email) {
			Alert.alert("Error", "Please enter your email address");
			return;
		}
		setLoading(true);
		try {
			const { data, error } = await supabase.auth.resetPasswordForEmail(
				email,
				{
					redirectTo: resetPasswordUrl,
				}
			);

			if (error) {
				Alert.alert("Reset Password Error", error.message);
			} else {
				console.log("📧 Password reset email sent");
				Alert.alert(
					"Reset Link Sent",
					"Please check your email for a password reset link."
				);
			}
		} catch (err) {
			Alert.alert(
				"Reset Password Failed",
				err instanceof Error ? err.message : "Unexpected error"
			);
		} finally {
			setLoading(false);
		}
	};

	// Test function for ResetPassword screen
	const testResetPasswordScreen = () => {
		console.log("🧪 Testing ResetPassword screen navigation");
		(navigation as any).navigate("ResetPassword", {
			recovery: true,
			sessionEstablished: true
		});
	};

	return (
		<KeyboardAvoidingView
			style={styles.container}
			behavior={Platform.OS === "ios" ? "padding" : "height"}
		>
			<ScrollView
				contentContainerStyle={styles.scrollContent}
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
								onChangeText={setEmail}
								value={email}
								placeholder="Enter your email"
								placeholderTextColor={theme.colors.textMuted}
								autoCapitalize="none"
								keyboardType="email-address"
								returnKeyType="next"
								keyboardAppearance="dark"
								blurOnSubmit={false}
								selectTextOnFocus={false}
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
								onChangeText={setPassword}
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
						style={styles.forgotPasswordLink}
						onPress={resetPassword}
						disabled={loading}
					>
						<Text style={styles.forgotPasswordText}>
							Forgot Password?
						</Text>
					</TouchableOpacity>

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

					{__DEV__ && (
						<TouchableOpacity
							style={[
								styles.button,
								{
									backgroundColor: theme.colors.secondary,
									marginTop: 10,
								},
							]}
							onPress={testResetPasswordScreen}
							disabled={loading}
						>
							<Text style={styles.buttonText}>
								🧪 Test Reset Password Screen
							</Text>
						</TouchableOpacity>
					)}
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
};

export default Auth;

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
	forgotPasswordLink: {
		alignSelf: "flex-end",
		marginBottom: 20,
	},
	forgotPasswordText: {
		fontSize: 14,
		color: theme.colors.primary,
		textDecorationLine: "underline",
	},
	buttonText: {
		fontSize: 16,
		fontWeight: "600",
		color: theme.colors.white,
	},
});
