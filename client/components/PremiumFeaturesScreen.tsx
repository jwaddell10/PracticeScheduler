import React, { useState, useEffect } from "react";
import { View, StyleSheet, Alert, Text, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import RevenueCatUI from "react-native-purchases-ui";
import Purchases, { CustomerInfo, PurchasesOffering } from "react-native-purchases";
import theme from "./styles/theme";

export default function PremiumScreen() {
	const navigation = useNavigation();
	const [offering, setOffering] = useState<PurchasesOffering | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchOfferings = async () => {
			try {
				setLoading(true);
				setError(null);
				
				// Wait a bit for RevenueCat to be initialized
				await new Promise(resolve => setTimeout(resolve, 1000));
				
				const offerings = await Purchases.getOfferings();
				if (offerings.current) {
					setOffering(offerings.current);
				} else {
					setError("No premium offerings available at this time.");
				}
			} catch (error) {
				console.error('Error fetching offerings:', error);
				
				// Check if it's a configuration error
				const errorMessage = error instanceof Error ? error.message : 'Unknown error';
				if (errorMessage.includes('configuration') || errorMessage.includes('App Store Connect')) {
					setError("Premium features are currently being set up. Please check back later or contact support.");
				} else {
					setError("Unable to load premium features. Please try again later.");
				}
				
				// If still not initialized, try again after a longer delay
				setTimeout(async () => {
					try {
						const offerings = await Purchases.getOfferings();
						if (offerings.current) {
							setOffering(offerings.current);
							setError(null);
						}
					} catch (retryError) {
						console.error('Error fetching offerings on retry:', retryError);
						// Don't update error message on retry to avoid confusing the user
					}
				}, 3000);
			} finally {
				setLoading(false);
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

	const handleRetry = () => {
		// Reset state and try again
		setOffering(null);
		setError(null);
		setLoading(true);
		
		// Re-fetch offerings
		setTimeout(async () => {
			try {
				const offerings = await Purchases.getOfferings();
				if (offerings.current) {
					setOffering(offerings.current);
					setError(null);
				} else {
					setError("No premium offerings available at this time.");
				}
			} catch (error) {
				console.error('Error fetching offerings on retry:', error);
				setError("Unable to load premium features. Please try again later.");
			} finally {
				setLoading(false);
			}
		}, 1000);
	};

	if (loading) {
		return (
			<View style={styles.container}>
				<View style={styles.loadingContainer}>
					<Text style={styles.loadingText}>Loading premium features...</Text>
				</View>
			</View>
		);
	}

	if (error) {
		return (
			<View style={styles.container}>
				<View style={styles.errorContainer}>
					<Text style={styles.errorTitle}>Premium Features Unavailable</Text>
					<Text style={styles.errorText}>{error}</Text>
					<TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
						<Text style={styles.retryButtonText}>Try Again</Text>
					</TouchableOpacity>
					<TouchableOpacity style={styles.backButton} onPress={handleDismiss}>
						<Text style={styles.backButtonText}>Go Back</Text>
					</TouchableOpacity>
				</View>
			</View>
		);
	}

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
					<Text style={styles.loadingText}>No premium offerings available</Text>
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
	errorContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
	},
	errorTitle: {
		fontSize: 20,
		fontWeight: "bold",
		color: theme.colors.textPrimary,
		marginBottom: 10,
		textAlign: "center",
	},
	errorText: {
		fontSize: 16,
		color: theme.colors.textMuted,
		textAlign: "center",
		marginBottom: 30,
		lineHeight: 24,
	},
	retryButton: {
		backgroundColor: theme.colors.primary,
		paddingHorizontal: 30,
		paddingVertical: 12,
		borderRadius: 8,
		marginBottom: 15,
	},
	retryButtonText: {
		color: "#ffffff",
		fontSize: 16,
		fontWeight: "600",
	},
	backButton: {
		backgroundColor: "transparent",
		paddingHorizontal: 30,
		paddingVertical: 12,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: theme.colors.border,
	},
	backButtonText: {
		color: theme.colors.textPrimary,
		fontSize: 16,
		fontWeight: "600",
	},
});
