import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import theme from "./styles/theme";

type RootStackParamList = {
	Home: undefined;
	Premium: undefined;
};

export default function UpgradeToPremiumBanner() {
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
					color={theme.colors.accent}
					style={styles.icon}
				/>
				<View style={styles.textColumn}>
					<Text style={styles.title}>Upgrade to Premium</Text>
					<Text style={styles.subtitle}>
						Get advanced features to power up your coaching!
					</Text>
				</View>
			</View>
			<TouchableOpacity
				style={styles.upgradeButton}
				onPress={handleUpgrade}
			>
				<Text style={styles.buttonText}>Upgrade</Text>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	bannerContainer: {
		backgroundColor: theme.colors.primaryDark,
		borderRadius: theme.roundness,
		padding: theme.padding,
		marginBottom: 24,
		flexDirection: "column", // vertical stacking
		justifyContent: "center",
	},
	topRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 16, // space between top row and button
	},
	icon: {
		marginRight: 12,
	},
	textColumn: {
		flexDirection: "column",
	},
	title: {
		fontSize: 18,
		fontWeight: "700",
		color: theme.colors.accent,
		marginBottom: 4,
	},
	subtitle: {
		fontSize: 14,
		color: theme.colors.textPrimary,
	},
	upgradeButton: {
		backgroundColor: theme.colors.accent,
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderRadius: 8,
		alignItems: "center",
		// button spans full width of container
		width: "100%",
	},
	buttonText: {
		color: theme.colors.background,
		fontWeight: "700",
		fontSize: 16,
	},
});
