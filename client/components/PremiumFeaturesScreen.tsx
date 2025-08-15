import React from "react";
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import theme from "./styles/theme";

export default function PremiumScreen() {
	const navigation = useNavigation();

	const features = [
		{
			title: "Access to Premium Drill Library",
			description: "Unlock thousands of professional drills",
			icon: "library-books"
		},
		{
			title: "Unlimited Drill Creation",
			description: "Create as many custom drills as you need",
			icon: "add-circle"
		},
		{
			title: "Add Pictures to Drills",
			description: "Include visual aids in your drill instructions",
			icon: "photo-library"
		},
		{
			title: "Priority Support",
			description: "Get help when you need it most",
			icon: "support-agent"
		},
	];

	return (
		<ScrollView style={styles.container}>
			<View style={styles.header}>
				<MaterialIcons
					name="star"
					size={48}
					color={theme.colors.secondary}
					style={styles.crownIcon}
				/>
				<Text style={styles.headerTitle}>Upgrade to Premium</Text>
				<Text style={styles.subheader}>
					Unlock the full coaching toolkit and take your team to the next level
				</Text>
			</View>

			<View style={styles.featuresContainer}>
				{features.map((feature, index) => (
					<View key={index} style={styles.featureCard}>
						<View style={styles.iconContainer}>
							<MaterialIcons
								name={feature.icon as any}
								size={24}
								color={theme.colors.primary}
							/>
						</View>
						<View style={styles.featureContent}>
							<Text style={styles.featureTitle}>{feature.title}</Text>
							<Text style={styles.featureDescription}>{feature.description}</Text>
						</View>
					</View>
				))}
			</View>

			<TouchableOpacity
				style={styles.upgradeButton}
				onPress={() => {
					Alert.alert(
						"Coming Soon!",
						"Premium features are currently in development. Stay tuned for updates!",
						[{ text: "OK", style: "default" }]
					);
				}}
			>
				<Text style={styles.upgradeButtonText}>Upgrade Now</Text>
			</TouchableOpacity>

			<TouchableOpacity
				style={styles.backButton}
				onPress={() => navigation.goBack()}
			>
				<Text style={styles.backButtonText}>Maybe Later</Text>
			</TouchableOpacity>
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
		alignItems: "center",
		paddingVertical: 40,
		paddingHorizontal: 20,
	},
	crownIcon: {
		marginBottom: 16,
	},
	headerTitle: {
		fontSize: 28,
		fontWeight: "700",
		color: theme.colors.textPrimary,
		marginBottom: 12,
		textAlign: "center",
	},
	subheader: {
		fontSize: 16,
		color: theme.colors.textMuted,
		textAlign: "center",
		lineHeight: 24,
	},
	featuresContainer: {
		marginTop: 20,
	},
	featureCard: {
		flexDirection: "row",
		backgroundColor: theme.colors.surface,
		borderRadius: 12,
		padding: 16,
		marginBottom: 12,
		borderWidth: 1,
		borderColor: theme.colors.border,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	iconContainer: {
		width: 48,
		height: 48,
		borderRadius: 24,
		backgroundColor: theme.colors.primary + "20",
		justifyContent: "center",
		alignItems: "center",
		marginRight: 16,
	},
	featureContent: {
		flex: 1,
	},
	featureTitle: {
		fontSize: 16,
		fontWeight: "600",
		color: theme.colors.textPrimary,
		marginBottom: 4,
	},
	featureDescription: {
		fontSize: 14,
		color: theme.colors.textMuted,
		lineHeight: 20,
	},
	upgradeButton: {
		backgroundColor: theme.colors.primary,
		paddingVertical: 16,
		borderRadius: 12,
		alignItems: "center",
		marginTop: 32,
		marginBottom: 16,
		shadowColor: theme.colors.primary,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 5,
	},
	upgradeButtonText: {
		color: theme.colors.white,
		fontSize: 18,
		fontWeight: "700",
	},
	backButton: {
		backgroundColor: "transparent",
		paddingVertical: 16,
		borderRadius: 12,
		alignItems: "center",
		borderWidth: 1,
		borderColor: theme.colors.border,
		marginBottom: 32,
	},
	backButtonText: {
		color: theme.colors.textMuted,
		fontSize: 16,
		fontWeight: "600",
	},
});
