import { useCallback, useEffect, useState } from "react";
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
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { supabase } from "../lib/supabase"; // Adjust path as needed
import theme from "./styles/theme";

export default function HomeScreen() {
	const navigation = useNavigation();
	const [practices, setPractices] = useState([]);
	const [loading, setLoading] = useState(true);
	const [selectedDate, setSelectedDate] = useState(null);

	useFocusEffect(
		useCallback(() => {
			fetchPractices();
		}, [])
	);

	const fetchPractices = async () => {
		setLoading(true);
		const { data, error } = await supabase
			.from("Practice")
			.select("id, startTime, endTime, drills");

		if (error) {
			console.error("Supabase error:", error.message);
			Alert.alert("Error", "Failed to fetch practices.");
		} else {
			setPractices(data || []);
		}
		setLoading(false);
	};

	const deletePractice = async (id: string) => {
		const { error } = await supabase.from("Practice").delete().eq("id", id);

		if (error) {
			console.error("Delete error:", error.message);
			Alert.alert("Error", "Failed to delete practice.");
		} else {
			await fetchPractices();
		}
	};

	const confirmDelete = (id: string) => {
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
				selectedColor: theme.colors.primary,
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
			{(item.drills || []).map((drill, index) => (
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
					setSelectedDate(day.dateString);
					navigation.navigate("Practice", {
						selectedDate: day.dateString,
					});
				}}
				theme={{
					backgroundColor: "#1E293B",
					calendarBackground: "#1E293B", // Add this too
					selectedDayBackgroundColor: theme.colors.primary,
					todayTextColor: theme.colors.secondary,
					arrowColor: theme.colors.primary,
					// Add these text color properties:
					dayTextColor: "#ffffff",
					textDayFontSize: 16,
					textMonthFontSize: 18,
					textDayHeaderFontSize: 14,
					textSectionTitleColor: "#ffffff",
					monthTextColor: "#ffffff",
					textDisabledColor: "#64748b", // Lighter gray for disabled days
				}}
				style={styles.calendar}
			/>

			{loading ? (
				<Text style={styles.loadingText}>Loading...</Text>
			) : filteredPractices.length === 0 ? (
				<Text style={styles.emptyText}>No practices scheduled.</Text>
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
		borderRadius: theme.roundness,
		overflow: "hidden",
		marginBottom: 24,
	},
	loadingText: {
		color: theme.colors.textMuted,
		textAlign: "center",
		marginVertical: 20,
	},
	emptyText: {
		color: theme.colors.textMuted,
		textAlign: "center",
		marginVertical: 20,
	},
	listContainer: {
		paddingBottom: 24,
	},
	practiceItem: {
		backgroundColor: theme.colors.surface,
		padding: theme.padding,
		borderRadius: theme.roundness,
		marginBottom: 16,
		borderWidth: 1,
		borderColor: theme.colors.border,
		shadowColor: theme.colors.surface,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 6,
		elevation: 3,
	},
	practiceTitle: {
		fontWeight: "700",
		fontSize: 20,
		marginBottom: 8,
		color: theme.colors.textPrimary,
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
		color: theme.colors.white,
		fontWeight: "700",
		fontSize: 16,
	},
	scheduleButton: {
		backgroundColor: theme.colors.primary,
		paddingVertical: 16,
		borderRadius: theme.roundness,
		alignItems: "center",
		marginBottom: 32,
	},
	scheduleButtonText: {
		color: theme.colors.white,
		fontWeight: "700",
		fontSize: 18,
	},
});
