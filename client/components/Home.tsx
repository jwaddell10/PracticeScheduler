import { useEffect, useState } from "react";
import {
	View,
	Text,
	FlatList,
	StyleSheet,
	TouchableOpacity,
	Alert,
} from "react-native";
import { Button } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../supabase";

export default function HomeScreen() {
	const navigation = useNavigation();
	const [practices, setPractices] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchData();

		// Real-time subscription
		const subscription = supabase
			.channel("practice-changes")
			.on(
				"postgres_changes",
				{ event: "INSERT", schema: "public", table: "Practice" },
				(payload) => {
					console.log("New practice:", payload.new);
					setPractices((prev) => [payload.new, ...prev]);
				}
			)
			.on(
				"postgres_changes",
				{ event: "DELETE", schema: "public", table: "Practice" },
				(payload) => {
					console.log("Practice deleted:", payload.old);
					setPractices((prev) =>
						prev.filter((item) => item.id !== payload.old.id)
					);
				}
			)
			.subscribe();

		return () => {
			supabase.removeChannel(subscription);
		};
	}, []);

	async function fetchData() {
		const { data, error } = await supabase.from("Practice").select("*");

		if (error) {
			console.error(error);
		} else {
			console.log(data, "data");
			setPractices(data);
		}
		setLoading(false);
	}

	// Delete practice by ID
	const deletePractice = async (id) => {
		const { error } = await supabase.from("Practice").delete().eq("id", id);

		if (error) {
			console.error("Error deleting practice:", error);
		} else {
			console.log("Practice deleted");
			// No need to manually remove from state — subscription handles it
		}
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
			<Text>Start: {new Date(item.startTime).toLocaleString()}</Text>
			<Text>End: {new Date(item.endTime).toLocaleString()}</Text>
			<Text>Drills:</Text>
			{item.drills.map((drill, index) => (
				<Text key={index} style={styles.drillItem}>
					- {drill}
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

			<Button onPress={() => navigation.navigate("Practice")}>
				Schedule Practice
			</Button>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		padding: 16,
		flex: 1,
		backgroundColor: "#fff",
	},
	header: {
		fontSize: 24,
		fontWeight: "bold",
		marginBottom: 16,
	},
	listContainer: {
		paddingBottom: 16,
	},
	practiceItem: {
		backgroundColor: "#f0f0f0",
		padding: 12,
		borderRadius: 8,
		marginBottom: 12,
	},
	practiceTitle: {
		fontWeight: "bold",
		fontSize: 18,
		marginBottom: 4,
	},
	drillItem: {
		marginLeft: 8,
	},
	deleteButton: {
		marginTop: 8,
		backgroundColor: "#FF3B30",
		padding: 8,
		borderRadius: 4,
		alignSelf: "flex-start",
	},
	deleteButtonText: {
		color: "white",
		fontWeight: "bold",
	},
});
