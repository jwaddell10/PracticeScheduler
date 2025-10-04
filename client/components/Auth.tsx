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
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import theme from "./styles/theme";
import { supabase } from "../lib/supabase";
import Purchases from "react-native-purchases";

// Add Buffer shim for query parameter parsing
global.Buffer = global.Buffer || require("buffer").Buffer;

const Auth = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const navigation = useNavigation();

	// Use consistent redirect URI that matches Supabase configuration
	const redirectTo = 'practicepro://';
	console.log("Using redirect URI:", redirectTo);

	// Deep link / incoming URL handler
	useEffect(() => {
		const handleDeepLink = async (rawUrl: string) => {
			console.log("🔍 DEBUG - Raw URL:", rawUrl);

			try {
				// Parse the URL to extract query parameters
				const url = new URL(rawUrl.replace("#", "?"));
				const access_token = url.searchParams.get("access_token");
				const refresh_token = url.searchParams.get("refresh_token");
				const type = url.searchParams.get("type");

				console.log("🔍 DEBUG - Type:", type);
				console.log("🔍 DEBUG - Access token exists:", !!access_token);
				console.log(
					"🔍 DEBUG - Refresh token exists:",
					!!refresh_token
				);

				// Handle password recovery flow
				if (type === "recovery" && access_token && refresh_token) {
					console.log(
						"🔄 Password recovery detected - setting session and navigating"
					);

					// Set the session using the tokens from the URL
					const { data, error } = await supabase.auth.setSession({
						access_token: access_token,
						refresh_token: refresh_token,
					});

					if (error) {
						console.error(
							"❌ Error setting recovery session:",
							error
						);
						Alert.alert(
							"Recovery Error",
							"Unable to verify recovery link. Please try requesting a new password reset."
						);
						return;
					}

					console.log(
						"✅ Recovery session established:",
						data.session?.user?.email
					);

					// Navigate to reset password screen with a slight delay to ensure session is set
					setTimeout(() => {
						(navigation as any).navigate("ResetPassword", {
							recovery: true,
							sessionEstablished: true,
						});
					}, 100);
				}
				// Handle email confirmation
				else if (type === "signup" && access_token && refresh_token) {
					console.log("🔄 Email confirmation detected");

					const { data, error } = await supabase.auth.setSession({
						access_token: access_token,
						refresh_token: refresh_token,
					});

					if (error) {
						console.error("❌ Error confirming email:", error);
						Alert.alert(
							"Confirmation Error",
							"Unable to confirm your email. Please try again."
						);
					} else {
						console.log(
							"✅ Email confirmed and session established:",
							data.session?.user?.email
						);
						Alert.alert(
							"Welcome!",
							"Your email has been confirmed and you're now signed in."
						);
					}
				}
				// Handle magic link login
				else if (access_token && refresh_token && !type) {
					console.log("🔄 Magic link login detected");

					const { data, error } = await supabase.auth.setSession({
						access_token: access_token,
						refresh_token: refresh_token,
					});

					if (error) {
						console.error("❌ Error with magic link:", error);
						Alert.alert(
							"Login Error",
							"Unable to sign you in. Please try again."
						);
					} else {
						console.log(
							"✅ Magic link session established:",
							data.session?.user?.email
						);
						// User is logged in normally
					}
				} else if (rawUrl && rawUrl.includes("://")) {
					// Check if it's just an empty deep link
					const urlParts = rawUrl.split("://");
					if (
						(urlParts.length > 1 && urlParts[1] === "") ||
						urlParts[1] === "/"
					) {
						console.log("⚠️ Ignoring empty deep link:", rawUrl);
					} else {
						console.log("ℹ️ Received unhandled deep link:", rawUrl);
					}
				}
			} catch (error) {
				console.error("❌ Error handling deep link:", error);
				// Don't show alert for malformed URLs, just log them
			}
		};

		// Handle initial URL if app was launched via deep link
		const getInitialUrl = async () => {
			try {
				const initialUrl = await Linking.getInitialURL();
				if (initialUrl) {
					console.log("📱 App launched with URL:", initialUrl);
					handleDeepLink(initialUrl);
				}
			} catch (error) {
				console.error("❌ Error getting initial URL:", error);
			}
		};

		getInitialUrl();

		// Listen for incoming URLs while app is running
		const subscription = Linking.addEventListener("url", (event) => {
			console.log("📱 Received URL while app running:", event.url);
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
			const { data, error } = await supabase.auth.signInWithPassword({
				email: email.trim(),
				password,
			});

			if (error) {
				console.error("Sign in error:", error);
				Alert.alert("Sign In Error", error.message);
			} else if (data.session) {
				console.log("Sign in successful:", data.session.user.email);

				// Set up RevenueCat user
				if (data.session.user.id) {
					try {
						const { customerInfo } = await Purchases.logIn(
							data.session.user.id
						);
						console.log("RevenueCat customer:", customerInfo);
					} catch (rcError) {
						console.error("RevenueCat login error:", rcError);
						// Don't block the user from continuing if RevenueCat fails
					}
				}
			}
		} catch (err) {
			console.error("Sign in exception:", err);
			Alert.alert(
				"Sign In Failed",
				err instanceof Error ? err.message : "Unexpected error occurred"
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

		if (password.length < 6) {
			Alert.alert("Error", "Password must be at least 6 characters long");
			return;
		}

		setLoading(true);
		try {
			const { data, error } = await supabase.auth.signUp({
				email: email.trim(),
				password,
				options: {
					emailRedirectTo: redirectTo,
				},
			});

			if (error) {
				console.error("Signup error:", error);
				Alert.alert("Signup Error", error.message);
			} else if (!data.session) {
				console.log("Signup initiated, confirmation email sent");
				Alert.alert(
					"Check Your Email!",
					"We've sent you a confirmation link. Please check your email and click the link to verify your account.",
					[{ text: "OK", onPress: () => setEmail("") }]
				);
			} else {
				console.log(
					"Signup created immediate session:",
					data.session.user.email
				);
				Alert.alert(
					"Welcome!",
					"Your account has been created successfully!"
				);
			}
		} catch (err) {
			console.error("Signup exception:", err);
			Alert.alert(
				"Signup Failed",
				err instanceof Error ? err.message : "Unexpected error occurred"
			);
		} finally {
			setLoading(false);
		}
	};

	const resetPassword = async () => {
		if (!email) {
			Alert.alert("Error", "Please enter your email address first");
			return;
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email.trim())) {
			Alert.alert("Error", "Please enter a valid email address");
			return;
		}

		setLoading(true);
		try {
			const { error } = await supabase.auth.resetPasswordForEmail(
				email.trim(),
				{
					redirectTo: redirectTo,
				}
			);

			if (error) {
				console.error("Reset password error:", error);
				Alert.alert("Reset Password Error", error.message);
			} else {
				console.log("📧 Password reset email sent to:", email);
				Alert.alert(
					"Reset Link Sent!",
					"Please check your email for a password reset link. Click the link to reset your password.",
					[{ text: "OK" }]
				);
			}
		} catch (err) {
			console.error("Reset password exception:", err);
			Alert.alert(
				"Reset Password Failed",
				err instanceof Error ? err.message : "Unexpected error occurred"
			);
		} finally {
			setLoading(false);
		}
	};

	// Test function for development
	const testResetPasswordScreen = () => {
		console.log("🧪 Testing ResetPassword screen navigation");
		(navigation as any).navigate("ResetPassword", {
			recovery: true,
			sessionEstablished: true,
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
						name="sports-volleyball"
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
								autoComplete="email"
								textContentType="emailAddress"
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
								autoComplete="password"
								textContentType="password"
								onSubmitEditing={signInWithEmail}
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

export default Auth;
