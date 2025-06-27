import { useEffect, useState } from "react";
import {
	View,
	Text,
	FlatList,
	StyleSheet,
	TouchableOpacity,
	Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../../server/src/supabase";

export default function HomeScreen() {
	const navigation = useNavigation();
	const [practices, setPractices] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchData();

		// // Real-time subscription
		// const subscription = supabase
		// 	.channel("practice-changes")
		// 	.on(
		// 		"postgres_changes",
		// 		{ event: "INSERT", schema: "public", table: "Practice" },
		// 		(payload) => {
		// 			console.log("New practice:", payload.new);
		// 			setPractices((prev) => [payload.new, ...prev]);
		// 		}
		// 	)
		// 	.on(
		// 		"postgres_changes",
		// 		{ event: "DELETE", schema: "public", table: "Practice" },
		// 		(payload) => {
		// 			console.log("Practice deleted:", payload.old);
		// 			setPractices((prev) =>
		// 				prev.filter((item) => item.id !== payload.old.id)
		// 			);
		// 		}
		// 	)
		// 	.subscribe();

		// return () => {
		// 	supabase.removeChannel(subscription);
		// };
	}, []);

	async function fetchData() {
		try {
			const response = await fetch(`${process.env.EXPO_SERVER_API}/`);
			const data = await response.json();
			console.log(data, "data");
		} catch (error) {
			console.log(error, "err");
		}
		// const { data, error } = await supabase.from("Practice").select("*");
		// if (error) {
		// 	console.error(error);
		// } else {
		// 	setPractices(data);
		// }
		// setLoading(false);
	}

	// Delete practice by ID
	const deletePractice = async (id) => {
		try {
			const response = await fetch(
				`${process.env.EXPO_SERVER_API}/delete`
			);
			const data = await response.json();
			console.log(data, "data");
		} catch (error) {
			console.log(error, "err");
		}

		// const { error } = await supabase.from("Practice").delete().eq("id", id);

		// if (error) {
		// 	console.error("Error deleting practice:", error);
		// } else {
		// 	console.log("Practice deleted");
		// 	// No need to manually remove from state — subscription handles it
		// }
	};

	const confirmDelete = (id) => {
		Alert.alert(
			"Delete Practice",
			"Are you sure you want to delete this practice?",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete",
					style: "destructive",
					onPress: () => deletePractice(id),
				},
			]
		);
	};

	const renderPracticeItem = ({ item }) => (
		<TouchableOpacity
			onPress={() =>
				navigation.navigate("PracticeDetails", { practiceId: item.id })
			}
			style={styles.practiceItem}
		>
			<Text style={styles.practiceTitle}>Practice</Text>
			<Text style={styles.dateText}>
				Start: {new Date(item.startTime).toLocaleString()}
			</Text>
			<Text style={styles.dateText}>
				End: {new Date(item.endTime).toLocaleString()}
			</Text>
			<Text style={styles.drillsLabel}>Drills:</Text>
			{item.drills.map((drill, index) => (
				<Text key={index} style={styles.drillItem}>
					• {drill}
				</Text>
			))}

			<TouchableOpacity
				style={styles.deleteButton}
				onPress={() => confirmDelete(item.id)}
			>
				<Text style={styles.deleteButtonText}>Delete</Text>
			</TouchableOpacity>
		</TouchableOpacity>
	);

	return (
		<View style={styles.container}>
			<Text style={styles.header}>Hello, Coach</Text>

			{loading ? (
				<Text>Loading...</Text>
			) : practices.length === 0 ? (
				<Text>No practices scheduled yet.</Text>
			) : (
				<FlatList
					data={practices}
					keyExtractor={(item) => item.id}
					renderItem={renderPracticeItem}
					contentContainerStyle={styles.listContainer}
				/>
			)}

			<TouchableOpacity
				style={styles.scheduleButton}
				onPress={() => navigation.navigate("Practice")}
				activeOpacity={0.8}
			>
				<Text style={styles.scheduleButtonText}>Schedule Practice</Text>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#FAFAFA",
		paddingHorizontal: 20,
		paddingTop: 24,
	},
	header: {
		fontSize: 28,
		fontWeight: "700",
		marginBottom: 24,
		color: "#222",
	},
	listContainer: {
		paddingBottom: 24,
	},
	practiceItem: {
		backgroundColor: "#FFFFFF",
		padding: 16,
		borderRadius: 12,
		marginBottom: 16,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 6,
		elevation: 3, // Android shadow
	},
	practiceTitle: {
		fontWeight: "700",
		fontSize: 20,
		marginBottom: 8,
		color: "#007AFF",
	},
	dateText: {
		fontSize: 14,
		color: "#444",
		marginBottom: 4,
	},
	drillsLabel: {
		marginTop: 12,
		fontWeight: "600",
		fontSize: 16,
		color: "#333",
		marginBottom: 6,
	},
	drillItem: {
		marginLeft: 12,
		fontSize: 14,
		color: "#555",
		marginBottom: 2,
	},
	deleteButton: {
		marginTop: 12,
		backgroundColor: "#FF3B30",
		paddingVertical: 10,
		paddingHorizontal: 16,
		borderRadius: 8,
		alignSelf: "flex-start",
		shadowColor: "#FF3B30",
		shadowOffset: { width: 0, height: 3 },
		shadowOpacity: 0.4,
		shadowRadius: 5,
		elevation: 4,
	},
	deleteButtonText: {
		color: "white",
		fontWeight: "700",
		fontSize: 16,
	},
	scheduleButton: {
		backgroundColor: "#007AFF",
		paddingVertical: 16,
		borderRadius: 12,
		alignItems: "center",
		marginBottom: 32,
	},
	scheduleButtonText: {
		color: "white",
		fontWeight: "700",
		fontSize: 18,
	},
});
