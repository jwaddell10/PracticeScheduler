import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import theme from "./styles/theme";
import RevenueCatUI from 'react-native-purchases-ui';

export default function PremiumScreen() {
	const navigation = useNavigation();

	return (
		<View style={{ flex: 1 }}>
			<RevenueCatUI.Paywall 
			  onDismiss={() => {
				navigation.goBack()
			  }}
			/>
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