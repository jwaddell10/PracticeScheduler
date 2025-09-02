import React, { useEffect, useState } from "react";
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Alert,
	ScrollView,
	ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import DraggableFlatList from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { removeDrillFromClipboard, clearClipboard } from "../util/clipboardManager";
import { useClipboard } from "../context/ClipboardContext";
import { useFocusEffect } from "@react-navigation/native";
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

export default function Clipboard() {
	const { clipboardDrills, isInitialized, refreshClipboard, updateClipboardStatus, updateClipboardDrillsOrder } = useClipboard();
	const [reorderedDrills, setReorderedDrills] = useState<ClipboardDrill[]>([]);
	const [focusKey, setFocusKey] = useState(0);

	// Update reordered drills when clipboard drills change
	React.useEffect(() => {
		setReorderedDrills(clipboardDrills);
	}, [clipboardDrills]);

	// Force re-render when component mounts or when returning to screen
	React.useEffect(() => {
		// This helps ensure the gesture handler is properly initialized
		const timer = setTimeout(() => {
			setReorderedDrills([...clipboardDrills]);
		}, 100);
		
		return () => clearTimeout(timer);
	}, []);

	// Increment focus key when screen comes into focus to force DraggableFlatList reinitialization
	useFocusEffect(
		React.useCallback(() => {
			// Small delay to ensure navigation is complete before reinitializing
			const timer = setTimeout(() => {
				setFocusKey(prev => prev + 1);
			}, 100);
			
			return () => clearTimeout(timer);
		}, [])
	);



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
		console.log("Drills reordered:", data.map(d => d.name));
		setReorderedDrills(data);
		// Update the clipboard context with the new order
		updateClipboardDrillsOrder(data).catch(error => {
			console.error("Error saving reordered drills:", error);
		});
	};



	const renderDrillItem = ({ item: drill, drag, isActive }: { item: ClipboardDrill; drag: () => void; isActive: boolean }) => (
		<TouchableOpacity
			style={[
				styles.drillItem,
				isActive && styles.draggingItem
			]}
			onLongPress={() => {
				console.log("Drill item long pressed for drill:", drill.name);
				drag();
			}}
			delayLongPress={150}
			activeOpacity={0.9}
		>
			<View style={styles.dragHandle}>
				<MaterialIcons name="drag-handle" size={20} color={theme.colors.textMuted} />
			</View>
			<View style={styles.drillContent}>
				<Text style={styles.drillName}>{drill.name || 'No name'}</Text>
			</View>
			<TouchableOpacity
				style={styles.removeButton}
				onPress={() => handleRemoveDrillFromClipboard(drill.id)}
			>
				<MaterialIcons name="remove-circle" size={24} color="#FF3B30" />
			</TouchableOpacity>
		</TouchableOpacity>
	);

	// Show loading state while context is initializing
	if (!isInitialized) {
		return (
			<View style={styles.container}>
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" color={theme.colors.primary} />
					<Text style={styles.loadingText}>Loading clipboard...</Text>
				</View>
			</View>
		);
	}

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
			<Text style={styles.dragHint}>Long press anywhere on a drill to reorder</Text>
			
			<GestureHandlerRootView style={{ flex: 1 }}>
				<DraggableFlatList
					key={focusKey}
					data={reorderedDrills}
					onDragEnd={handleDrillsReorder}
					keyExtractor={(item) => item.id}
					renderItem={renderDrillItem}
					contentContainerStyle={styles.scrollView}
					autoscrollThreshold={10}
					autoscrollSpeed={10}
					activationDistance={10}
				/>
			</GestureHandlerRootView>
		</View>
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
		paddingHorizontal: 40,
	},
	loadingText: {
		fontSize: 16,
		color: theme.colors.textMuted,
		marginTop: 16,
		textAlign: "center",
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
		paddingHorizontal: 20,
		paddingBottom: 150,
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
		minHeight: 60,
		alignItems: "center",
	},
	drillContent: {
		flex: 1,
	},
	drillName: {
		fontSize: 18,
		fontWeight: "600",
		color: theme.colors.textPrimary,
		lineHeight: 24,
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
		padding: 8,
		minWidth: 32,
		minHeight: 32,
		justifyContent: "center",
		alignItems: "center",
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