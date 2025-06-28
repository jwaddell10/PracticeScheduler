import React, { useEffect, useState, useLayoutEffect } from "react";
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	ActivityIndicator,
} from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { supabase } from "../../server/src/supabase";
import Constants from "expo-constants";

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
		try {
			const response = await fetch(
				`${Constants.expoConfig?.extra?.serverApi}/drills`
			);
			const data = await response.json();
			console.log(data, "data");
		} catch (error) {
			console.log(error, "err");
		}
		// const { data, error } = await supabase
		// 	.from("Drill")
		// 	.select("*")
		// 	.order("name", { ascending: true });
		// if (error) {
		// 	console.error("Error fetching drills:", error);
		// } else {
		// 	setDrills(data);
		// }
		// setLoading(false);
	};

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
					<ActivityIndicator size="large" color="#007AFF" />
				</SafeAreaView>
			</SafeAreaProvider>
		);
	}

	const renderDrillRow = (drill) => (
		<TouchableOpacity
			key={drill.id}
			style={styles.drillCard}
			onPress={() => navigation.navigate("DrillDetails", { drill })}
			activeOpacity={0.7}
		>
			<View style={styles.drillTextContainer}>
				<Text style={styles.drillTitle}>{drill.name}</Text>
				{drill.notes ? (
					<Text style={styles.drillNotes} numberOfLines={2}>
						{drill.notes}
					</Text>
				) : null}
			</View>
			<MaterialIcons
				name="arrow-forward-ios"
				size={20}
				color="#007AFF"
				style={styles.arrowIcon}
			/>
		</TouchableOpacity>
	);

	return (
		<SafeAreaProvider>
			<SafeAreaView style={styles.safeArea}>
				<ScrollView contentContainerStyle={styles.scrollView}>
					<Text style={styles.header}>Team Drills</Text>
					{Object.entries(groupedDrills.team).map(
						([category, drills]) => (
							<View key={category} style={styles.section}>
								<Text style={styles.categoryTitle}>
									{category}
								</Text>
								{drills.map(renderDrillRow)}
							</View>
						)
					)}

					<Text style={styles.header}>Individual Drills</Text>
					{Object.entries(groupedDrills.individual).map(
						([category, drills]) => (
							<View key={category} style={styles.section}>
								<Text style={styles.categoryTitle}>
									{category}
								</Text>
								{drills.map(renderDrillRow)}
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
		backgroundColor: "#f8f9fa",
	},
	scrollView: {
		padding: 16,
		paddingBottom: 32,
	},
	header: {
		fontSize: 26,
		fontWeight: "700",
		color: "#222",
		marginVertical: 12,
	},
	section: {
		marginBottom: 24,
	},
	categoryTitle: {
		fontSize: 20,
		fontWeight: "600",
		color: "#444",
		textTransform: "capitalize",
		marginBottom: 12,
		borderBottomWidth: 1,
		borderBottomColor: "#ddd",
		paddingBottom: 6,
	},
	drillCard: {
		backgroundColor: "white",
		padding: 16,
		borderRadius: 12,
		marginBottom: 12,
		flexDirection: "row",
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	drillTextContainer: {
		flex: 1,
	},
	drillTitle: {
		fontSize: 18,
		fontWeight: "600",
		color: "#222",
		marginBottom: 4,
	},
	drillNotes: {
		fontSize: 14,
		color: "#666",
	},
	arrowIcon: {
		marginLeft: 12,
	},
});
