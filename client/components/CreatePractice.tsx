// CreatePractice.tsx
import { useEffect, useState } from "react";
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TextInput,
	TouchableOpacity,
	KeyboardAvoidingView,
	Platform,
	TouchableWithoutFeedback,
	Keyboard,
	ActivityIndicator,
	Button,
	Modal,
} from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import Dropdown from "react-native-input-select";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import DraggableFlatList from "react-native-draggable-flatlist";
import { useNavigation, useRoute } from "@react-navigation/native";
import Constants from "expo-constants";
import { supabase } from "../lib/supabase";
import PracticeDateTimePicker from "./PracticeDateTimePicker";
import { fetchUserDrills } from "../util/fetchDrills";

const CreatePractice = () => {
	const navigation = useNavigation();
	const route = useRoute();
	const [availableDrills, setAvailableDrills] = useState<string[]>([]);
	const [modalVisible, setModalVisible] = useState(false);

	const [drills, setDrills] = useState([]);
	const [loadingDrills, setLoadingDrills] = useState(true);
	// console.log(drills, 'new drills')
	const [startDate, setStartDate] = useState<Date | null>(null);
	const [endDate, setEndDate] = useState<Date | null>(null);
	const [selectedDrills, setSelectedDrills] = useState<string[]>([]);
	const [notes, setNotes] = useState("");

	useEffect(() => {
		const loadDrills = async () => {
			try {
				const drillsData = await fetchUserDrills();
				setAvailableDrills(drillsData.map((d: any) => d.name));
			} catch (error) {
				console.error("Error fetching drills:", error);
			}
		};
		loadDrills();
	}, []);

	const handleDatesChange = (start: Date, end: Date) => {
		setStartDate(start);
		setEndDate(end);
	};

	function toLocalISOString(date: Date) {
		const tzoffset = date.getTimezoneOffset() * 60000; // offset in ms
		return new Date(date.getTime() - tzoffset).toISOString().slice(0, -1);
	}

	async function insertData(
		startDate: Date,
		endDate: Date,
		drills: string[],
		notes: string
	) {
		const { data, error } = await supabase.from("Practice").insert([
			{
				startTime: toLocalISOString(startDate),
				endTime: toLocalISOString(endDate),
				teamId: "b2416750-a2c4-4142-a47b-d0fd11ca678a",
				drills: drills,
				notes: notes || null,
			},
		]);

		if (error) {
			console.error("Error inserting data:", error);
		} else {
			console.log("Data inserted successfully:", data);
		}
	}

	const handleSubmit = async () => {
		if (!startDate || !endDate) {
			alert("Please select valid start and end times");
			return;
		}
		if (endDate <= startDate) {
			alert("End time must be after start time");
			return;
		}

		await insertData(startDate, endDate, selectedDrills, notes);
		navigation.goBack();
	};

	// Format date for header display
	const formatSelectedDate = () => {
		if (startDate) {
			return startDate.toLocaleDateString("en-US", {
				weekday: "long",
				year: "numeric",
				month: "long",
				day: "numeric",
			});
		}
		return null;
	};

	// Function to remove a drill from selected drills
	const removeDrill = (drillToRemove: string) => {
		setSelectedDrills((prev) =>
			prev.filter((drill) => drill !== drillToRemove)
		);
	};

	return (
		<SafeAreaProvider>
			<SafeAreaView style={styles.safeArea}>
				<GestureHandlerRootView style={{ flex: 1 }}>
					<KeyboardAvoidingView
						style={{ flex: 1 }}
						behavior={Platform.OS === "ios" ? "padding" : undefined}
						keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
					>
						<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
							<ScrollView
								contentContainerStyle={styles.scrollView}
								keyboardShouldPersistTaps="handled"
							>
								{formatSelectedDate() && (
									<View style={styles.headerContainer}>
										<Text style={styles.headerTitle}>
											Create Practice
										</Text>
										<Text style={styles.selectedDateText}>
											{formatSelectedDate()}
										</Text>
									</View>
								)}

								<PracticeDateTimePicker
									initialDate={route.params?.selectedDate}
									onDatesChange={handleDatesChange}
								/>

								{/* Drills */}
								<View style={styles.section}>
									<Text style={styles.label}>
										Selected Drills
									</Text>
									<Button
										onPress={() => setModalVisible(true)}
										title="Add Drills"
									/>

									{/* Display Selected Drills */}
									{selectedDrills.length > 0 && (
										<View
											style={
												styles.selectedDrillsContainer
											}
										>
											{selectedDrills.map(
												(drill, index) => (
													<View
														key={index}
														style={
															styles.selectedDrillItem
														}
													>
														<Text
															style={
																styles.selectedDrillText
															}
														>
															{drill}
														</Text>
														<TouchableOpacity
															onPress={() =>
																removeDrill(
																	drill
																)
															}
															style={
																styles.removeDrillButton
															}
														>
															<Text
																style={
																	styles.removeDrillButtonText
																}
															>
																×
															</Text>
														</TouchableOpacity>
													</View>
												)
											)}
										</View>
									)}

									{selectedDrills.length === 0 && (
										<Text style={styles.noDrillsText}>
											No drills selected yet
										</Text>
									)}

									<Modal
										visible={modalVisible}
										animationType="slide"
										transparent={true}
										onRequestClose={() =>
											setModalVisible(false)
										}
									>
										<View style={styles.modalBackdrop}>
											<View style={styles.modalContent}>
												<Text style={styles.modalTitle}>
													Select Drills
												</Text>
												<ScrollView
													style={{ maxHeight: 300 }}
												>
													{availableDrills.map(
														(drill, index) => {
															const selected =
																selectedDrills.includes(
																	drill
																);
															return (
																<TouchableOpacity
																	key={index}
																	style={[
																		styles.drillItem,
																		selected &&
																			styles.drillItemSelected,
																	]}
																	onPress={() => {
																		if (
																			selected
																		) {
																			setSelectedDrills(
																				(
																					prev
																				) =>
																					prev.filter(
																						(
																							d
																						) =>
																							d !==
																							drill
																					)
																			);
																		} else {
																			setSelectedDrills(
																				(
																					prev
																				) => [
																					...prev,
																					drill,
																				]
																			);
																		}
																	}}
																>
																	<Text
																		style={[
																			styles.drillItemText,
																			selected &&
																				styles.drillItemTextSelected,
																		]}
																	>
																		{drill}
																	</Text>
																</TouchableOpacity>
															);
														}
													)}
												</ScrollView>
												<TouchableOpacity
													style={
														styles.closeModalButton
													}
													onPress={() =>
														setModalVisible(false)
													}
												>
													<Text
														style={
															styles.closeModalButtonText
														}
													>
														Done
													</Text>
												</TouchableOpacity>
											</View>
										</View>
									</Modal>
								</View>

								{/* Notes */}
								{/* <View style={styles.section}>
									<Text style={styles.label}>Notes</Text>
									<TextInput
										style={styles.notesInput}
										value={notes}
										onChangeText={setNotes}
										placeholder="Add notes about this practice..."
										multiline
										numberOfLines={4}
										textAlignVertical="top"
										returnKeyType="done"
									/>
								</View> */}

								{/* Submit Button */}
								<TouchableOpacity
									style={styles.submitButton}
									onPress={handleSubmit}
									activeOpacity={0.8}
								>
									<Text style={styles.submitButtonText}>
										Create Practice
									</Text>
								</TouchableOpacity>
							</ScrollView>
						</TouchableWithoutFeedback>
					</KeyboardAvoidingView>
				</GestureHandlerRootView>
			</SafeAreaView>
		</SafeAreaProvider>
	);
};

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: "#f2f5f8",
	},
	scrollView: {
		padding: 16,
		paddingBottom: 32,
		flexGrow: 1,
	},
	headerContainer: {
		backgroundColor: "white",
		borderRadius: 12,
		padding: 16,
		marginBottom: 20,
		shadowColor: "#000",
		shadowOpacity: 0.1,
		shadowOffset: { width: 0, height: 3 },
		shadowRadius: 6,
		elevation: 3,
		alignItems: "center",
	},
	headerTitle: {
		fontSize: 24,
		fontWeight: "700",
		color: "#333",
		marginBottom: 8,
	},
	selectedDateText: {
		fontSize: 18,
		fontWeight: "600",
		color: "#007AFF",
	},
	section: {
		backgroundColor: "white",
		borderRadius: 12,
		padding: 16,
		marginBottom: 20,
		shadowColor: "#000",
		shadowOpacity: 0.1,
		shadowOffset: { width: 0, height: 3 },
		shadowRadius: 6,
		elevation: 3,
	},
	label: {
		fontSize: 16,
		fontWeight: "600",
		color: "#333",
		marginBottom: 12,
	},
	selectedDrillsContainer: {
		marginTop: 16,
	},
	selectedDrillItem: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		backgroundColor: "#f0f8ff",
		borderColor: "#007AFF",
		borderWidth: 1,
		borderRadius: 8,
		paddingVertical: 10,
		paddingHorizontal: 12,
		marginBottom: 8,
	},
	selectedDrillText: {
		fontSize: 16,
		color: "#007AFF",
		fontWeight: "500",
		flex: 1,
	},
	removeDrillButton: {
		backgroundColor: "#ff4444",
		borderRadius: 12,
		width: 24,
		height: 24,
		justifyContent: "center",
		alignItems: "center",
		marginLeft: 8,
	},
	removeDrillButtonText: {
		color: "white",
		fontSize: 16,
		fontWeight: "bold",
		lineHeight: 16,
	},
	noDrillsText: {
		fontSize: 14,
		color: "#999",
		fontStyle: "italic",
		marginTop: 8,
		textAlign: "center",
	},
	draggableItem: {
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderRadius: 10,
		marginVertical: 6,
	},
	draggableText: {
		color: "white",
		fontWeight: "600",
		fontSize: 16,
	},
	notesInput: {
		borderWidth: 1,
		borderColor: "#ccc",
		borderRadius: 12,
		padding: 12,
		fontSize: 16,
		minHeight: 100,
		backgroundColor: "#fafafa",
	},
	dropdownContainer: {
		backgroundColor: "#fff",
		borderWidth: 1,
		borderColor: "#ddd",
		borderRadius: 12,
		paddingHorizontal: 12,
		paddingVertical: 4,
		marginTop: 8,
	},
	dropdownLabel: {
		color: "#007AFF",
		fontWeight: "600",
	},
	dropdownPlaceholder: {
		color: "#999",
	},
	submitButton: {
		backgroundColor: "#007AFF",
		paddingVertical: 16,
		borderRadius: 12,
		alignItems: "center",
		marginTop: 8,
		marginBottom: 20,
		shadowColor: "#007AFF",
		shadowOpacity: 0.4,
		shadowOffset: { width: 0, height: 5 },
		shadowRadius: 10,
		elevation: 5,
	},
	submitButtonText: {
		color: "white",
		fontWeight: "700",
		fontSize: 18,
	},
	modalContent: {
		backgroundColor: "white",
		padding: 20,
		borderRadius: 12,
		flex: 1, // Takes available space
		marginHorizontal: 10, // Small margins on sides
		marginVertical: 50, // Margins on top/bottom
	},
	modalTitle: {
		fontSize: 20,
		fontWeight: "700",
		marginBottom: 16,
		color: "#333",
		textAlign: "center",
	},
	drillItem: {
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderRadius: 8,
		backgroundColor: "#eee",
		marginBottom: 10,
	},
	drillItemSelected: {
		backgroundColor: "#007AFF",
	},
	drillItemText: {
		color: "#333",
		fontSize: 16,
		fontWeight: "500",
	},
	drillItemTextSelected: {
		color: "#fff",
	},
	closeModalButton: {
		marginTop: 16,
		backgroundColor: "#007AFF",
		paddingVertical: 12,
		borderRadius: 10,
		alignItems: "center",
	},
	closeModalButtonText: {
		color: "white",
		fontWeight: "600",
		fontSize: 16,
	},
	modalBackdrop: {
		flex: 1,
		backgroundColor: "rgba(0, 0, 0, 0.5)",
		padding: 20, // Add padding instead of using margins in modalContent
	},
});

export default CreatePractice;
