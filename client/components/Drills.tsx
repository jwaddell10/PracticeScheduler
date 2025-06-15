import React from "react";
import { View, Text, StyleSheet, ScrollView, Button } from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { volleyballDrillsList } from "../utils/volleyballDrillsData";
import Navigation from "../Navigation";
import { useNavigation } from "@react-navigation/native";

export default function Drills() {
	const navigation = useNavigation();
	const teamDrills = volleyballDrillsList.filter(
		(item) => item.category === "Team"
	);
	const individualDrills = volleyballDrillsList.filter(
		(item) => item.category === "Individual"
	);

	return (
		<SafeAreaProvider>
			<SafeAreaView style={styles.safeArea}>
				<ScrollView contentContainerStyle={styles.scrollView}>
					<Text style={styles.header}>Team Drills:</Text>

					{teamDrills.map((section, index) => (
						<View key={index} style={styles.section}>
							<Text style={styles.subcategory}>
								{section.subcategory}
							</Text>
							{section.drills.map((drill, drillIndex) => (
								<Text
									key={drillIndex}
									style={styles.drillTitle}
								>
									{drill.name}
									<Button
										title="details"
										onPress={() =>
											navigation.navigate(
												"DrillDetails",
												{
													drill: drill, // pass the whole drill
													category: section.category,
													subcategory:
														section.subcategory,
												}
											)
										}
									/>
								</Text>
							))}
						</View>
					))}
					<Text style={styles.header}>Individual Drills:</Text>

					{individualDrills.map((section, index) => (
						<View key={index} style={styles.section}>
							<Text style={styles.subcategory}>
								{section.subcategory}
							</Text>
							{section.drills.map((drill, drillIndex) => (
								<Text
									key={drillIndex}
									style={styles.drillTitle}
								>
									{drill.name}
									<Button
										title="details"
										onPress={() =>
											navigation.navigate(
												"DrillDetails",
												{
													drill: drill, // pass the whole drill
													category: section.category,
													subcategory:
														section.subcategory,
												}
											)
										}
									/>
								</Text>
							))}
						</View>
					))}
				</ScrollView>
			</SafeAreaView>
		</SafeAreaProvider>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: "#fff",
	},
	scrollView: {
		padding: 16,
	},
	header: {
		fontSize: 24,
		fontWeight: "bold",
		marginBottom: 16,
	},
	section: {
		marginBottom: 24,
	},
	subcategory: {
		fontSize: 18,
		fontWeight: "600",
		marginBottom: 8,
	},
	drillTitle: {
		fontSize: 16,
		paddingVertical: 4,
		borderBottomWidth: 1,
		borderBottomColor: "#ddd",
	},
});
