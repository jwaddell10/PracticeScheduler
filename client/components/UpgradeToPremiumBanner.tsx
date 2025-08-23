import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import theme from "./styles/theme";

type RootStackParamList = {
	Home: undefined;
	Premium: undefined;
};

interface UpgradeToPremiumBannerProps {
	role?: string | null;
}

export default function UpgradeToPremiumBanner({ role }: UpgradeToPremiumBannerProps) {
	// Hide banner for premium and admin users
	if (role === "Premium" || role === "premium" || role === "admin") {
		return null;
	}
	const navigation = useNavigation<NavigationProp<RootStackParamList>>();

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
		padding: theme.padding,
		marginBottom: 24,
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
		marginBottom: 16,
	},
	icon: {
		marginRight: 12,
	},
	textContainer: {
		flex: 1,
	},
	title: {
		fontSize: 18,
		fontWeight: "700",
		color: theme.colors.textPrimary,
		marginBottom: 4,
	},
	subtitle: {
		fontSize: 14,
		color: theme.colors.textMuted,
	},
	upgradeButton: {
		backgroundColor: theme.colors.proPurple, // Match PRO button
		paddingVertical: 12,
		paddingHorizontal: 16,
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
		fontSize: 16,
	},
});
