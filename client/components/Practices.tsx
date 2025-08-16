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
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { usePractices } from "../context/PracticesContext";
import { useDrills } from "../context/DrillsContext";
import theme from "./styles/theme";

export default function PracticesScreen() {
	const navigation = useNavigation();
	const { practices, loading, deletePractice } = usePractices();
	const { refreshAllDrills } = useDrills();

	// Pre-fetch drills when Practices component mounts
	useEffect(() => {
		refreshAllDrills();
	}, []);

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

	const renderPracticeItem = ({ item }) => (
		<TouchableOpacity
			onPress={() =>
				navigation.navigate("Practice Details", { practiceId: item.id })
			}
			style={styles.practiceItem}
		>
			<Text style={styles.practiceTitle}>Practice</Text>
			<Text style={styles.dateText}>
				Start: {new Date(item.startTime).toLocaleDateString()} at {new Date(item.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
			</Text>
			<Text style={styles.dateText}>
				Duration: {item.duration || 60} minutes
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



	useFocusEffect(
		useCallback(() => {
			// Refresh practices when screen comes into focus
		}, [])
	);

	if (loading) {
		return (
			<View style={styles.loadingContainer}>
				<Text style={styles.loadingText}>Loading practices...</Text>
			</View>
		);
	}

	return (
		<ScrollView style={styles.container}>
			<View style={styles.practicesContainer}>
				<TouchableOpacity
					style={styles.scheduleButton}
					onPress={() => navigation.navigate("Practice")}
				>
					<Text style={styles.scheduleButtonText}>Schedule a Practice</Text>
				</TouchableOpacity>
				
				<Text style={styles.sectionTitle}>
					All Practices
				</Text>
				{practices.length === 0 ? (
					<View style={styles.emptyState}>
						<MaterialCommunityIcons
							name="calendar-blank"
							size={64}
							color={theme.colors.textMuted}
						/>
						<Text style={styles.emptyStateText}>
							No practices scheduled yet
						</Text>
						<TouchableOpacity
							style={styles.createFirstButton}
							onPress={() => navigation.navigate("Practice")}
						>
							<Text style={styles.createFirstButtonText}>
								Create Your First Practice
							</Text>
						</TouchableOpacity>
					</View>
				) : (
					<FlatList
						data={practices}
						renderItem={renderPracticeItem}
						keyExtractor={(item) => item.id}
						scrollEnabled={false}
						showsVerticalScrollIndicator={false}
					/>
				)}
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: theme.colors.background,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: theme.colors.background,
	},
	loadingText: {
		color: theme.colors.textPrimary,
		fontSize: 16,
	},

	scheduleButton: {
		backgroundColor: theme.colors.primary,
		paddingVertical: 16,
		borderRadius: 12,
		alignItems: "center",
		marginBottom: 20,
		shadowColor: theme.colors.primary,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.3,
		shadowRadius: 4,
		elevation: 5,
	},
	scheduleButtonText: {
		color: theme.colors.white,
		fontWeight: "700",
		fontSize: 18,
	},
	practicesContainer: {
		padding: 16,
	},
	sectionTitle: {
		fontSize: 20,
		fontWeight: "600",
		color: theme.colors.textPrimary,
		marginBottom: 16,
	},
	practiceItem: {
		backgroundColor: theme.colors.surface,
		padding: 16,
		marginBottom: 12,
		borderRadius: 12,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	practiceTitle: {
		fontSize: 18,
		fontWeight: "600",
		color: theme.colors.textPrimary,
		marginBottom: 8,
	},
	dateText: {
		fontSize: 14,
		color: theme.colors.textMuted,
		marginBottom: 4,
	},
	drillsLabel: {
		fontSize: 14,
		fontWeight: "500",
		color: theme.colors.textPrimary,
		marginTop: 8,
		marginBottom: 4,
	},
	drillItem: {
		fontSize: 14,
		color: theme.colors.textMuted,
		marginLeft: 8,
		marginBottom: 2,
	},
	deleteButton: {
		backgroundColor: "#ff4444",
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 6,
		alignSelf: "flex-start",
		marginTop: 8,
	},
	deleteButtonText: {
		color: "white",
		fontSize: 12,
		fontWeight: "500",
	},
	emptyState: {
		alignItems: "center",
		paddingVertical: 40,
	},
	emptyStateText: {
		color: theme.colors.textMuted,
		fontSize: 16,
		marginTop: 16,
		marginBottom: 24,
		textAlign: "center",
	},
	createFirstButton: {
		backgroundColor: theme.colors.primary,
		paddingHorizontal: 24,
		paddingVertical: 12,
		borderRadius: 8,
	},
	createFirstButtonText: {
		color: theme.colors.white,
		fontSize: 16,
		fontWeight: "600",
	},
});
