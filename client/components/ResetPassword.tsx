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
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import theme from "./styles/theme";
import { supabase } from "../lib/supabase";

interface ResetPasswordProps {
	route?: {
		params?: {
			recovery?: boolean;
			sessionEstablished?: boolean;
		};
	};
}

const ResetPassword: React.FC<ResetPasswordProps> = ({ route }) => {
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [sessionReady, setSessionReady] = useState(false);
	const [userEmail, setUserEmail] = useState<string | null>(null);
	const [passwordVisible, setPasswordVisible] = useState(false);
	const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
	const navigation = useNavigation();

	const { recovery, sessionEstablished } = route?.params || {};

	useEffect(() => {
		const checkSession = async () => {
			console.log("🔍 Checking session status...");
			console.log("🔍 Route params:", route?.params);

			try {
				// Get the current session
				const {
					data: { session },
					error,
				} = await supabase.auth.getSession();

				if (error) {
					console.error("❌ Error getting session:", error);
					Alert.alert(
						"Session Error",
						"Unable to verify your identity. Please try requesting a new password reset link.",
						[
							{
								text: "OK",
								onPress: () => navigation.goBack(),
							},
						]
					);
					return;
				}

				if (session?.user) {
					console.log(
						"✅ Valid session found for user:",
						session.user.email
					);
					setUserEmail(session.user.email || null);
					setSessionReady(true);
				} else if (__DEV__ && sessionEstablished) {
					// Development mode: allow testing without real session
					console.log(
						"🧪 Development mode: simulating session for testing"
					);
					setUserEmail("test@example.com");
					setSessionReady(true);
				} else {
					console.error("❌ No valid session found");
					Alert.alert(
						"Session Expired",
						"Your password reset session has expired. Please request a new password reset link.",
						[
							{
								text: "OK",
								onPress: () => navigation.goBack(),
							},
						]
					);
				}
			} catch (err) {
				console.error("❌ Session check failed:", err);
				Alert.alert(
					"Session Error",
					"Unable to verify your session. Please try again.",
					[
						{
							text: "OK",
							onPress: () => navigation.goBack(),
						},
					]
				);
			}
		};

		// Small delay to ensure the session is properly established
		const timer = setTimeout(() => {
			checkSession();
		}, 500);

		return () => clearTimeout(timer);
	}, [route?.params, navigation]);

	const validatePassword = (
		password: string
	): { isValid: boolean; message?: string } => {
		if (!password) {
			return { isValid: false, message: "Password is required" };
		}
		if (password.length < 6) {
			return {
				isValid: false,
				message: "Password must be at least 6 characters long",
			};
		}
		if (password.length > 72) {
			return {
				isValid: false,
				message: "Password must be less than 72 characters long",
			};
		}
		// Add more password strength requirements if needed
		// const hasUpperCase = /[A-Z]/.test(password);
		// const hasLowerCase = /[a-z]/.test(password);
		// const hasNumbers = /\d/.test(password);
		// const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

		return { isValid: true };
	};

	const updatePassword = async () => {
		console.log("🔄 Attempting to update password...");

		if (!sessionReady) {
			Alert.alert("Error", "Session not ready. Please try again.");
			return;
		}

		// Validate inputs
		const passwordValidation = validatePassword(newPassword);
		if (!passwordValidation.isValid) {
			Alert.alert("Invalid Password", passwordValidation.message);
			return;
		}

		if (!confirmPassword) {
			Alert.alert("Error", "Please confirm your new password");
			return;
		}

		if (newPassword !== confirmPassword) {
			Alert.alert(
				"Password Mismatch",
				"The passwords you entered do not match"
			);
			return;
		}

		setLoading(true);

		try {
			console.log("🔄 Updating password for user:", userEmail);

			// Handle test case in development mode
			if (__DEV__ && userEmail === "test@example.com") {
				console.log("🧪 Development mode: simulating password update");
				await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate network delay
				Alert.alert(
					"Test Success",
					"Password update simulated successfully! (This is a test)",
					[
						{
							text: "OK",
							onPress: () => navigation.goBack(),
						},
					]
				);
				return;
			}

			// Update the password using the current session
			const { error } = await supabase.auth.updateUser({
				password: newPassword,
			});

			if (error) {
				console.error("❌ Password update error:", error);

				// Handle specific error cases
				if (error.message.includes("session_not_found")) {
					Alert.alert(
						"Session Expired",
						"Your password reset session has expired. Please request a new password reset link.",
						[{ text: "OK", onPress: () => navigation.goBack() }]
					);
				} else {
					Alert.alert("Password Update Error", error.message);
				}
			} else {
				console.log("✅ Password updated successfully");

				// Clear the form
				setNewPassword("");
				setConfirmPassword("");

				// Sign out the user after password reset to ensure security
				await supabase.auth.signOut();
				console.log("🚪 User signed out after password reset");

				Alert.alert(
					"Password Updated!",
					"Your password has been updated successfully! Please sign in with your new password.",
					[
						{
							text: "OK",
							onPress: () => {
								// Navigate back to the auth screen
								navigation.goBack();
							},
						},
					]
				);
			}
		} catch (err) {
			console.error("❌ Password update exception:", err);
			Alert.alert(
				"Update Failed",
				err instanceof Error
					? err.message
					: "An unexpected error occurred. Please try again."
			);
		} finally {
			setLoading(false);
		}
	};

	const handleCancel = async () => {
		// Sign out the user when they cancel to prevent unintended login
		try {
			await supabase.auth.signOut();
			console.log("🚪 User signed out on cancel");
		} catch (err) {
			console.error("❌ Error signing out on cancel:", err);
		}
		navigation.goBack();
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
						name="lock-reset"
						size={80}
						color={theme.colors.primary}
					/>
					<Text style={styles.title}>Reset Your Password</Text>
					<Text style={styles.subtitle}>
						{sessionReady
							? `Create a new password for ${userEmail}`
							: "Verifying your identity..."}
					</Text>
				</View>

				{sessionReady && (
					<View style={styles.formContainer}>
						<View style={styles.inputContainer}>
							<Text style={styles.inputLabel}>New Password</Text>
							<View style={styles.inputWrapper}>
								<MaterialIcons
									name="lock"
									size={20}
									color={theme.colors.textMuted}
									style={styles.inputIcon}
								/>
								<TextInput
									style={styles.textInput}
									onChangeText={setNewPassword}
									value={newPassword}
									placeholder="Enter new password (min 6 characters)"
									placeholderTextColor={
										theme.colors.textMuted
									}
									secureTextEntry={!passwordVisible}
									autoCapitalize="none"
									returnKeyType="next"
									keyboardAppearance="dark"
									autoFocus={true}
									autoComplete="new-password"
									textContentType="newPassword"
								/>
								<TouchableOpacity
									onPress={() =>
										setPasswordVisible(!passwordVisible)
									}
									style={styles.eyeIcon}
								>
									<MaterialIcons
										name={
											passwordVisible
												? "visibility-off"
												: "visibility"
										}
										size={20}
										color={theme.colors.textMuted}
									/>
								</TouchableOpacity>
							</View>
						</View>

						<View style={styles.inputContainer}>
							<Text style={styles.inputLabel}>
								Confirm New Password
							</Text>
							<View style={styles.inputWrapper}>
								<MaterialIcons
									name="lock"
									size={20}
									color={theme.colors.textMuted}
									style={styles.inputIcon}
								/>
								<TextInput
									style={styles.textInput}
									onChangeText={setConfirmPassword}
									value={confirmPassword}
									placeholder="Confirm your new password"
									placeholderTextColor={
										theme.colors.textMuted
									}
									secureTextEntry={!confirmPasswordVisible}
									autoCapitalize="none"
									returnKeyType="done"
									keyboardAppearance="dark"
									onSubmitEditing={updatePassword}
									autoComplete="new-password"
									textContentType="newPassword"
								/>
								<TouchableOpacity
									onPress={() =>
										setConfirmPasswordVisible(
											!confirmPasswordVisible
										)
									}
									style={styles.eyeIcon}
								>
									<MaterialIcons
										name={
											confirmPasswordVisible
												? "visibility-off"
												: "visibility"
										}
										size={20}
										color={theme.colors.textMuted}
									/>
								</TouchableOpacity>
							</View>
						</View>

						{/* Password requirements info */}
						<View style={styles.passwordRequirements}>
							<Text style={styles.requirementsTitle}>
								Password Requirements:
							</Text>
							<Text style={styles.requirementText}>
								• At least 6 characters long
							</Text>
							<Text style={styles.requirementText}>
								• Less than 72 characters
							</Text>
						</View>

						<TouchableOpacity
							style={[
								styles.button,
								styles.updatePasswordButton,
								(!newPassword ||
									!confirmPassword ||
									newPassword !== confirmPassword) &&
									styles.disabledButton,
							]}
							onPress={updatePassword}
							disabled={
								loading ||
								!newPassword ||
								!confirmPassword ||
								newPassword !== confirmPassword
							}
						>
							<Text
								style={[
									styles.buttonText,
									(!newPassword ||
										!confirmPassword ||
										newPassword !== confirmPassword) &&
										styles.disabledButtonText,
								]}
							>
								{loading
									? "Updating Password..."
									: "Update Password"}
							</Text>
						</TouchableOpacity>

						<TouchableOpacity
							style={styles.cancelButton}
							onPress={handleCancel}
							disabled={loading}
						>
							<Text style={styles.cancelButtonText}>Cancel</Text>
						</TouchableOpacity>
					</View>
				)}

				{!sessionReady && (
					<View style={styles.loadingContainer}>
						<MaterialIcons
							name="hourglass-empty"
							size={32}
							color={theme.colors.textMuted}
							style={styles.loadingIcon}
						/>
						<Text style={styles.loadingText}>
							Verifying your password reset link...
						</Text>
						<Text style={styles.loadingSubtext}>
							This may take a few moments
						</Text>
					</View>
				)}
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
		textAlign: "center",
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
	eyeIcon: {
		padding: 4,
	},
	passwordRequirements: {
		backgroundColor: theme.colors.surface,
		borderRadius: 8,
		padding: 12,
		marginBottom: 20,
	},
	requirementsTitle: {
		fontSize: 14,
		fontWeight: "600",
		color: theme.colors.textPrimary,
		marginBottom: 6,
	},
	requirementText: {
		fontSize: 13,
		color: theme.colors.textMuted,
		lineHeight: 18,
	},
	button: {
		paddingVertical: 16,
		paddingHorizontal: 24,
		borderRadius: 12,
		alignItems: "center",
		marginBottom: 12,
	},
	updatePasswordButton: {
		backgroundColor: theme.colors.primary,
		marginTop: 10,
	},
	disabledButton: {
		backgroundColor: theme.colors.textMuted,
		opacity: 0.6,
	},
	buttonText: {
		fontSize: 16,
		fontWeight: "600",
		color: theme.colors.white,
	},
	disabledButtonText: {
		color: theme.colors.background,
	},
	cancelButton: {
		alignItems: "center",
		paddingVertical: 12,
	},
	cancelButtonText: {
		fontSize: 14,
		color: theme.colors.textMuted,
		textDecorationLine: "underline",
	},
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
	},
	loadingIcon: {
		marginBottom: 16,
	},
	loadingText: {
		color: theme.colors.textMuted,
		fontSize: 16,
		textAlign: "center",
		marginBottom: 8,
	},
	loadingSubtext: {
		color: theme.colors.textMuted,
		fontSize: 14,
		textAlign: "center",
		opacity: 0.7,
	},
});

export default ResetPassword;
