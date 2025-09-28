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

				if (session && session.user) {
					console.log(
						"✅ Valid session found for user:",
						session.user.email
					);
					setUserEmail(session.user.email || null);
					setSessionReady(true);
				} else {
					console.error("❌ No valid session found");
					Alert.alert(
						"Session Error",
						"No valid session found. Please try clicking the password reset link in your email again.",
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

		// Small delay to ensure the session is properly set
		const timer = setTimeout(() => {
			checkSession();
		}, 1000);

		return () => clearTimeout(timer);
	}, [route?.params, navigation]);

	const updatePassword = async () => {
		console.log("🔄 Attempting to update password...");

		if (!sessionReady) {
			Alert.alert("Error", "Session not ready. Please try again.");
			return;
		}

		if (!newPassword || !confirmPassword) {
			Alert.alert(
				"Error",
				"Please enter both new password and confirmation"
			);
			return;
		}

		if (newPassword !== confirmPassword) {
			Alert.alert("Error", "Passwords do not match");
			return;
		}

		if (newPassword.length < 6) {
			Alert.alert("Error", "Password must be at least 6 characters");
			return;
		}

		setLoading(true);

		try {
			console.log("🔄 Updating password for user:", userEmail);

			// Update the password using the current session
			const { data, error } = await supabase.auth.updateUser({
				password: newPassword,
			});

			if (error) {
				console.error("❌ Password update error:", error);
				Alert.alert("Password Update Error", error.message);
			} else {
				console.log("✅ Password updated successfully");

				// Important: Sign out the user after password reset
				// This prevents them from being automatically logged in
				await supabase.auth.signOut();
				console.log("🚪 User signed out after password reset");

				Alert.alert(
					"Success",
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
				"Password Update Failed",
				err instanceof Error ? err.message : "Unexpected error occurred"
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
							? "Enter your new password below"
							: "Verifying recovery link..."}
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
									placeholder="Enter new password"
									placeholderTextColor={
										theme.colors.textMuted
									}
									secureTextEntry={true}
									autoCapitalize="none"
									returnKeyType="next"
									keyboardAppearance="dark"
									autoFocus={true}
								/>
							</View>
						</View>

						<View style={styles.inputContainer}>
							<Text style={styles.inputLabel}>
								Confirm Password
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
									placeholder="Confirm new password"
									placeholderTextColor={
										theme.colors.textMuted
									}
									secureTextEntry={true}
									autoCapitalize="none"
									returnKeyType="done"
									keyboardAppearance="dark"
									onSubmitEditing={updatePassword}
								/>
							</View>
						</View>

						<TouchableOpacity
							style={[styles.button, styles.updatePasswordButton]}
							onPress={updatePassword}
							disabled={loading}
						>
							<Text style={styles.buttonText}>
								{loading ? "Updating..." : "Update Password"}
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
						<Text style={styles.loadingText}>
							Verifying recovery link...
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
	buttonText: {
		fontSize: 16,
		fontWeight: "600",
		color: theme.colors.white,
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
	loadingText: {
		color: theme.colors.textMuted,
		fontSize: 16,
		textAlign: "center",
	},
});

export default ResetPassword;
