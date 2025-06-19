import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function DrillDetails({ route }) {
	const { drill, category, subcategory } = route.params;

	return (
		<View style={styles.container}>
			<Text style={styles.category}>Category: {category}</Text>
			<Text style={styles.subcategory}>Subcategory: {subcategory}</Text>
			<Text style={styles.name}>Name: {drill.name}</Text>
			<Text style={styles.description}>
				Description: {drill.notes}
			</Text>
			<Text style={styles.duration}>
				Duration: {drill.duration} minutes
			</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		padding: 16,
	},
	category: {
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 8,
	},
	subcategory: {
		fontSize: 16,
		fontWeight: "600",
		marginBottom: 8,
	},
	name: {
		fontSize: 20,
		fontWeight: "bold",
		marginBottom: 8,
	},
	description: {
		fontSize: 16,
		marginBottom: 8,
	},
	duration: {
		fontSize: 16,
		color: "gray",
	},
});
