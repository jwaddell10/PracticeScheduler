import { useCallback, useEffect, useState } from "react";
import {
	View,
	Text,
	ScrollView,
	StyleSheet,
	TouchableOpacity,
	Modal,
	Alert,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFavorites } from "../context/FavoritesContext"; // Adjust path as needed
import { usePractices } from "../context/PracticesContext";
import { useDrills } from "../context/DrillsContext";
import { useSubscription } from "../context/UserRoleContext";
import UpcomingPractices from "./UpcomingPractices";
import theme from "./styles/theme";

export default function HomeScreen() {
	const route = useRoute();
	const navigation = useNavigation();
	const { favoriteDrills } = useFavorites();
	const { practices, deletePractice } = usePractices();
	const { refreshAllDrills, userDrills } = useDrills();
	const { isSubscriber, subscriptionStatus } = useSubscription();
	const [selectedDate, setSelectedDate] = useState(null);
	const [showAllPractices, setShowAllPractices] = useState(false);

	// Pre-fetch drills when Home component mounts
	useEffect(() => {
		refreshAllDrills();
	}, []);

	// Get upcoming practices (practices with startTime in the future)
	const upcomingPractices = practices
		.filter((practice) => new Date(practice.startTime) > new Date())
		.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

	// Get upcoming practices count
	const upcomingPracticesCount = upcomingPractices.length;

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
						{userDrills.length}
					</Text>
					<Text style={styles.statLabel}>Your Drills</Text>
				</TouchableOpacity>

				{/* Practices */}
				<TouchableOpacity
					style={styles.statCard}
					onPress={() => setShowAllPractices(true)}
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
					onPress={() => {
						if (subscriptionStatus === 'active') {
							navigation.navigate("DrillsTab");
						} else {
							navigation.navigate("Premium");
						}
					}}
				>
					<MaterialIcons name="add" size={28} color="#8B5CF6" />
					<Text style={styles.statNumber}>PRO</Text>
					<Text style={styles.statLabel}>Library</Text>
				</TouchableOpacity>
			</View>

			{/* Upcoming Practices */}
			<UpcomingPractices limit={3} />

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

			{/* All Practices Modal */}
			<Modal
				visible={showAllPractices}
				animationType="slide"
				presentationStyle="pageSheet"
			>
				<View style={styles.modalContainer}>
					<View style={styles.modalHeader}>
						<TouchableOpacity onPress={() => setShowAllPractices(false)}>
							<Text style={styles.cancelButton}>Cancel</Text>
						</TouchableOpacity>
						<Text style={styles.modalTitle}>All Practices</Text>
						<View style={{ width: 60 }} />
					</View>
					<ScrollView style={styles.modalContent}>
						{upcomingPractices.map((practice) => (
							<TouchableOpacity
								key={practice.id}
								onPress={() => {
									setShowAllPractices(false);
									navigation.navigate("Practice Details", { practiceId: practice.id });
								}}
								style={styles.practiceItem}
							>
								<View style={styles.practiceHeader}>
									<Text style={styles.practiceTitle}>
										{practice.title || "Practice"}
									</Text>
									<TouchableOpacity
										style={styles.deleteButton}
										onPress={() => {
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
																await deletePractice(practice.id);
															} catch (error) {
																Alert.alert("Error", "Failed to delete practice.");
															}
														},
													},
												]
											);
										}}
									>
										<Text style={styles.deleteButtonText}>Delete</Text>
									</TouchableOpacity>
								</View>
								<Text style={styles.dateText}>
									{new Date(practice.startTime).toLocaleDateString()} at {new Date(practice.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
								</Text>
								<Text style={styles.durationText}>
									{practice.practiceDuration || 60} minutes
								</Text>
								<Text style={styles.drillsLabel}>Drills:</Text>
								{(practice.drills || []).map((drill, index) => (
									<Text key={index} style={styles.drillItem}>
										• {drill}
									</Text>
								))}
							</TouchableOpacity>
						))}
					</ScrollView>
				</View>
			</Modal>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: theme.colors.background,
		paddingHorizontal: 20,
		paddingTop: 8,
	},
	header: {
		fontSize: 28,
		fontWeight: "700",
		marginBottom: 8,
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
		paddingVertical: 10,
		paddingHorizontal: 6,
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
		fontSize: 16,
		fontWeight: "700",
		color: "#F1F5F9",
		marginTop: 4,
		marginBottom: 1,
		textAlign: "center",
	},

	statLabel: {
		fontSize: 10,
		fontWeight: "600",
		color: theme.colors.textMuted,
		textAlign: "center",
		lineHeight: 12,
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
	// Modal styles
	modalContainer: {
		flex: 1,
		backgroundColor: theme.colors.background,
	},
	modalHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingVertical: 16,
		paddingTop: 20,
		borderBottomWidth: 1,
		borderBottomColor: theme.colors.border,
		backgroundColor: theme.colors.surface,
	},
	modalTitle: {
		fontSize: 18,
		fontWeight: "600",
		color: theme.colors.textPrimary,
	},
	cancelButton: {
		fontSize: 16,
		color: theme.colors.primary,
	},
	modalContent: {
		flex: 1,
		padding: 16,
	},
	practiceItem: {
		backgroundColor: theme.colors.surface,
		borderRadius: 12,
		padding: 16,
		marginBottom: 12,
		borderWidth: 1,
		borderColor: theme.colors.border,
	},
	practiceHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 8,
	},
	practiceTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: theme.colors.textPrimary,
	},
	dateText: {
		fontSize: 16,
		color: theme.colors.textPrimary,
		marginBottom: 4,
	},
	durationText: {
		fontSize: 16,
		color: theme.colors.textMuted,
		marginBottom: 8,
	},
	drillsLabel: {
		fontSize: 16,
		fontWeight: "600",
		color: theme.colors.textPrimary,
		marginBottom: 4,
	},
	drillItem: {
		fontSize: 14,
		color: theme.colors.textMuted,
		marginLeft: 8,
	},
	deleteButton: {
		backgroundColor: "#FF3B30",
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 8,
	},
	deleteButtonText: {
		color: theme.colors.white,
		fontSize: 12,
		fontWeight: "600",
	},
});
