import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { StyleSheet, View, Alert, Text, ScrollView, TouchableOpacity, Linking } from "react-native";
import { Button, Input } from "@rneui/themed";
import { Session } from "@supabase/supabase-js";
import { MaterialIcons } from "@expo/vector-icons";
import theme from "./styles/theme";
import { useSubscription } from "../context/UserRoleContext";
import UpgradeToPremiumBanner from "./UpgradeToPremiumBanner";
import ContactUs from "./ContactUs";

export default function Account({ session }: { session: Session | null }) {
	const [loading, setLoading] = useState(true);
	const [email, setEmail] = useState("");
	const [drills, setDrills] = useState("");
	const { isSubscriber, subscriptionStatus, loading: subscriptionLoading } = useSubscription();

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

 		async function deleteAccount() {
		Alert.alert(
			"Delete Account",
			"Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data including drills, practices, and account information.",
			[
				{
					text: "Cancel",
					style: "cancel",
				},
				{
					text: "Delete",
					style: "destructive",
					onPress: async () => {
						try {
							setLoading(true);
							if (!session?.user) throw new Error("No user on the session!");

							// First, delete user data from the User table
							const { error: userError } = await supabase
								.from("User")
								.delete()
								.eq("id", session.user.id);

							if (userError) {
								throw userError;
							}

							// Then delete the auth user
							const { error: authError } = await supabase.auth.admin.deleteUser(
								session.user.id
							);

							if (authError) {
								throw authError;
							}

							Alert.alert("Account Deleted", "Your account has been successfully deleted.");
						} catch (error) {
							if (error instanceof Error) {
								Alert.alert("Error", `Failed to delete account: ${error.message}`);
							}
						} finally {
							setLoading(false);
						}
					},
				},
			]
		);
	}

	return (
		<ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
			<View style={styles.header}>
				<MaterialIcons name="account-circle" size={50} color={theme.colors.primary} />
				<Text style={styles.headerTitle}>Account</Text>
				<Text style={styles.headerSubtitle}>Manage your profile and settings</Text>
			</View>

			{/* Show Upgrade Banner for non-active subscribers */}
			{!subscriptionLoading && subscriptionStatus !== 'active' && <UpgradeToPremiumBanner role={isSubscriber ? "premium" : "free"} />}

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
							subscriptionStatus === 'active' && styles.premiumRoleText
						]}>
							{subscriptionStatus === 'active' ? "Premium" : subscriptionStatus === 'expired' ? "Expired" : "Free"}
						</Text>
						{subscriptionStatus === 'active' && (
							<MaterialIcons name="verified" size={20} color={theme.colors.proPurple} />
						)}
					</View>
				</View>
			</View>

			<ContactUs />

			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Account Actions</Text>
				
				<TouchableOpacity style={styles.actionButton} onPress={() => supabase.auth.signOut()}>
					<MaterialIcons name="logout" size={24} color={theme.colors.error} />
					<Text style={styles.actionButtonText}>Sign Out</Text>
				</TouchableOpacity>

				<TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={deleteAccount}>
					<MaterialIcons name="delete-forever" size={24} color={theme.colors.error} />
					<Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete Account</Text>
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
		marginBottom: 20,
		paddingTop: 10,
	},
	headerTitle: {
		fontSize: 24,
		fontWeight: '700',
		color: theme.colors.textPrimary,
		marginTop: 6,
		marginBottom: 6,
	},
	headerSubtitle: {
		fontSize: 14,
		color: theme.colors.textMuted,
		textAlign: 'center',
	},
	section: {
		marginBottom: 20,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: '600',
		color: theme.colors.textPrimary,
		marginBottom: 12,
	},
	inputContainer: {
		marginBottom: 12,
	},
	inputLabel: {
		fontSize: 13,
		fontWeight: '600',
		color: theme.colors.textMuted,
		marginBottom: 6,
	},
	emailDisplay: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		backgroundColor: theme.colors.surface,
		padding: 12,
		borderRadius: 10,
		borderWidth: 1,
		borderColor: theme.colors.border,
	},
	emailText: {
		fontSize: 15,
		color: theme.colors.textPrimary,
		flex: 1,
	},
	roleDisplay: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		backgroundColor: theme.colors.surface,
		padding: 12,
		borderRadius: 10,
		borderWidth: 1,
		borderColor: theme.colors.border,
	},
	roleText: {
		fontSize: 15,
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
		padding: 12,
		borderRadius: 10,
		borderWidth: 1,
		borderColor: theme.colors.error,
		marginBottom: 12,
	},
	actionButtonText: {
		fontSize: 16,
		color: theme.colors.error,
		fontWeight: '600',
		marginLeft: 12,
	},
	deleteButton: {
		backgroundColor: theme.colors.error + '10',
		borderColor: theme.colors.error,
	},
	deleteButtonText: {
		color: theme.colors.error,
		fontWeight: '700',
	},
});
