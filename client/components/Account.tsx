import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { StyleSheet, View, Alert, Text, ScrollView, TouchableOpacity } from "react-native";
import { Button, Input } from "@rneui/themed";
import { Session } from "@supabase/supabase-js";
import { MaterialIcons } from "@expo/vector-icons";
import theme from "./styles/theme";
import { useUserRole } from "../hooks/useUserRole";
import UpgradeToPremiumBanner from "./UpgradeToPremiumBanner";

export default function Account({ session }: { session: Session | null }) {
	const [loading, setLoading] = useState(true);
	const [email, setEmail] = useState("");
	const [drills, setDrills] = useState("");
	const { role, loading: roleLoading } = useUserRole();
	
	// Debug: Log the role to see what's being returned
	useEffect(() => {
		console.log('Account - User role:', role);
		console.log('Account - Role loading:', roleLoading);
	}, [role, roleLoading]);
	// const [website, setWebsite] = useState("");
	// const [avatarUrl, setAvatarUrl] = useState("");

	useEffect(() => {
		if (session) getProfile();
	}, [session]);

	async function getProfile() {
		try {
			setLoading(true);
			if (!session?.user) throw new Error("No user on the session!");

			const { data, error, status } = await supabase
				.from("User")
				.select(`email, teams, drills`)
				.eq("id", session?.user.id)
				.single();
			if (error && status !== 406) {
				throw error;
			}
			if (data) {
				setEmail(data.email);
				// setWebsite(data.teams);
				setDrills(data.drills);
			}
		} catch (error) {
			if (error instanceof Error) {
				Alert.alert(error.message);
			}
		} finally {
			setLoading(false);
		}
	}

	async function updateProfile({
		username,
		website,
		avatar_url,
	}: {
		username: string;
		website: string;
		avatar_url: string;
	}) {
		try {
			setLoading(true);
			if (!session?.user) throw new Error("No user on the session!");

			const updates = {
				id: session?.user.id,
			};

			const { error } = await supabase.from("User").upsert(updates);

			if (error) {
				throw error;
			}
		} catch (error) {
			if (error instanceof Error) {
				Alert.alert(error.message);
			}
		} finally {
			setLoading(false);
		}
	}

	return (
		<ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
			<View style={styles.header}>
				<MaterialIcons name="account-circle" size={60} color={theme.colors.primary} />
				<Text style={styles.headerTitle}>Account</Text>
				<Text style={styles.headerSubtitle}>Manage your profile and settings</Text>
			</View>

			{/* Show Upgrade Banner for non-premium users */}
			{!roleLoading && role !== "Premium" && role !== "premium" && <UpgradeToPremiumBanner />}

			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Profile Information</Text>
				
				<View style={styles.inputContainer}>
					<Text style={styles.inputLabel}>Email</Text>
					<View style={styles.emailDisplay}>
						<Text style={styles.emailText}>{session?.user?.email}</Text>
						<MaterialIcons name="email" size={20} color={theme.colors.textMuted} />
					</View>
				</View>

				<View style={styles.inputContainer}>
					<Text style={styles.inputLabel}>Account Type</Text>
					<View style={styles.roleDisplay}>
						<Text style={[
							styles.roleText,
							(role === "Premium" || role === "premium") && styles.premiumRoleText
						]}>
							{role || "Free"}
						</Text>
						{(role === "Premium" || role === "premium") && (
							<MaterialIcons name="verified" size={20} color={theme.colors.proPurple} />
						)}
					</View>
				</View>
			</View>

			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Account Actions</Text>
				
				<TouchableOpacity style={styles.actionButton} onPress={() => supabase.auth.signOut()}>
					<MaterialIcons name="logout" size={24} color={theme.colors.error} />
					<Text style={styles.actionButtonText}>Sign Out</Text>
				</TouchableOpacity>
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: theme.colors.background,
		padding: 20,
	},
	header: {
		alignItems: 'center',
		marginBottom: 32,
		paddingTop: 60,
	},
	headerTitle: {
		fontSize: 28,
		fontWeight: '700',
		color: theme.colors.textPrimary,
		marginTop: 16,
		marginBottom: 8,
	},
	headerSubtitle: {
		fontSize: 16,
		color: theme.colors.textMuted,
		textAlign: 'center',
	},
	section: {
		marginBottom: 32,
	},
	sectionTitle: {
		fontSize: 20,
		fontWeight: '600',
		color: theme.colors.textPrimary,
		marginBottom: 16,
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
	emailDisplay: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		backgroundColor: theme.colors.surface,
		padding: 16,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: theme.colors.border,
	},
	emailText: {
		fontSize: 16,
		color: theme.colors.textPrimary,
		flex: 1,
	},
	roleDisplay: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		backgroundColor: theme.colors.surface,
		padding: 16,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: theme.colors.border,
	},
	roleText: {
		fontSize: 16,
		color: theme.colors.textPrimary,
		fontWeight: '500',
	},
	premiumRoleText: {
		color: theme.colors.proPurple,
		fontWeight: '600',
	},
	actionButton: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: theme.colors.surface,
		padding: 16,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: theme.colors.error,
	},
	actionButtonText: {
		fontSize: 16,
		color: theme.colors.error,
		fontWeight: '600',
		marginLeft: 12,
	},
});
