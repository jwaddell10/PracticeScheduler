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
import { Calendar } from "react-native-calendars";
import { useNavigation } from "@react-navigation/native";
import Constants from "expo-constants";
import UpgradeToPremiumBanner from "./UpgradeToPremiumBanner";
import theme from "./styles/theme";

export default function HomeScreen() {
	const navigation = useNavigation();
	const [practices, setPractices] = useState([]);
	console.log(practices, 'practice home page')
	const [loading, setLoading] = useState(true);
	const [selectedDate, setSelectedDate] = useState(null);

	useEffect(() => {
		fetchData();
	}, [practices]);

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
			if (data.message === "Practice deleted") {
				await fetchData();
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

	const getMarkedDates = () => {
		const marks = {};
		practices.forEach((practice) => {
			const dateStr = new Date(practice.startTime)
				.toISOString()
				.split("T")[0];
			marks[dateStr] = {
				marked: true,
				dotColor: theme.colors.secondary,
			};
		});
		if (selectedDate) {
			marks[selectedDate] = {
				...(marks[selectedDate] || {}),
				selected: true,
				selectedColor: theme.colors.accent,
			};
		}
		return marks;
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

	const filteredPractices = selectedDate
		? practices.filter((p) =>
				new Date(p.startTime).toISOString().startsWith(selectedDate)
		  )
		: practices;

	return (
		<ScrollView style={styles.container}>
			<Text style={styles.header}>Welcome, Coach</Text>

			<Calendar
				markedDates={getMarkedDates()}
				onDayPress={(day) => {
					navigation.navigate("Practice", {
						selectedDate: day.dateString, // format: YYYY-MM-DD
					});
				}}
				theme={{
					selectedDayBackgroundColor: theme.colors.accent,
					todayTextColor: theme.colors.secondary,
					arrowColor: theme.colors.primary,
				}}
				style={styles.calendar}
			/>

			{loading ? (
				<Text>Loading...</Text>
			) : filteredPractices.length === 0 ? (
				<Text style={{ marginTop: 16 }}>No practices scheduled.</Text>
			) : (
				<FlatList
					data={filteredPractices}
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
		marginBottom: 16,
		color: theme.colors.textPrimary,
	},
	calendar: {
		borderRadius: 12,
		overflow: "hidden",
		marginBottom: 24,
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
