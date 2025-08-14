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
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFavorites } from "../context/FavoritesContext"; // Adjust path as needed
import { usePractices } from "../context/PracticesContext";
import { useDrills } from "../context/DrillsContext";
import theme from "./styles/theme";

export default function HomeScreen() {
	const navigation = useNavigation();
	const { favoriteDrills } = useFavorites();
	const { practices, loading, deletePractice } = usePractices();
	const [selectedDate, setSelectedDate] = useState(null);

	const confirmDelete = (id: string) => {
		Alert.alert(
			"Delete Practice",
			"Are you sure you want to delete this practice?",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete",
					style: "destructive",
					onPress: async () => {
						try {
							await deletePractice(id);
						} catch (error) {
							Alert.alert("Error", "Failed to delete practice.");
						}
					},
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

	// Get upcoming practices count (practices with startTime in the future)
	const upcomingPracticesCount = practices.filter(
		(practice) => new Date(practice.startTime) > new Date()
	).length;

	return (
		<ScrollView style={styles.container} nestedScrollEnabled={true}>
			<Text style={styles.header}>Welcome, Coach</Text>

			{/* Upgrade to Premium Banner */}
			{/* <View style={styles.bannerContainer}>
				<View style={styles.topRow}>
					<MaterialCommunityIcons
						name="crown"
						size={28}
						color={theme.colors.secondary}
						style={styles.icon}
					/>
					<View style={styles.textColumn}>
						<Text style={styles.bannerTitle}>
							Upgrade to Premium
						</Text>
						<Text style={styles.bannerSubtitle}>
							Get advanced features to power up your coaching!
						</Text>
					</View>
				</View>
				<TouchableOpacity
					style={styles.upgradeButton}
					onPress={() => navigation.navigate("Premium")}
				>
					<Text style={styles.upgradeButtonText}>Upgrade</Text>
				</TouchableOpacity>
			</View> */}

			{/* Stats Components */}
			<View style={styles.statsContainer}>
				{/* Your Drills */}
				<TouchableOpacity
					style={styles.statCard}
					onPress={() => navigation.navigate("FavoriteDrills")}
				>
					<MaterialCommunityIcons
						name="book-open-variant"
						size={28}
						color="#14B8A6"
					/>
					<Text style={styles.statNumber}>
						{favoriteDrills.length}
					</Text>
					<Text style={styles.statLabel}>Your Drills</Text>
				</TouchableOpacity>

				{/* Clipboard */}
				<TouchableOpacity
					style={styles.statCard}
					onPress={() => navigation.navigate("Clipboard")}
				>
					<MaterialIcons
						name="assignment"
						size={28}
						color="#06B6D4"
					/>
					<Text style={styles.statNumber}>
						{upcomingPracticesCount}
					</Text>
					<Text style={styles.statLabel}>Upcoming Practices</Text>
				</TouchableOpacity>

				{/* PRO Library */}
				<TouchableOpacity
					style={styles.statCard}
					onPress={() => navigation.navigate("Premium")}
				>
					<MaterialIcons name="add" size={28} color="#8B5CF6" />
					<Text style={styles.statNumber}>PRO</Text>
					<Text style={styles.statLabel}>Library</Text>
				</TouchableOpacity>
			</View>

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
	statsContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 24,
		gap: 12,
	},

	statCard: {
		flex: 1,
		backgroundColor: theme.colors.surface,
		borderRadius: theme.roundness,
		paddingVertical: 16,
		paddingHorizontal: 8,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1,
		borderColor: theme.colors.border,
		shadowColor: theme.colors.surface,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
		minHeight: 120,
	},

	statNumber: {
		fontSize: 20,
		fontWeight: "700",
		color: "#F1F5F9",
		marginTop: 6,
		marginBottom: 2,
		textAlign: "center",
	},

	statLabel: {
		fontSize: 12,
		fontWeight: "600",
		color: theme.colors.textMuted,
		textAlign: "center",
		lineHeight: 14,
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
	// Premium Banner Styles
	bannerContainer: {
		backgroundColor: theme.colors.surface,
		borderRadius: theme.roundness,
		padding: theme.padding,
		marginBottom: 24,
		flexDirection: "column",
		justifyContent: "center",
		borderWidth: 1,
		borderColor: theme.colors.border,
		shadowColor: theme.colors.surface,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
	},
	topRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 16,
	},
	icon: {
		marginRight: 12,
	},
	textColumn: {
		flexDirection: "column",
		flex: 1,
	},
	bannerTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: theme.colors.textPrimary,
		marginBottom: 4,
	},
	bannerSubtitle: {
		fontSize: 14,
		color: theme.colors.textMuted,
	},
	upgradeButton: {
		backgroundColor: theme.colors.primary,
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderRadius: 8,
		alignItems: "center",
		width: "100%",
		shadowColor: theme.colors.primary,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 4,
		elevation: 3,
	},
	upgradeButtonText: {
		color: theme.colors.white,
		fontWeight: "700",
		fontSize: 16,
	},
});
