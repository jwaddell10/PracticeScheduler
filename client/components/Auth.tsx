import React, { useState, useEffect } from "react";
import { Alert, StyleSheet, View, AppState, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, TextInput } from "react-native";
import { supabase } from "../lib/supabase";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import theme from "./styles/theme";

export default function Auth() {
	const navigation = useNavigation();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		const subscription = AppState.addEventListener("change", (state) => {
			if (state === "active") {
				supabase.auth.startAutoRefresh();
			} else {
				supabase.auth.stopAutoRefresh();
			}
		});
		return () => subscription?.remove();
	}, []);

	async function signInWithEmail() {
		setLoading(true);
		const { error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});

		if (error) {
			Alert.alert(error.message);
		} else {
			// Navigation will be handled by the app's auth state
		}
		setLoading(false);
	}

	async function signUpWithEmail() {
		setLoading(true);
		const {
			data: { session },
			error,
		} = await supabase.auth.signUp({
			email,
			password,
		});
		console.log(error, "error");
		if (error) {
			Alert.alert(error.message);
		} else {
			if (!session)
				Alert.alert("Please check your inbox for email verification!");
		}
		setLoading(false);
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
					<MaterialIcons name="sports-soccer" size={80} color={theme.colors.primary} />
					<Text style={styles.title}>Practice Scheduler</Text>
					<Text style={styles.subtitle}>Sign in to manage your practices</Text>
				</View>

				<View style={styles.formContainer}>
					<View style={styles.inputContainer}>
						<Text style={styles.inputLabel}>Email</Text>
						<View style={styles.inputWrapper}>
							<MaterialIcons name="email" size={20} color={theme.colors.textMuted} style={styles.inputIcon} />
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
							<MaterialIcons name="lock" size={20} color={theme.colors.textMuted} style={styles.inputIcon} />
							<TextInput
								style={styles.textInput}
								onChangeText={(text: string) => setPassword(text)}
								value={password}
								placeholder="Enter your password"
								placeholderTextColor={theme.colors.textMuted}
								secureTextEntry
								autoCapitalize="none"
								returnKeyType="done"
								keyboardAppearance="dark"
								onSubmitEditing={signInWithEmail}
							/>
						</View>
					</View>

					<TouchableOpacity
						style={[styles.primaryButton, loading && styles.buttonDisabled]}
						onPress={signInWithEmail}
						disabled={loading}
						activeOpacity={0.8}
					>
						<Text style={styles.primaryButtonText}>
							{loading ? "Signing in..." : "Sign In"}
						</Text>
					</TouchableOpacity>

					<View style={styles.divider}>
						<View style={styles.dividerLine} />
						<Text style={styles.dividerText}>or</Text>
						<View style={styles.dividerLine} />
					</View>

					<TouchableOpacity
						style={[styles.secondaryButton, loading && styles.buttonDisabled]}
						onPress={signUpWithEmail}
						disabled={loading}
						activeOpacity={0.8}
					>
						<Text style={styles.secondaryButtonText}>
							{loading ? "Creating account..." : "Create Account"}
						</Text>
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
		padding: 20,
		justifyContent: 'center',
		minHeight: '100%',
	},
	header: {
		alignItems: 'center',
		marginBottom: 48,
	},
	title: {
		fontSize: 32,
		fontWeight: '700',
		color: theme.colors.textPrimary,
		marginTop: 16,
		marginBottom: 8,
		textAlign: 'center',
	},
	subtitle: {
		fontSize: 16,
		color: theme.colors.textMuted,
		textAlign: 'center',
	},
	formContainer: {
		width: '100%',
	},
	inputContainer: {
		marginBottom: 20,
	},
	inputLabel: {
		fontSize: 14,
		fontWeight: '600',
		color: theme.colors.textMuted,
		marginBottom: 8,
	},
	inputWrapper: {
		flexDirection: 'row',
		alignItems: 'center',
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
	primaryButton: {
		backgroundColor: theme.colors.primary,
		paddingVertical: 16,
		paddingHorizontal: 24,
		borderRadius: 12,
		alignItems: 'center',
		marginBottom: 16,
		shadowColor: theme.colors.primary,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 4,
		elevation: 3,
	},
	primaryButtonText: {
		color: theme.colors.white,
		fontSize: 16,
		fontWeight: '600',
	},
	secondaryButton: {
		backgroundColor: 'transparent',
		paddingVertical: 16,
		paddingHorizontal: 24,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: theme.colors.border,
		alignItems: 'center',
	},
	secondaryButtonText: {
		color: theme.colors.textPrimary,
		fontSize: 16,
		fontWeight: '600',
	},
	buttonDisabled: {
		opacity: 0.6,
	},
	divider: {
		flexDirection: 'row',
		alignItems: 'center',
		marginVertical: 24,
	},
	dividerLine: {
		flex: 1,
		height: 1,
		backgroundColor: theme.colors.border,
	},
	dividerText: {
		color: theme.colors.white,
		paddingHorizontal: 16,
		fontSize: 14,
	},
});
