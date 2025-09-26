import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import theme from "./styles/theme";

export default function PremiumScreen() {
	const navigation = useNavigation();

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Premium Features</Text>
			<Text style={styles.subtitle}>Coming Soon</Text>
			<Text style={styles.description}>
				Premium features will be available here once RevenueCat is properly configured.
			</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: theme.colors.background,
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
	},
	title: {
		fontSize: 24,
		fontWeight: "bold",
		color: theme.colors.textPrimary,
		marginBottom: 10,
	},
	subtitle: {
		fontSize: 18,
		color: theme.colors.primary,
		marginBottom: 20,
	},
	description: {
		fontSize: 16,
		color: theme.colors.textMuted,
		textAlign: "center",
		lineHeight: 24,
	},
});