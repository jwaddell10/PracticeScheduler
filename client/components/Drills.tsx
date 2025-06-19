import React, { useEffect, useState, useLayoutEffect } from "react";
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	Button,
	ActivityIndicator,
} from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { supabase } from "../supabase";

export default function Drills() {
	const navigation = useNavigation();
	const [drills, setDrills] = useState([]);
	const [loading, setLoading] = useState(true);

	useLayoutEffect(() => {
		navigation.setOptions({
			headerRight: () => (
				<MaterialIcons
					name="add"
					size={28}
					color="#007AFF"
					style={{ marginRight: 16 }}
					onPress={() => navigation.navigate("CreateDrill")}
				/>
			),
		});
	}, [navigation]);

	useEffect(() => {
		fetchDrills();
	}, []);

	const fetchDrills = async () => {
		setLoading(true);
		const { data, error } = await supabase
			.from("Drill")
			.select("*")
			.order("name", { ascending: true });

		if (error) {
			console.error("Error fetching drills:", error);
		} else {
			setDrills(data);
		}
		setLoading(false);
		console.log(drills,'drills')
	};

	// Group drills by type and category for display
	const groupedDrills = drills.reduce(
		(acc, drill) => {
			const typeKey =
				drill.type?.toLowerCase() === "team drill"
					? "team"
					: "individual";
			if (!acc[typeKey][drill.category]) {
				acc[typeKey][drill.category] = [];
			}
			acc[typeKey][drill.category].push(drill);
			return acc;
		},
		{ team: {}, individual: {} }
	);

	if (loading) {
		return (
			<SafeAreaProvider>
				<SafeAreaView style={styles.safeArea}>
					<ActivityIndicator size="large" />
				</SafeAreaView>
			</SafeAreaProvider>
		);
	}

	return (
		<SafeAreaProvider>
			<SafeAreaView style={styles.safeArea}>
				<ScrollView contentContainerStyle={styles.scrollView}>
					<Text style={styles.header}>Team Drills:</Text>
					{Object.entries(groupedDrills.team).map(
						([category, drills]) => (
							<View key={category} style={styles.section}>
								<Text style={styles.subcategory}>
									{category}
								</Text>
								{drills.map((drill) => (
									<View
										key={drill.id}
										style={styles.drillRow}
									>
										<Text style={styles.drillTitle}>
											{drill.name}
										</Text>
										<Button
											title="details"
											onPress={() =>
												navigation.navigate(
													"DrillDetails",
													{
														drill,
													}
												)
											}
										/>
									</View>
								))}
							</View>
						)
					)}

					<Text style={styles.header}>Individual Drills:</Text>
					{Object.entries(groupedDrills.individual).map(
						([category, drills]) => (
							<View key={category} style={styles.section}>
								<Text style={styles.subcategory}>
									{category}
								</Text>
								{drills.map((drill) => (
									<View
										key={drill.id}
										style={styles.drillRow}
									>
										<Text style={styles.drillTitle}>
											{drill.name}
										</Text>
										<Button
											title="details"
											onPress={() =>
												navigation.navigate(
													"DrillDetails",
													{
														drill,
													}
												)
											}
										/>
									</View>
								))}
							</View>
						)
					)}
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
		textTransform: "capitalize",
	},
	drillTitle: {
		fontSize: 16,
	},
	drillRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		borderBottomWidth: 1,
		borderBottomColor: "#ddd",
		paddingVertical: 8,
	},
});
