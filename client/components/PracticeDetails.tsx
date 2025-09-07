import { useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { exportPracticeToPDF } from "../util/pdfExport";
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
	KeyboardAvoidingView,
	Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { supabase } from "../lib/supabase";
import { MaterialIcons } from "@expo/vector-icons";

import { GestureHandlerRootView } from "react-native-gesture-handler";
import DraggableFlatList from "react-native-draggable-flatlist";
import theme from "./styles/theme";
import { useSession } from "../context/SessionContext";
import { usePractices } from "../context/PracticesContext";
import { useSubscription } from "../context/UserRoleContext";
import { useDrills } from "../context/DrillsContext";

// Custom Cancel Button Component
const CustomCancelButton = ({ onPress }) => (
	<TouchableOpacity
		onPress={onPress}
		style={{
			backgroundColor: '#FF3B30',
			paddingVertical: 12,
			paddingHorizontal: 16,
			borderRadius: 8,
			minHeight: 44,
			justifyContent: 'center',
			alignItems: 'center',
			marginHorizontal: 16,
			marginBottom: 8,
		}}
		activeOpacity={0.8}
	>
		<Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
			Cancel
		</Text>
	</TouchableOpacity>
);

// Custom Confirm Button Component for Copy Practice
const CustomConfirmButton = ({ onPress }) => (
	<TouchableOpacity
		onPress={onPress}
		style={{
			backgroundColor: '#FFA500',
			paddingVertical: 12,
			paddingHorizontal: 16,
			borderRadius: 8,
			minHeight: 44,
			justifyContent: 'center',
			alignItems: 'center',
			marginHorizontal: 16,
			marginBottom: 8,
		}}
		activeOpacity={0.8}
	>
		<Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
			Copy Practice
		</Text>
	</TouchableOpacity>
);

export default function PracticeDetails({ route }) {
	const navigation = useNavigation();
	const { practiceId } = route.params;
	const { addPractice, updatePractice, deletePractice: deletePracticeFromContext } = usePractices();
	const { isPremium } = useSubscription();
	const { publicDrills, userDrills } = useDrills();
	const session = useSession();
	const [practice, setPractice] = useState(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [isEditing, setIsEditing] = useState(false);

	const [startDate, setStartDate] = useState(new Date());
	const [duration, setDuration] = useState(60); // Duration in minutes
	const [notes, setNotes] = useState("");
	const [showStartPicker, setShowStartPicker] = useState(false);
	const [showCopyDatePicker, setShowCopyDatePicker] = useState(false);
	const [drills, setDrills] = useState([]);
	const [drillDurations, setDrillDurations] = useState({});
	const [reorderedDrills, setReorderedDrills] = useState([]);
	const [editFocusKey, setEditFocusKey] = useState(0);

	// Store original values for cancel functionality
	const [originalValues, setOriginalValues] = useState({});

	useEffect(() => {
		fetchPracticeDetails();
	}, []);

	// Sync reorderedDrills with drills when drills change
	useEffect(() => {
		setReorderedDrills(drills);
	}, [drills]);

	// Increment edit focus key when editing starts to force DraggableFlatList reinitialization
	useEffect(() => {
		if (isEditing) {
			setEditFocusKey(prev => prev + 1);
		}
	}, [isEditing]);

	const toggleStartPicker = () => setShowStartPicker((prev) => !prev);

	// Helper function to convert local datetime to UTC without timezone shift
	const toLocalISOString = (date) => {
		const tzoffset = date.getTimezoneOffset() * 60000; // offset in milliseconds
		return new Date(date.getTime() - tzoffset).toISOString().slice(0, -1);
	};

	const fetchPracticeDetails = async () => {
		const { data, error } = await supabase
			.from("Practice")
			.select("id, title, startTime, endTime, drills, practiceDuration, notes, teamId")
			.eq("id", practiceId)
			.single();

		if (error) {
			console.error("Error fetching practice:", error);
			Alert.alert("Error", "Could not load practice details.");
		} else {
			setPractice(data);
			// Parse the stored datetime as local time (not UTC)
			setStartDate(new Date(data.startTime.replace("Z", "")));
			// Use practiceDuration from database, otherwise use default
			setDuration(data.practiceDuration || 60);
			setNotes(data.notes || "");
			setDrills(data.drills || []);
			
			// Initialize drill durations by dividing practice duration evenly
			const initialDurations = {};
			if (data.drills) {
				data.drills.forEach((drill, index) => {
					const drillKey = `${drill}-${index}`;
					initialDurations[drillKey] = Math.floor((data.practiceDuration || 60) / data.drills.length);
				});
			}
			setDrillDurations(initialDurations);
		}
		setLoading(false);
	};

	const deletePractice = async () => {
		try {
			await deletePracticeFromContext(practiceId);
			
			Alert.alert("Success", "Practice deleted!", [
				{
					text: "OK",
					onPress: () => {
						// Navigate back to previous screen
						navigation.goBack();
					}
				}
			]);
		} catch (error) {
			console.error("Error deleting practice:", error);
			Alert.alert("Error", "Failed to delete practice.");
		}
	};

	const confirmDelete = () => {
		Alert.alert(
			"Delete Practice",
			"Are you sure you want to delete this practice? This action cannot be undone.",
			[
				{ text: "Cancel", style: "cancel" },
				{ text: "Delete", style: "destructive", onPress: deletePractice }
			]
		);
	};

	const startEditing = () => {
		// Store current values as original values
		setOriginalValues({
			startDate: new Date(startDate),
			duration,
			notes,
			drills: [...drills],
			drillDurations: { ...drillDurations }
		});
		setIsEditing(true);
	};

	const cancelEditing = () => {
		// Restore original values
		setStartDate(originalValues.startDate || new Date());
		setDuration(originalValues.duration || 60);
		setNotes(originalValues.notes || "");
		setDrills(originalValues.drills || []);
		setDrillDurations(originalValues.drillDurations || {});
		setIsEditing(false);
	};

	const handleSharePDF = async () => {
		try {
			// Convert drillDurations object to drillDuration array for PDF export
			const drillDurationArray = drills.map((drill, index) => {
				// Find the duration by searching all keys that start with the drill name
				let duration = 0;
				
				// First, try to find a key with a non-zero duration
				for (const [key, value] of Object.entries(drillDurations)) {
					if (key.startsWith(`${drill}-`) && (value as number) > 0) {
						duration = value as number;
						break;
					}
				}
				
				// If no non-zero duration found, use the first key with index 0
				if (duration === 0) {
					for (const [key, value] of Object.entries(drillDurations)) {
						if (key === `${drill}-0`) {
							duration = value as number;
							break;
						}
					}
				}
				
				return duration;
			});

			// Create practice object with drillDuration array for PDF export
			const practiceForPDF = {
				...practice,
				drillDuration: drillDurationArray
			};

			await exportPracticeToPDF(practiceForPDF);
		} catch (error) {
			console.error('Error sharing PDF:', error);
			Alert.alert("Error", "Failed to share PDF");
		}
	};



	const saveChanges = async () => {
		setSaving(true);

		// Convert local time to ISO string without timezone conversion
		const startTimeString = toLocalISOString(startDate);


		// Calculate total drill duration for validation
		let totalDrillDuration = 0;
		for (const [key, value] of Object.entries(drillDurations)) {
			if ((value as number) > 0) {
				totalDrillDuration += value as number;
			}
		}

		// Validate that drill durations sum to practice duration
		if (totalDrillDuration !== duration) {
			Alert.alert(
				"Duration Mismatch", 
				`Total drill duration (${totalDrillDuration} min) must equal practice duration (${duration} min). Please adjust the drill durations.`
			);
			setSaving(false);
			return;
		}

		// Convert drillDurations object to array format for JSONB storage
		const drillDurationArray = reorderedDrills.map((drill, index) => {
			// Find the duration by searching all keys that start with the drill name
			let duration = 0;
			let foundKey = '';
			
			// First, try to find a key with a non-zero duration
			for (const [key, value] of Object.entries(drillDurations)) {
				if (key.startsWith(`${drill}-`) && (value as number) > 0) {
					duration = value as number;
					foundKey = key;
					break;
				}
			}
			
			// If no non-zero duration found, use the first key with index 0
			if (duration === 0) {
				for (const [key, value] of Object.entries(drillDurations)) {
					if (key === `${drill}-0`) {
						duration = value as number;
						foundKey = key;
						break;
					}
				}
			}
			
			return duration;
		});

		await updatePractice(practiceId, {
			startTime: startTimeString,
			practiceDuration: duration,
			notes,
			drills: reorderedDrills,
		});

		setSaving(false);
		Alert.alert("Success", "Practice updated!");
		// Refresh the practice data from the database to ensure we have the latest data
		await fetchPracticeDetails();
		setIsEditing(false); // Exit edit mode after successful save
	};

	const handleDrillsReorder = ({ data }: { data: string[] }) => {
		console.log("Drills reordered:", data);
		setReorderedDrills(data);
		setDrills(data);
	};

	const handleCopyPractice = () => {
		// Show date picker for the new practice date
		setShowCopyDatePicker(true);
	};

	const handleCopyPracticeWithDate = async (selectedDate) => {
		try {
			setShowCopyDatePicker(false);
			
			// Create a new practice with the same data but the selected date
			const newPractice = {
				title: `${practice.title} (Copy)`,
				startTime: toLocalISOString(selectedDate),
				practiceDuration: practice.practiceDuration || 60,
				notes: practice.notes || "",
				drills: practice.drills || [],
				teamId: practice.teamId,
			};

			// Use the practices context to add the new practice
			const newPracticeData = await addPractice(newPractice);

			Alert.alert(
				"Practice Copied!", 
				`Practice has been copied successfully and scheduled for ${selectedDate.toLocaleDateString()} at ${selectedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
			);
		} catch (error) {
			console.error("Error copying practice:", error);
			Alert.alert("Error", "Failed to copy practice.");
		}
	};
	const handleNotesChange = (text) => setNotes(text);



	if (!practice) {
		return (
			<View style={styles.containerCentered}>
				<Text style={styles.emptyText}>Practice not found.</Text>
			</View>
		);
	}



	return (
		<SafeAreaView style={{ flex: 1 }}>
			<KeyboardAvoidingView 
				style={{ flex: 1 }} 
				behavior={Platform.OS === "ios" ? "padding" : "height"}
			>
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
							<Text style={styles.title}>{practice.title || "Practice"}</Text>

							<Text style={styles.label}>Start Time</Text>
							{isEditing ? (
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
							) : (
								<View style={styles.readOnlyField}>
									<Text style={styles.readOnlyText}>
										{startDate.toLocaleString()}
									</Text>
								</View>
							)}
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
									height: '35%',
									alignSelf: 'center',
									marginTop: '150%',
									borderRadius: 12,
								}}
								buttonTextColorIOS={theme.colors.white}
								confirmTextIOS="Done"
								customCancelButtonIOS={CustomCancelButton}
								pickerContainerStyleIOS={{
									backgroundColor: theme.colors.surface,
								}}
							/>

							{/* Copy Practice Date Picker */}
							<DateTimePickerModal
								isVisible={showCopyDatePicker}
								mode="datetime"
								onConfirm={handleCopyPracticeWithDate}
								onCancel={() => setShowCopyDatePicker(false)}
								date={new Date()}
								textColor={theme.colors.white}
								themeVariant="dark"
								display="spinner"
								modalStyleIOS={{
									backgroundColor: theme.colors.surface,
									height: '35%',
									alignSelf: 'center',
									marginTop: '150%',
									borderRadius: 12,
								}}
								buttonTextColorIOS={theme.colors.white}
								confirmTextIOS="Copy Practice"
								cancelTextIOS="Cancel"
								customCancelButtonIOS={CustomCancelButton}
								customConfirmButtonIOS={CustomConfirmButton}
								pickerContainerStyleIOS={{
									backgroundColor: theme.colors.surface,
								}}
							/>

							<Text style={styles.label}>Duration (minutes)</Text>
							{isEditing ? (
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
							) : (
								<View style={styles.readOnlyField}>
									<Text style={styles.readOnlyText}>
										{duration} minutes
									</Text>
								</View>
							)}

							<View style={styles.notesHeader}>
								<Text style={styles.label}>Notes</Text>
							</View>

							{isEditing ? (
								<TextInput
									style={styles.notesInput}
									multiline
									numberOfLines={4}
									value={notes}
									onChangeText={handleNotesChange}
									placeholder="Add notes about this practice..."
									placeholderTextColor={theme.colors.textMuted}
									returnKeyType="done"
									onSubmitEditing={Keyboard.dismiss}
									blurOnSubmit={true}
									keyboardAppearance="dark"
								/>
							) : (
								<View style={styles.readOnlyField}>
									<Text style={styles.readOnlyText}>
										{notes || "No notes added"}
									</Text>
								</View>
							)}

							<Text style={[styles.label, { marginTop: 24 }]}>
								Drills {isEditing && "(long press and drag to reorder)"}
							</Text>
							{isEditing && (() => {
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
							{isEditing ? (
								<View style={styles.drillListContainer}>
									<GestureHandlerRootView style={{ flex: 1 }}>
										<DraggableFlatList
											key={editFocusKey}
											data={reorderedDrills}
											onDragEnd={handleDrillsReorder}
											keyExtractor={(item) => item}
											renderItem={({ item: drill, drag, isActive, index }) => {
												// Find the duration using the same logic as the save function
												let drillDuration = 0;
												let drillKey = '';
												
												// First, try to find a key with a non-zero duration
												for (const [key, value] of Object.entries(drillDurations)) {
													if (key.startsWith(`${drill}-`) && (value as number) > 0) {
														drillDuration = value as number;
														drillKey = key;
														break;
													}
												}
												
												// If no non-zero duration found, use the first key with index 0
												if (drillDuration === 0) {
													for (const [key, value] of Object.entries(drillDurations)) {
														if (key === `${drill}-0`) {
															drillDuration = value as number;
															drillKey = key;
															break;
														}
													}
												}
												
												// If still no key found, create a default one
												if (!drillKey) {
													drillKey = `${drill}-0`;
												}
												
												const totalDrillDuration = Object.values(drillDurations).reduce((sum, dur) => sum + (dur || 0), 0);
												const isDurationValid = totalDrillDuration === duration;
												
												return (
													<TouchableOpacity
														style={[
															styles.drillItem,
															{ backgroundColor: theme.colors.surface },
															isActive && { opacity: 0.5 }
														]}
														onLongPress={drag}
														delayLongPress={150}
														activeOpacity={0.8}
													>
														<View style={styles.dragHandle}>
															<MaterialIcons name="drag-handle" size={20} color={theme.colors.textMuted} />
														</View>
														<View style={styles.drillContent}>
															<Text style={styles.drillText}>
																{drill}
															</Text>
															<View style={styles.durationInputContainer}>
																<TextInput
																	key={`drill-duration-${drillKey}`}
																	style={styles.durationInput}
																	value={drillDuration.toString()}
																	onChangeText={(text) => {
																		const newDuration = parseInt(text) || 0;
																		setDrillDurations(prev => {
																			const updated = {
																				...prev,
																				[drillKey]: newDuration
																			};
																			return updated;
																		});
																	}}
																	keyboardType="numeric"
																	placeholder="0"
																	placeholderTextColor={theme.colors.textMuted}
																	returnKeyType="done"
																	onSubmitEditing={Keyboard.dismiss}
																	blurOnSubmit={true}
															keyboardAppearance="dark"
																/>
																<Text style={styles.durationUnit}>
																	min
																</Text>
															</View>
														</View>
													</TouchableOpacity>
												);
											}}
											contentContainerStyle={styles.draggableListContent}
											autoscrollThreshold={10}
											autoscrollSpeed={10}
											activationDistance={10}
										/>
									</GestureHandlerRootView>
								</View>
							) : (
								<View style={styles.readOnlyDrillsContainer}>
									{drills.map((drill, index) => {
										// Check if user has access to this drill
										const allDrills = [...(publicDrills || []), ...(userDrills || [])];
										const drillObject = allDrills.find(d => d.name === drill);
										
										// If user is free and drill is not in their user drills, hide it
										if (!isPremium && drillObject && drillObject.isPublic && session?.user?.id && drillObject.user_id !== session.user.id) {
											return null;
										}
										
										// Find the duration using the same logic as the save function
										let drillDuration = 0;
										for (const [key, value] of Object.entries(drillDurations)) {
											if (key.startsWith(`${drill}-`) && (value as number) > 0) {
												drillDuration = value as number;
												break;
											}
										}
										if (drillDuration === 0) {
											for (const [key, value] of Object.entries(drillDurations)) {
												if (key === `${drill}-0`) {
													drillDuration = value as number;
													break;
												}
											}
										}
										
										return (
											<TouchableOpacity
												key={`${drill}-${index}`}
												style={styles.readOnlyDrillItem}
												onPress={() => {
													// Find the drill object from available drills
													if (drillObject) {
														navigation.navigate('Drill Details', { drill: drillObject });
													} else {
														Alert.alert("Drill Not Found", "This drill is not available in the drill library.");
													}
												}}
												activeOpacity={0.7}
											>
												<Text style={styles.readOnlyDrillText}>{drill}</Text>
												<Text style={styles.readOnlyDrillDuration}>{drillDuration} min</Text>
											</TouchableOpacity>
										);
									})}
								</View>
							)}
						</View>
					</TouchableWithoutFeedback>
				</ScrollView>

				<View style={styles.stickyButtonContainer}>
					{isEditing ? (
						// Edit mode: Save and Cancel buttons
						<>
							{(() => {
								const totalDrillDuration = Object.values(drillDurations).reduce((sum, dur) => sum + (dur || 0), 0);
								const isDurationValid = totalDrillDuration === duration;
								const isDisabled = saving || !isDurationValid;
								
								return (
									<TouchableOpacity
										style={[
											styles.saveButton,
											isDisabled && styles.saveButtonDisabled,
										]}
										onPress={() => {
											if (isDisabled && !saving) {
												Alert.alert(
													"Duration Mismatch", 
													`Total drill duration (${totalDrillDuration} min) must equal practice duration (${duration} min). Please adjust the drill durations.`
												);
											} else {
												saveChanges();
											}
										}}
										activeOpacity={0.8}
									>
										<Text style={styles.saveButtonText}>
											{saving ? "Saving..." : "Save Changes"}
										</Text>
									</TouchableOpacity>
								);
							})()}
							<TouchableOpacity
								style={styles.cancelButton}
								onPress={cancelEditing}
								activeOpacity={0.8}
							>
								<Text style={styles.cancelButtonText}>Cancel</Text>
							</TouchableOpacity>
						</>
					) : (
						// Read-only mode: Edit, Share, Copy, and Delete buttons
						<View style={styles.buttonRow}>
							<TouchableOpacity
								style={[styles.editButton, styles.quarterWidthButton]}
								onPress={startEditing}
								activeOpacity={0.8}
							>
								<Text style={styles.editButtonText}>Edit</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[styles.shareButton, styles.quarterWidthButton]}
								onPress={handleSharePDF}
								activeOpacity={0.8}
							>
								<Text style={styles.shareButtonText}>Share</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[styles.copyButton, styles.quarterWidthButton]}
								onPress={handleCopyPractice}
								activeOpacity={0.8}
							>
								<Text style={styles.copyButtonText}>Copy</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[styles.deleteButton, styles.quarterWidthButton]}
								onPress={confirmDelete}
								activeOpacity={0.8}
							>
								<Text style={styles.deleteButtonText}>Delete</Text>
							</TouchableOpacity>
						</View>
					)}
				</View>
			</View>
				</GestureHandlerRootView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: theme.colors.background,
	},
	scrollView: {
		flex: 1,
		// paddingBottom: 300,
	},
	scrollContent: {
		padding: 20,
		paddingBottom: 200, // Extra padding to account for sticky button and keyboard
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
		// Removed maxHeight to allow full scrolling
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
	// Read-only styles
	readOnlyField: {
		borderBottomWidth: 1,
		borderColor: theme.colors.border,
		paddingVertical: 10,
		marginBottom: 16,
	},
	readOnlyText: {
		fontSize: 16,
		color: theme.colors.textPrimary,
	},
	readOnlyDrillsContainer: {
		// Removed maxHeight to allow full scrolling
	},
	readOnlyDrillItem: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: 14,
		paddingHorizontal: 20,
		marginVertical: 6,
		backgroundColor: theme.colors.surface,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: theme.colors.border,
	},
	readOnlyDrillText: { 
		fontSize: 16, 
		color: theme.colors.textPrimary,
		flex: 1,
	},
	readOnlyDrillDuration: {
		fontSize: 14,
		color: theme.colors.textMuted,
	},
	// Button styles
	editButton: {
		backgroundColor: theme.colors.primary,
		paddingVertical: 16,
		borderRadius: 12,
		alignItems: "center",
		marginBottom: 8,
		shadowColor: theme.colors.primary,
		shadowOffset: { width: 0, height: 5 },
		shadowOpacity: 0.4,
		shadowRadius: 6,
		elevation: 5,
	},
	editButtonText: { 
		color: theme.colors.white, 
		fontWeight: "700", 
		fontSize: 18 
	},
	deleteButton: {
		backgroundColor: "#FF3B30",
		paddingVertical: 16,
		borderRadius: 12,
		alignItems: "center",
		shadowColor: "#FF3B30",
		shadowOffset: { width: 0, height: 5 },
		shadowOpacity: 0.4,
		shadowRadius: 6,
		elevation: 5,
	},
	deleteButtonText: { 
		color: theme.colors.white, 
		fontWeight: "700", 
		fontSize: 18 
	},
	cancelButton: {
		backgroundColor: theme.colors.border,
		paddingVertical: 16,
		borderRadius: 12,
		alignItems: "center",
		marginTop: 8,
	},
	cancelButtonText: { 
		color: theme.colors.textPrimary, 
		fontWeight: "700", 
		fontSize: 18 
	},
	// Button row styles
	buttonRow: {
		flexDirection: 'row',
		gap: 12,
	},
	halfWidthButton: {
		flex: 1,
		marginBottom: 0,
		marginTop: 0,
	},
	thirdWidthButton: {
		flex: 1,
		marginBottom: 0,
		marginTop: 0,
	},
	quarterWidthButton: {
		flex: 1,
		marginBottom: 0,
		marginTop: 0,
	},
	dragHandle: {
		marginRight: 12,
		padding: 8,
		minWidth: 32,
		minHeight: 32,
		justifyContent: "center",
		alignItems: "center",
	},
	draggableListContent: {
		paddingBottom: 20,
	},
	shareButton: {
		backgroundColor: theme.colors.secondary,
		paddingVertical: 16,
		borderRadius: 12,
		alignItems: "center",
		marginBottom: 0,
		shadowColor: theme.colors.secondary,
		shadowOffset: { width: 0, height: 5 },
		shadowOpacity: 0.4,
		shadowRadius: 6,
		elevation: 5,
	},
	shareButtonText: { 
		color: theme.colors.white, 
		fontWeight: "700", 
		fontSize: 18 
	},
	copyButton: {
		backgroundColor: "#FFA500",
		paddingVertical: 16,
		borderRadius: 12,
		alignItems: "center",
		marginBottom: 0,
		shadowColor: "#FFA500",
		shadowOffset: { width: 0, height: 5 },
		shadowOpacity: 0.4,
		shadowRadius: 6,
		elevation: 5,
	},
	copyButtonText: { 
		color: theme.colors.white, 
		fontWeight: "700", 
		fontSize: 18 
	},
});
