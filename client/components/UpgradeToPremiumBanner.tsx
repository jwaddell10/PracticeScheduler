import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import theme from "./styles/theme";
import { checkSubscription } from "../context/UserRoleContext";

type RootStackParamList = {
	Home: undefined;
	Premium: undefined;
};

interface UpgradeToPremiumBannerProps {
	// No longer need role prop since we check subscription directly
}

export default function UpgradeToPremiumBanner({}: UpgradeToPremiumBannerProps) {
	const [isPremium, setIsPremium] = useState(false);
	const [loading, setLoading] = useState(true);
	const navigation = useNavigation<NavigationProp<RootStackParamList>>();

	useEffect(() => {
		const checkUserSubscription = async () => {
			const hasPremium = await checkSubscription();
			setIsPremium(hasPremium);
			setLoading(false);
		};
		checkUserSubscription();
	}, []);

	// Hide banner for premium users
	if (loading) {
		return null; // Don't show anything while loading
	}

	if (isPremium) {
		return null;
	}

	const handleUpgrade = () => {
		navigation.navigate("Premium");
	};

	return (
		<View style={styles.bannerContainer}>
			<View style={styles.topRow}>
				<MaterialCommunityIcons
					name="crown"
					size={28}
					color={theme.colors.proPurple} // Use consistent color
					style={styles.icon}
				/>
				<View style={styles.textContainer}>
					<Text style={styles.title}>Upgrade to Premium</Text>
					<Text style={styles.subtitle}>
						Get access to premium drills and advanced features.
					</Text>
				</View>
			</View>

			<TouchableOpacity
				style={styles.upgradeButton}
				onPress={handleUpgrade}
			>
				<Text style={styles.upgradeButtonText}>Upgrade</Text>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	bannerContainer: {
		backgroundColor: theme.colors.surface,
		borderRadius: theme.roundness,
		padding: 12,
		marginBottom: 16,
		borderWidth: 1,
		borderColor: theme.colors.border,
		shadowColor: theme.colors.surface,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
		width: "100%",
	},
	topRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 12,
	},
	icon: {
		marginRight: 10,
	},
	textContainer: {
		flex: 1,
	},
	title: {
		fontSize: 16,
		fontWeight: "700",
		color: theme.colors.textPrimary,
		marginBottom: 3,
	},
	subtitle: {
		fontSize: 13,
		color: theme.colors.textMuted,
	},
	upgradeButton: {
		backgroundColor: theme.colors.proPurple, // Match PRO button
		paddingVertical: 10,
		paddingHorizontal: 14,
		borderRadius: 8,
		alignItems: "center",
		width: "100%",
		shadowColor: theme.colors.proPurple,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 4,
		elevation: 3,
	},
	upgradeButtonText: {
		color: theme.colors.white,
		fontWeight: "700",
		fontSize: 15,
	},
});
