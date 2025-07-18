import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function DrillDetails({ route }) {
	const { drill, category, subcategory } = route.params;

	return (
		<View style={styles.container}>
			<View style={styles.card}>
				<Text style={styles.category}>{category?.toUpperCase()}</Text>
				<Text style={styles.subcategory}>{subcategory}</Text>

				<Text style={styles.name}>{drill.name}</Text>

				<Text style={styles.description}>{drill.notes}</Text>

				<Text style={styles.duration}>Duration: {drill.duration} min</Text>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20,
		backgroundColor: "#f8f9fa",
	},
	card: {
		backgroundColor: "white",
		borderRadius: 12,
		padding: 20,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 3 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 5,
	},

	category: {
		fontSize: 14,
		fontWeight: "700",
		color: "#4CAF50",
		letterSpacing: 1,
		marginBottom: 4,
	},

	subcategory: {
		fontSize: 16,
		fontWeight: "600",
		color: "#333",
		marginBottom: 12,
	},

	name: {
		fontSize: 24,
		fontWeight: "bold",
		color: "#222",
		marginBottom: 16,
	},

	description: {
		fontSize: 16,
		lineHeight: 24,
		color: "#555",
		marginBottom: 20,
	},

	duration: {
		fontSize: 14,
		color: "#777",
		fontStyle: "italic",
		textAlign: "right",
	},
});
