import { useCallback, useEffect, useState } from "react";
import {
	View,
	Text,
	ScrollView,
	StyleSheet,
	TouchableOpacity,
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
	const { practices } = usePractices();
	const { refreshAllDrills } = useDrills();
	const [selectedDate, setSelectedDate] = useState(null);

	// Pre-fetch drills when Home component mounts
	useEffect(() => {
		refreshAllDrills();
	}, []);

	// Get upcoming practices count (practices with startTime in the future)
	const upcomingPracticesCount = practices.filter(
		(practice) => new Date(practice.startTime) > new Date()
	).length;

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

	return (
		<ScrollView style={styles.container} nestedScrollEnabled={true}>
			<Text style={styles.header}>Welcome, Coach</Text>

			{/* Stats Components */}
			<View style={styles.statsContainer}>
				{/* Your Drills */}
				<TouchableOpacity
					style={styles.statCard}
					onPress={() => navigation.navigate("FavoriteTab")}
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

				{/* Practices */}
				<TouchableOpacity
					style={styles.statCard}
					onPress={() => navigation.navigate("PracticesTab")}
				>
					<MaterialIcons
						name="event"
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
					calendarBackground: "#1E293B",
					selectedDayBackgroundColor: theme.colors.primary,
					todayTextColor: theme.colors.secondary,
					arrowColor: theme.colors.primary,
					dayTextColor: "#ffffff",
					textDayFontSize: 16,
					textMonthFontSize: 18,
					textDayHeaderFontSize: 14,
					textSectionTitleColor: "#ffffff",
					monthTextColor: "#ffffff",
					textDisabledColor: "#64748b",
				}}
				style={styles.calendar}
			/>

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
