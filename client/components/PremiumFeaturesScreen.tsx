import React, { useState, useEffect } from "react";
import { View, StyleSheet, Alert, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import RevenueCatUI from "react-native-purchases-ui";
import Purchases, { CustomerInfo, PurchasesOffering } from "react-native-purchases";
import theme from "./styles/theme";

export default function PremiumScreen() {
	const navigation = useNavigation();
	const [offering, setOffering] = useState<PurchasesOffering | null>(null);

	useEffect(() => {
		const fetchOfferings = async () => {
			try {
				// Wait a bit for RevenueCat to be initialized
				await new Promise(resolve => setTimeout(resolve, 1000));
				
				const offerings = await Purchases.getOfferings();
				if (offerings.current) {
					setOffering(offerings.current);
				}
			} catch (error) {
				console.error('Error fetching offerings:', error);
				// If still not initialized, try again after a longer delay
				setTimeout(async () => {
					try {
						const offerings = await Purchases.getOfferings();
						if (offerings.current) {
							setOffering(offerings.current);
						}
					} catch (retryError) {
						console.error('Error fetching offerings on retry:', retryError);
					}
				}, 3000);
			}
		};

		fetchOfferings();
	}, []);

	const handleDismiss = () => {
		// Navigate back when paywall is dismissed
		navigation.goBack();
	};

	const handleRestoreCompleted = ({
		customerInfo,
	}: {
		customerInfo: CustomerInfo;
	}) => {
		// Check if user has premium entitlements after restore
		const hasPremium =
			customerInfo.entitlements.active["premium"] !== undefined;
		const hasAdmin =
			customerInfo.entitlements.active["admin"] !== undefined;

		if (hasPremium || hasAdmin) {
			Alert.alert(
				"Welcome Back!",
				"Your premium subscription has been restored."
			);
		}
	};

	return (
		<View style={styles.container}>
			{offering ? (
				<RevenueCatUI.Paywall
					options={{
						offering: offering,
					}}
					onRestoreCompleted={handleRestoreCompleted}
					onDismiss={handleDismiss}
				/>
			) : (
				<View style={styles.loadingContainer}>
					<Text style={styles.loadingText}>{offering}</Text>
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: theme.colors.background,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
	},
	loadingText: {
		fontSize: 16,
		color: theme.colors.textMuted,
		textAlign: "center",
	},
});
