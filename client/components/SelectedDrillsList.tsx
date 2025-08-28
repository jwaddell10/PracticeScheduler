import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import theme from './styles/theme';

interface SelectedDrillsListProps {
	selectedDrills: string[];
	drillDurations: { [key: string]: number };
	onRemoveDrill: (drillName: string) => void;
	onUpdateDrillDuration: (drillName: string, duration: number) => void;
	onDrillQuestionClick: (drillName: string) => void;
	totalPracticeDuration?: number;
}

export default function SelectedDrillsList({
	selectedDrills,
	drillDurations,
	onRemoveDrill,
	onUpdateDrillDuration,
	onDrillQuestionClick,
	totalPracticeDuration,
}: SelectedDrillsListProps) {
	const getTotalDrillDuration = () => {
		return Object.values(drillDurations).reduce(
			(total, duration) => total + duration,
			0
		);
	};

	const isDurationValid = () => {
		if (!totalPracticeDuration) return true;
		return getTotalDrillDuration() === totalPracticeDuration;
	};

	const handleDurationChange = (drillName: string, newDuration: string) => {
		const duration = parseInt(newDuration) || 0;
		onUpdateDrillDuration(drillName, duration);
	};

	const handleRemoveDrill = (drillName: string) => {
		Alert.alert(
			'Remove Drill',
			`Are you sure you want to remove "${drillName}" from this practice?`,
			[
				{ text: 'Cancel', style: 'cancel' },
				{ text: 'Remove', style: 'destructive', onPress: () => onRemoveDrill(drillName) },
			]
		);
	};

	if (selectedDrills.length === 0) {
		return (
			<View style={styles.section}>
				<Text style={styles.label}>Selected Drills</Text>
				<View style={styles.emptyState}>
					<MaterialIcons name="fitness-center" size={48} color={theme.colors.textMuted} />
					<Text style={styles.emptyStateText}>No drills selected</Text>
					<Text style={styles.emptyStateSubtext}>
						Tap "Add Drills" to select drills for this practice
					</Text>
				</View>
			</View>
		);
	}

	return (
		<View style={styles.section}>
			<View style={styles.header}>
				<Text style={styles.label}>Selected Drills ({selectedDrills.length})</Text>
				{!isDurationValid() && (
					<View style={styles.durationWarning}>
						<MaterialIcons name="warning" size={16} color={theme.colors.error} />
						<Text style={styles.durationWarningText}>
							Drill durations must equal practice duration
						</Text>
					</View>
				)}
			</View>

			{selectedDrills.map((drillName, index) => (
				<View key={drillName} style={styles.drillItem}>
					<View style={styles.drillInfo}>
						<Text style={styles.drillName}>{drillName}</Text>
						<TouchableOpacity
							style={styles.questionButton}
							onPress={() => onDrillQuestionClick(drillName)}
						>
							<MaterialIcons name="help-outline" size={20} color={theme.colors.primary} />
						</TouchableOpacity>
					</View>
					
					<View style={styles.durationContainer}>
						<Text style={styles.durationLabel}>Duration (min):</Text>
						<TextInput
							style={styles.durationInput}
							value={drillDurations[drillName]?.toString() || '0'}
							onChangeText={(text) => handleDurationChange(drillName, text)}
							keyboardType="numeric"
							maxLength={3}
						/>
					</View>

					<TouchableOpacity
						style={styles.removeButton}
						onPress={() => handleRemoveDrill(drillName)}
					>
						<MaterialIcons name="remove-circle" size={24} color={theme.colors.error} />
					</TouchableOpacity>
				</View>
			))}

			<View style={styles.totalDuration}>
				<Text style={styles.totalDurationText}>
					Total Drill Duration: {getTotalDrillDuration()} minutes
				</Text>
				{totalPracticeDuration && (
					<Text style={styles.practiceDurationText}>
						Practice Duration: {totalPracticeDuration} minutes
					</Text>
				)}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	section: {
		marginBottom: 24,
		paddingHorizontal: 20,
	},
	header: {
		marginBottom: 16,
	},
	label: {
		fontSize: 16,
		fontWeight: '600',
		color: theme.colors.textPrimary,
		marginBottom: 8,
	},
	emptyState: {
		alignItems: 'center',
		paddingVertical: 32,
		backgroundColor: theme.colors.surface,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: theme.colors.border,
	},
	emptyStateText: {
		fontSize: 16,
		color: theme.colors.textMuted,
		marginTop: 12,
	},
	emptyStateSubtext: {
		fontSize: 14,
		color: theme.colors.textMuted,
		marginTop: 4,
		textAlign: 'center',
	},
	durationWarning: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: theme.colors.surface,
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: theme.colors.error,
		marginTop: 8,
	},
	durationWarningText: {
		fontSize: 14,
		color: theme.colors.error,
		marginLeft: 8,
	},
	drillItem: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: theme.colors.surface,
		borderRadius: 12,
		padding: 16,
		marginBottom: 12,
		borderWidth: 1,
		borderColor: theme.colors.border,
	},
	drillInfo: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
	},
	drillName: {
		fontSize: 16,
		fontWeight: '500',
		color: theme.colors.textPrimary,
		flex: 1,
	},
	questionButton: {
		padding: 4,
		marginLeft: 8,
	},
	durationContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginRight: 12,
	},
	durationLabel: {
		fontSize: 14,
		color: theme.colors.textMuted,
		marginRight: 8,
	},
	durationInput: {
		backgroundColor: theme.colors.background,
		borderRadius: 6,
		paddingHorizontal: 8,
		paddingVertical: 4,
		fontSize: 14,
		color: theme.colors.textPrimary,
		borderWidth: 1,
		borderColor: theme.colors.border,
		width: 50,
		textAlign: 'center',
	},
	removeButton: {
		padding: 4,
	},
	totalDuration: {
		backgroundColor: theme.colors.surface,
		borderRadius: 12,
		padding: 16,
		borderWidth: 1,
		borderColor: theme.colors.border,
	},
	totalDurationText: {
		fontSize: 16,
		fontWeight: '600',
		color: theme.colors.textPrimary,
	},
	practiceDurationText: {
		fontSize: 14,
		color: theme.colors.textMuted,
		marginTop: 4,
	},
});
