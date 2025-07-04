import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function PremiumScreen() {
	const navigation = useNavigation();

	const features = [
		"Access to premium drill library",
		"Unlimited Drill Creation",
		"Ability to add pictures to created drills",
		"Priority support",
	];

	return (
		<ScrollView contentContainerStyle={styles.container}>
			<Text style={styles.header}>Why Go Premium?</Text>
			<Text style={styles.subheader}>Unlock the full coaching toolkit:</Text>

			{features.map((feature, index) => (
				<View key={index} style={styles.featureItem}>
					<Text style={styles.bulletPoint}>•</Text>
					<Text style={styles.featureText}>{feature}</Text>
				</View>
			))}

			<TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
				<Text style={styles.backButtonText}>Back</Text>
			</TouchableOpacity>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		padding: 24,
		backgroundColor: "#FAFAFA",
		flexGrow: 1,
	},
	header: {
		fontSize: 28,
		fontWeight: "bold",
		color: "#007AFF",
		marginBottom: 12,
	},
	subheader: {
		fontSize: 16,
		color: "#333",
		marginBottom: 24,
	},
	featureItem: {
		flexDirection: "row",
		alignItems: "flex-start",
		marginBottom: 16,
	},
	bulletPoint: {
		fontSize: 20,
		color: "#007AFF",
		marginRight: 8,
	},
	featureText: {
		fontSize: 16,
		color: "#444",
		flex: 1,
	},
	backButton: {
		marginTop: 32,
		backgroundColor: "#007AFF",
		paddingVertical: 14,
		borderRadius: 10,
		alignItems: "center",
	},
	backButtonText: {
		color: "#FFF",
		fontSize: 16,
		fontWeight: "bold",
	},
});
