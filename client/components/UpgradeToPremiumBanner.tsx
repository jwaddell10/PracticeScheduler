import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions } from "react-native";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import theme from "./styles/theme";
import { useSubscription } from "../context/UserRoleContext";

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
	const { refreshSubscription } = useSubscription();
	
	// Get screen dimensions to determine if it's a tablet/iPad
	const { width: screenWidth } = Dimensions.get('window');
	const isTablet = screenWidth >= 700; // iPad starts at 768px width

	const handleUpgrade = () => {
		navigation.navigate("Premium");
	};

	const handleRefresh = () => {
		console.log('🔄 Manually refreshing subscription status');
		refreshSubscription();
	};

	return (
		<View style={[
			styles.bannerContainer,
			isTablet && styles.bannerContainerTablet
		]}>
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
				style={[
					styles.upgradeButton,
					isTablet && styles.upgradeButtonTablet
				]}
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
	bannerContainerTablet: {
		width: "50%",
		alignSelf: "center",
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
	upgradeButtonTablet: {
		width: "100%", // Button stays full width within the 50% container
	},
	upgradeButtonText: {
		color: theme.colors.white,
		fontWeight: "700",
		fontSize: 15,
	},
});
