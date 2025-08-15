import { useEffect, useState } from "react";
import {
	View,
	Text,
	TextInput,
	ActivityIndicator,
	StyleSheet,
	Alert,
	TouchableOpacity,
	Keyboard,
	TouchableWithoutFeedback,
	ScrollView,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { supabase } from "../lib/supabase";
import { MaterialIcons } from "@expo/vector-icons";
import DraggableFlatList from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import theme from "./styles/theme";

// Custom Cancel Button Component
const CustomCancelButton = ({ onPress }) => (
	<TouchableOpacity
		onPress={onPress}
		style={{
			backgroundColor: '#FF3B30',
			paddingVertical: 12,
			borderRadius: 8,
			minHeight: 44,
			flex: 1,
			justifyContent: 'center',
			alignItems: 'center',
		}}
		activeOpacity={0.8}
	>
		<Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
			Cancel
		</Text>
	</TouchableOpacity>
);

export default function PracticeDetails({ route }) {
	const { practiceId } = route.params;
	const [practice, setPractice] = useState(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	const [startDate, setStartDate] = useState(new Date());
	const [duration, setDuration] = useState(60); // Duration in minutes
	const [notes, setNotes] = useState("");
	const [showStartPicker, setShowStartPicker] = useState(false);
	const [drills, setDrills] = useState([]);
	const [drillDurations, setDrillDurations] = useState({});

	useEffect(() => {
		fetchPracticeDetails();
	}, []);

	const toggleStartPicker = () => setShowStartPicker((prev) => !prev);

	// Helper function to convert local datetime to UTC without timezone shift
	const toLocalISOString = (date) => {
		const tzoffset = date.getTimezoneOffset() * 60000; // offset in milliseconds
		return new Date(date.getTime() - tzoffset).toISOString().slice(0, -1);
	};

	const fetchPracticeDetails = async () => {
		const { data, error } = await supabase
			.from("Practice")
			.select("*")
			.eq("id", practiceId)
			.single();

		if (error) {
			console.error("Error fetching practice:", error);
			Alert.alert("Error", "Could not load practice details.");
		} else {
			setPractice(data);
			// Parse the stored datetime as local time (not UTC)
			setStartDate(new Date(data.startTime.replace("Z", "")));
			setDuration(data.duration || 60);
			setNotes(data.notes || "");
			setDrills(data.drills || []);
			
			// Initialize drill durations
			const initialDurations = {};
			if (data.drills) {
				data.drills.forEach((drill, index) => {
					initialDurations[index] = data.drillDurations?.[index] || Math.floor(data.duration / data.drills.length);
				});
			}
			setDrillDurations(initialDurations);
		}
		setLoading(false);
	};



	const saveChanges = async () => {
		setSaving(true);

		// Convert local time to ISO string without timezone conversion
		const startTimeString = toLocalISOString(startDate);

		console.log("Saving practice:", {
			startLocal: startDate.toString(),
			duration: duration,
			startSaved: startTimeString,
		});

		const { error } = await supabase
			.from("Practice")
			.update({
				startTime: startTimeString,
				duration: duration,
				notes,
				drills,
				drillDurations: drillDurations,
			})
			.eq("id", practiceId);

		setSaving(false);

		if (error) {
			console.error("Error updating practice:", error);
			Alert.alert("Error", "Failed to update practice.");
		} else {
			Alert.alert("Success", "Practice updated!");
			setPractice((prev) => ({
				...prev,
				startTime: startTimeString,
				duration: duration,
				notes,
				drills,
			}));
		}
	};

	const handleDrillsReorder = (newOrder) => setDrills(newOrder);
	const handleNotesChange = (text) => setNotes(text);

	if (loading) {
		return (
			<View style={styles.containerCentered}>
				<ActivityIndicator size="large" color="#007AFF" />
			</View>
		);
	}

	if (!practice) {
		return (
			<View style={styles.containerCentered}>
				<Text style={styles.emptyText}>Practice not found.</Text>
			</View>
		);
	}

	const renderDrill = ({ item, index, drag, isActive }) => {
		const drillDuration = drillDurations[index] || 0;
		const totalDrillDuration = Object.values(drillDurations).reduce((sum, dur) => sum + (dur || 0), 0);
		const isDurationValid = totalDrillDuration === duration;
		
		return (
			<TouchableOpacity
				style={[
					styles.drillItem,
					{ backgroundColor: isActive ? theme.colors.primary : theme.colors.surface },
				]}
				onLongPress={drag}
				activeOpacity={0.8}
			>
				<View style={styles.drillContent}>
					<Text style={[styles.drillText, isActive && { color: theme.colors.white }]}>
						{item}
					</Text>
					<View style={styles.durationInputContainer}>
						<TextInput
							style={[
								styles.durationInput,
								isActive && { color: theme.colors.white, borderColor: theme.colors.white }
							]}
							value={drillDuration.toString()}
							onChangeText={(text) => {
								const newDuration = parseInt(text) || 0;
								setDrillDurations(prev => ({
									...prev,
									[index]: newDuration
								}));
							}}
							keyboardType="numeric"
							placeholder="0"
							placeholderTextColor={isActive ? theme.colors.white : theme.colors.textMuted}
							editable={!isActive}
							returnKeyType="done"
							onSubmitEditing={Keyboard.dismiss}
							blurOnSubmit={true}
							keyboardAppearance="dark"
						/>
						<Text style={[styles.durationUnit, isActive && { color: theme.colors.white }]}>
							min
						</Text>
					</View>
				</View>
				{/* <View style={styles.drillActions}>
					<MaterialIcons
						name="drag-handle"
						size={20}
						color={isActive ? theme.colors.white : theme.colors.textMuted}
					/>
				</View> */}
			</TouchableOpacity>
		);
	};

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<View style={styles.container}>
				<ScrollView 
					style={styles.scrollView}
					contentContainerStyle={styles.scrollContent}
					showsVerticalScrollIndicator={false}
				>
					<TouchableWithoutFeedback
						onPress={Keyboard.dismiss}
						accessible={false}
					>
						<View>
							<Text style={styles.title}>Practice Details</Text>

							<Text style={styles.label}>Start Time</Text>
							<TouchableOpacity
								onPress={toggleStartPicker}
								style={styles.dateTouchable}
								activeOpacity={0.7}
							>
								<Text style={styles.dateText}>
									{startDate.toLocaleString()}
								</Text>
								<MaterialIcons name="edit" size={18} color="#007AFF" />
							</TouchableOpacity>
							<DateTimePickerModal
								isVisible={showStartPicker}
								mode="datetime"
								onConfirm={(date) => {
									setStartDate(date);
									setShowStartPicker(false);
								}}
								onCancel={() => setShowStartPicker(false)}
								date={startDate}
								textColor={theme.colors.white}
								themeVariant="dark"
								display="spinner"
								modalStyleIOS={{
									backgroundColor: theme.colors.surface,
									height: '25%',
									alignSelf: 'center',
									marginTop: '200%',
									borderRadius: 12,
								}}
								buttonTextColorIOS={theme.colors.white}
								confirmTextIOS="Done"
								customCancelButtonIOS={CustomCancelButton}
								pickerContainerStyleIOS={{
									backgroundColor: theme.colors.surface,
								}}
							/>

							<Text style={styles.label}>Duration (minutes)</Text>
							<View style={styles.durationInputWrapper}>
								<TextInput
									style={styles.practiceDurationInput}
									value={duration.toString()}
									onChangeText={(text) => {
										const newDuration = parseInt(text) || 0;
										setDuration(newDuration);
									}}
									keyboardType="numeric"
									placeholder="60"
									placeholderTextColor={theme.colors.textMuted}
									returnKeyType="done"
									onSubmitEditing={Keyboard.dismiss}
									blurOnSubmit={true}
									keyboardAppearance="dark"
								/>
								<Text style={styles.durationLabel}>minutes</Text>
							</View>

							<View style={styles.notesHeader}>
								<Text style={styles.label}>Notes</Text>
							</View>

							<TextInput
								style={styles.notesInput}
								multiline
								numberOfLines={4}
								value={notes}
								onChangeText={handleNotesChange}
								placeholder="Add notes about this practice..."
								placeholderTextColor="#aaa"
								onSubmitEditing={Keyboard.dismiss}
							/>

							<Text style={[styles.label, { marginTop: 24 }]}>
								Drills (hold and drag to reorder)
							</Text>
							{(() => {
								const totalDrillDuration = Object.values(drillDurations).reduce((sum, dur) => sum + (dur || 0), 0);
								const isDurationValid = totalDrillDuration === duration;
								
								if (!isDurationValid && drills.length > 0) {
									return (
										<Text style={styles.validationText}>
											⚠️ Drill durations ({totalDrillDuration} min) must equal practice duration ({duration} min)
										</Text>
									);
								}
								return null;
							})()}
							<DraggableFlatList
								data={drills}
								onDragEnd={({ data }) => handleDrillsReorder(data)}
								keyExtractor={(item, index) => `${item}-${index}`}
								renderItem={renderDrill}
								containerStyle={styles.drillListContainer}
								scrollEnabled={false}
							/>
						</View>
					</TouchableWithoutFeedback>
				</ScrollView>

				<View style={styles.stickyButtonContainer}>
					<TouchableOpacity
						style={[
							styles.saveButton,
							saving && styles.saveButtonDisabled,
						]}
						onPress={saveChanges}
						disabled={saving}
						activeOpacity={0.8}
					>
						<Text style={styles.saveButtonText}>
							{saving ? "Saving..." : "Save Changes"}
						</Text>
					</TouchableOpacity>
				</View>
			</View>
		</GestureHandlerRootView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: theme.colors.background,
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		padding: 20,
		paddingBottom: 100, // Extra padding to account for sticky button
	},
	containerCentered: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: theme.colors.background,
	},
	emptyText: {
		fontSize: 18,
		color: theme.colors.textMuted,
	},
	title: {
		fontSize: 26,
		fontWeight: "700",
		marginBottom: 24,
		color: theme.colors.textPrimary,
	},
	label: {
		fontWeight: "600",
		fontSize: 16,
		marginBottom: 8,
		color: theme.colors.textPrimary,
	},
	dateTouchable: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		borderBottomWidth: 1,
		borderColor: theme.colors.border,
		paddingVertical: 10,
		marginBottom: 16,
	},
	dateText: {
		fontSize: 16,
		color: theme.colors.primary,
	},
	durationInputWrapper: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 16,
	},
	practiceDurationInput: {
		width: 80,
		height: 40,
		borderWidth: 1,
		borderColor: theme.colors.border,
		borderRadius: 8,
		paddingHorizontal: 12,
		paddingVertical: 8,
		fontSize: 16,
		color: theme.colors.textPrimary,
		backgroundColor: theme.colors.surface,
		textAlign: 'center',
	},
	durationLabel: {
		fontSize: 16,
		color: theme.colors.textPrimary,
		marginLeft: 8,
	},
	notesHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	notesInput: {
		borderWidth: 1,
		borderColor: theme.colors.border,
		borderRadius: 10,
		padding: 12,
		fontSize: 16,
		backgroundColor: theme.colors.surface,
		textAlignVertical: "top",
		color: theme.colors.textPrimary,
	},
	drillListContainer: {
		maxHeight: 280,
	},
	drillItem: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: 14,
		paddingHorizontal: 20,
		marginVertical: 6,
		backgroundColor: theme.colors.surface,
		borderRadius: 12,
		shadowColor: theme.colors.surface,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
		borderWidth: 1,
		borderColor: theme.colors.white,
	},
	drillText: { 
		fontSize: 16, 
		color: theme.colors.white,
		flex: 1,
	},
	durationInputContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginLeft: 8,
	},
	durationInput: {
		width: 50,
		height: 30,
		borderWidth: 1,
		borderColor: theme.colors.white,
		borderRadius: 6,
		paddingHorizontal: 8,
		paddingVertical: 4,
		fontSize: 14,
		color: theme.colors.white,
		textAlign: 'center',
		backgroundColor: 'transparent',
	},
	durationUnit: {
		fontSize: 14,
		color: theme.colors.white,
		marginLeft: 4,
	},
	drillContent: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
	},
	drillActions: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	validationText: {
		color: '#FF6B6B',
		fontSize: 14,
		marginBottom: 8,
		fontWeight: '500',
	},
	stickyButtonContainer: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		backgroundColor: theme.colors.background,
		paddingHorizontal: 20,
		paddingVertical: 16,
		borderTopWidth: 1,
		borderTopColor: theme.colors.border,
		shadowColor: theme.colors.surface,
		shadowOffset: { width: 0, height: -2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	saveButton: {
		backgroundColor: theme.colors.primary,
		paddingVertical: 16,
		borderRadius: 12,
		alignItems: "center",
		shadowColor: theme.colors.primary,
		shadowOffset: { width: 0, height: 5 },
		shadowOpacity: 0.4,
		shadowRadius: 6,
		elevation: 5,
	},
	saveButtonDisabled: { 
		backgroundColor: theme.colors.border 
	},
	saveButtonText: { 
		color: theme.colors.white, 
		fontWeight: "700", 
		fontSize: 18 
	},
});
