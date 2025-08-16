import React, { useEffect, useState } from "react";
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import DraggableFlatList from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { removeDrillFromClipboard, clearClipboard, updateClipboardDrills } from "../util/clipboardManager";
import { useClipboard } from "../context/ClipboardContext";
import theme from "./styles/theme";

interface ClipboardDrill {
	id: string;
	name: string;
	type?: string;
	skillFocus?: string;
	difficulty?: string;
	duration?: number;
	notes?: string;
}

const CLIPBOARD_STORAGE_KEY = "practice_clipboard";

export default function Clipboard() {
	const { clipboardDrills, refreshClipboard, updateClipboardStatus } = useClipboard();
	const [reorderedDrills, setReorderedDrills] = useState<ClipboardDrill[]>([]);

	// Ensure clipboard is loaded when component mounts
	React.useEffect(() => {
		refreshClipboard();
	}, []);

	// Update reordered drills when clipboard drills change
	React.useEffect(() => {
		setReorderedDrills(clipboardDrills);
	}, [clipboardDrills]);

	const handleRemoveDrillFromClipboard = async (drillId: string) => {
		try {
			await removeDrillFromClipboard(drillId);
			updateClipboardStatus(drillId, false);
			await refreshClipboard();
		} catch (error) {
			console.error("Error removing drill from clipboard:", error);
		}
	};

	const handleClearClipboard = async () => {
		Alert.alert(
			"Clear Clipboard",
			"Are you sure you want to clear all drills from your clipboard?",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Clear",
					style: "destructive",
					onPress: async () => {
						try {
							await clearClipboard();
							await refreshClipboard();
						} catch (error) {
							console.error("Error clearing clipboard:", error);
						}
					},
				},
			]
		);
	};

	const handleDrillsReorder = ({ data }: { data: ClipboardDrill[] }) => {
		setReorderedDrills(data);
		// Save the reordered drills to AsyncStorage
		updateClipboardDrills(data).catch(error => {
			console.error("Error saving reordered drills:", error);
		});
	};

	// Helper function to safely convert values to strings and remove brackets/quotes
	const safeString = (value: any): string => {
		if (value === null || value === undefined) return '';
		if (typeof value === 'string') {
			// Try to parse JSON strings (like "[\"serve\"]")
			try {
				const parsed = JSON.parse(value);
				if (Array.isArray(parsed)) {
					return parsed.join(', ');
				}
				return parsed;
			} catch {
				// If parsing fails, return the original string
				return value;
			}
		}
		if (Array.isArray(value)) return value.join(', ');
		return String(value);
	};

	const renderDrillItem = ({ item: drill, drag, isActive }: { item: ClipboardDrill; drag: () => void; isActive: boolean }) => (
		<TouchableOpacity
			style={[
				styles.drillItem,
				isActive && styles.draggingItem
			]}
			onLongPress={drag}
			disabled={isActive}
		>
			<View style={styles.dragHandle}>
				<MaterialIcons name="drag-handle" size={20} color={theme.colors.textMuted} />
			</View>
			<View style={styles.drillContent}>
				<Text style={styles.drillName}>{safeString(drill.name)}</Text>
				<View style={styles.drillDetails}>
					{drill.type && (
						<Text style={styles.drillDetail}>Type: {safeString(drill.type)}</Text>
					)}
					{drill.skillFocus && (
						<Text style={styles.drillDetail}>Focus: {safeString(drill.skillFocus)}</Text>
					)}
					{drill.difficulty && (
						<Text style={styles.drillDetail}>Difficulty: {safeString(drill.difficulty)}</Text>
					)}
					{drill.duration && (
						<Text style={styles.drillDetail}>Duration: {drill.duration} min</Text>
					)}
				</View>
				{drill.notes && (
					<Text style={styles.drillNotes}>Notes: {safeString(drill.notes)}</Text>
				)}
			</View>
			<TouchableOpacity
				style={styles.removeButton}
				onPress={() => handleRemoveDrillFromClipboard(drill.id)}
			>
				<MaterialIcons name="remove-circle" size={24} color="#FF3B30" />
			</TouchableOpacity>
		</TouchableOpacity>
	);

	if (clipboardDrills.length === 0) {
		return (
			<View style={styles.container}>
				<View style={styles.emptyState}>
					<MaterialIcons name="content-paste" size={64} color={theme.colors.textMuted} />
					<Text style={styles.emptyStateTitle}>Your Clipboard is Empty</Text>
					<Text style={styles.emptyStateText}>
						Add drills to your clipboard from the Drills or Your Drills tabs to create practice sessions quickly.
					</Text>
				</View>
			</View>
		);
	}

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<View style={styles.container}>
				<View style={styles.header}>
					<Text style={styles.title}>Practice Clipboard</Text>
					<TouchableOpacity style={styles.clearButton} onPress={handleClearClipboard}>
						<Text style={styles.clearButtonText}>Clear All</Text>
					</TouchableOpacity>
				</View>
				
				<Text style={styles.subtitle}>
					{reorderedDrills.length} drill{reorderedDrills.length !== 1 ? 's' : ''} ready for practice
				</Text>
				<Text style={styles.dragHint}>Hold and drag to reorder drills</Text>
				
				<DraggableFlatList
					data={reorderedDrills}
					renderItem={renderDrillItem}
					keyExtractor={(item) => item.id}
					onDragEnd={handleDrillsReorder}
					containerStyle={{ flex: 1 }}
					contentContainerStyle={styles.scrollView}
					showsVerticalScrollIndicator={false}
				/>
			</View>
		</GestureHandlerRootView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: theme.colors.background,
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 20,
		paddingVertical: 16,
		borderBottomWidth: 1,
		borderBottomColor: theme.colors.border,
	},
	title: {
		fontSize: 24,
		fontWeight: "700",
		color: theme.colors.textPrimary,
	},
	clearButton: {
		backgroundColor: "#FF3B30",
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 20,
	},
	clearButtonText: {
		color: theme.colors.white,
		fontSize: 14,
		fontWeight: "600",
	},
	subtitle: {
		fontSize: 16,
		color: theme.colors.textMuted,
		paddingHorizontal: 20,
		paddingVertical: 12,
	},
	scrollView: {
		flex: 1,
		paddingHorizontal: 20,
	},
	drillItem: {
		flexDirection: "row",
		backgroundColor: theme.colors.surface,
		borderRadius: 12,
		padding: 16,
		marginBottom: 12,
		borderWidth: 1,
		borderColor: theme.colors.border,
		shadowColor: theme.colors.surface,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
	},
	drillContent: {
		flex: 1,
	},
	drillName: {
		fontSize: 18,
		fontWeight: "600",
		color: theme.colors.textPrimary,
		marginBottom: 8,
	},
	drillDetails: {
		marginBottom: 8,
	},
	drillDetail: {
		fontSize: 14,
		color: theme.colors.textMuted,
		marginBottom: 2,
	},
	drillNotes: {
		fontSize: 14,
		color: theme.colors.textMuted,
		fontStyle: "italic",
	},
	removeButton: {
		marginLeft: 12,
		justifyContent: "center",
	},
	draggingItem: {
		opacity: 0.8,
		transform: [{ scale: 1.05 }],
		shadowOpacity: 0.3,
		elevation: 8,
	},
	dragHandle: {
		marginRight: 12,
		padding: 4,
	},
	dragHint: {
		fontSize: 14,
		color: theme.colors.textMuted,
		paddingHorizontal: 20,
		paddingBottom: 8,
		fontStyle: "italic",
	},
	emptyState: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 40,
	},
	emptyStateTitle: {
		fontSize: 24,
		fontWeight: "700",
		color: theme.colors.textPrimary,
		marginTop: 16,
		marginBottom: 12,
		textAlign: "center",
	},
	emptyStateText: {
		fontSize: 16,
		color: theme.colors.textMuted,
		textAlign: "center",
		lineHeight: 24,
	},
});
