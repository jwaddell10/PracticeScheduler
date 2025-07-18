import { useEffect, useState } from "react";
import {
	View,
	Text,
	ScrollView,
	FlatList,
	StyleSheet,
	TouchableOpacity,
	Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Constants from "expo-constants";
import UpgradeToPremiumBanner from "./UpgradeToPremiumBanner";
import theme from "./styles/theme";

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
			const localIP = Constants.expoConfig?.extra?.localIP;

			const PORT = Constants.expoConfig?.extra?.PORT;
			const response = await fetch(`http://${localIP}:${PORT}/home`);
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();
			setPractices(data);
			setLoading(false);
		} catch (error) {
			console.error(error, "error home");
			Alert.alert("Error", "Failed to fetch data from server.");
		}
	}

	// Delete practice by ID
	const deletePractice = async (id) => {
		try {
			const localIP = Constants.expoConfig?.extra?.localIP;

			const PORT = Constants.expoConfig?.extra?.PORT;
			const response = await fetch(
				`http://${localIP}:${PORT}/home/${id}/delete`,
				{
					method: "DELETE",
					headers: {
						"Content-type": "application/json",
					},
				}
			);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			const data = await response.json();
			console.log(data, "data");
			if (data.message === "Practice deleted") {
				await fetchData(); // ✅ Refetch updated practices
			}
		} catch (error) {
			console.log(error, "err");
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
		<ScrollView style={styles.container}>
			<Text style={styles.header}>Welcome, Coach</Text>
			{/* <UpgradeToPremiumBanner /> */}

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
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: theme.colors.background,
		paddingHorizontal: 20,
		paddingTop: 24,
	},
	header: {
		fontSize: 28,
		fontWeight: "700",
		marginBottom: 24,
		color: theme.colors.textPrimary,
	},
	listContainer: {
		paddingBottom: 24,
	},
	practiceItem: {
		backgroundColor: theme.colors.primary,
		padding: theme.padding,
		borderRadius: theme.roundness,
		marginBottom: 16,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 6,
		elevation: 3,
	},
	practiceTitle: {
		fontWeight: "700",
		fontSize: 20,
		marginBottom: 8,
		color: theme.colors.accent,
	},
	dateText: {
		fontSize: 14,
		color: theme.colors.textMuted,
		marginBottom: 4,
	},
	drillsLabel: {
		marginTop: 12,
		fontWeight: "600",
		fontSize: 16,
		color: theme.colors.textPrimary,
		marginBottom: 6,
	},
	drillItem: {
		marginLeft: 12,
		fontSize: 14,
		color: theme.colors.textMuted,
		marginBottom: 2,
	},
	deleteButton: {
		marginTop: 12,
		backgroundColor: theme.colors.error,
		paddingVertical: 10,
		paddingHorizontal: 16,
		borderRadius: 8,
		alignSelf: "flex-start",
		shadowColor: theme.colors.error,
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
		backgroundColor: theme.colors.secondary,
		paddingVertical: 16,
		borderRadius: theme.roundness,
		alignItems: "center",
		marginBottom: 32,
	},
	scheduleButtonText: {
		color: theme.colors.textPrimary,
		fontWeight: "700",
		fontSize: 18,
	},
});
