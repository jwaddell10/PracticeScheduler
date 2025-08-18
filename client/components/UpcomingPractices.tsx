import React, { useState } from "react";
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Modal,
	ScrollView,
	Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { usePractices } from "../context/PracticesContext";
import theme from "./styles/theme";

interface Practice {
	id: string;
	startTime: string;
	duration: number;
	drills: string[];
}

interface UpcomingPracticesProps {
	limit?: number;
}

export default function UpcomingPractices({ limit = 3 }: UpcomingPracticesProps) {
	const navigation = useNavigation();
	const { practices, deletePractice } = usePractices();
	const [showAllPractices, setShowAllPractices] = useState(false);

	// Get upcoming practices (practices with startTime in the future)
	const upcomingPractices = practices
		.filter((practice) => new Date(practice.startTime) > new Date())
		.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

	const limitedPractices = upcomingPractices.slice(0, limit);

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

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString();
	};

	const formatTime = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
	};

	const renderPracticeItem = (practice: Practice, isCompact = false) => (
		<TouchableOpacity
			key={practice.id}
			onPress={() => {
				if (isCompact) {
					navigation.navigate("Practice Details", { practiceId: practice.id });
				} else {
					setShowAllPractices(false);
					navigation.navigate("Practice Details", { practiceId: practice.id });
				}
			}}
			style={[styles.practiceItem, isCompact && styles.compactPracticeItem]}
		>
			<View style={styles.practiceHeader}>
				<Text style={[styles.practiceTitle, isCompact && styles.compactPracticeTitle]}>
					Practice
				</Text>
				{!isCompact && (
					<TouchableOpacity
						style={styles.deleteButton}
						onPress={() => confirmDelete(practice.id)}
					>
						<Text style={styles.deleteButtonText}>Delete</Text>
					</TouchableOpacity>
				)}
			</View>
			<Text style={[styles.dateText, isCompact && styles.compactDateText]}>
				{formatDate(practice.startTime)} at {formatTime(practice.startTime)}
			</Text>
			<Text style={[styles.durationText, isCompact && styles.compactDurationText]}>
				{practice.practiceDuration || 60} minutes
			</Text>
			{!isCompact && (
				<>
					<Text style={styles.drillsLabel}>Drills:</Text>
					{(practice.drills || []).map((drill, index) => (
						<Text key={index} style={styles.drillItem}>
							• {drill}
						</Text>
					))}
				</>
			)}
		</TouchableOpacity>
	);

	if (upcomingPractices.length === 0) {
		return (
			<View style={styles.container}>
				<Text style={styles.sectionTitle}>Upcoming Practices</Text>
				<View style={styles.emptyState}>
					<Text style={styles.emptyStateText}>No upcoming practices</Text>
				</View>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<Text style={styles.sectionTitle}>Upcoming Practices</Text>
				{upcomingPractices.length > limit && (
					<TouchableOpacity
						style={styles.seeAllButton}
						onPress={() => setShowAllPractices(true)}
					>
						<Text style={styles.seeAllButtonText}>See All</Text>
					</TouchableOpacity>
				)}
			</View>

			{limitedPractices.map((practice) => renderPracticeItem(practice, true))}

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
						{upcomingPractices.map((practice) => renderPracticeItem(practice, false))}
					</ScrollView>
				</View>
			</Modal>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		marginBottom: 20,
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 12,
	},
	sectionTitle: {
		fontSize: 20,
		fontWeight: "700",
		color: theme.colors.textPrimary,
	},
	seeAllButton: {
		backgroundColor: theme.colors.primary,
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 20,
	},
	seeAllButtonText: {
		color: theme.colors.white,
		fontSize: 14,
		fontWeight: "600",
	},
	emptyState: {
		backgroundColor: theme.colors.surface,
		borderRadius: 12,
		padding: 20,
		alignItems: "center",
	},
	emptyStateText: {
		color: theme.colors.textMuted,
		fontSize: 16,
	},
	compactPracticeItem: {
		backgroundColor: theme.colors.surface,
		borderRadius: 12,
		padding: 12,
		marginBottom: 8,
		borderWidth: 1,
		borderColor: theme.colors.border,
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
	compactPracticeTitle: {
		fontSize: 16,
		fontWeight: "600",
	},
	practiceTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: theme.colors.textPrimary,
	},
	compactDateText: {
		fontSize: 14,
	},
	dateText: {
		fontSize: 16,
		color: theme.colors.textPrimary,
		marginBottom: 4,
	},
	compactDurationText: {
		fontSize: 14,
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
});
