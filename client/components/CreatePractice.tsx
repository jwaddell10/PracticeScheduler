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
	Pressable,
	Image, // Added Image import
} from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import Dropdown from "react-native-input-select";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import DraggableFlatList from "react-native-draggable-flatlist";
import { useNavigation, useRoute } from "@react-navigation/native";
import Constants from "expo-constants";
import { supabase } from "../lib/supabase";
import PracticeDateTimePicker from "./PracticeDateTimePicker";
import { useDrills } from "../hooks/useDrills";
import AntDesign from "@expo/vector-icons/AntDesign";
import { Link } from "expo-router";

interface DrillData {
	name: string;
	imageUrl?: string;
	skillFocus?: any;
	type?: any;
	difficulty?: any;
	duration?: number;
	notes?: string;
}

const CreatePractice = () => {
	const navigation = useNavigation();
	const route = useRoute();
	const [availableDrills, setAvailableDrills] = useState<string[]>([]);
	const [drillSelectionModalVisible, setDrillSelectionModalVisible] =
		useState(false);
	const [questionModalVisible, setQuestionModalVisible] = useState(false);
	const [selectedDrillForDetails, setSelectedDrillForDetails] =
		useState<DrillData | null>(null);

	const [drills, setDrills] = useState<DrillData[]>([]);
	const [startDate, setStartDate] = useState<Date | null>(null);
	const [endDate, setEndDate] = useState<Date | null>(null);
	const [selectedDrills, setSelectedDrills] = useState<string[]>([]);
	const [notes, setNotes] = useState(""); // Added notes state

	const {
		drills: drillsData,
		loading: drillsLoading,
		error: drillsError,
	} = useDrills();

	// Update local state when hook data changes
	useEffect(() => {
		if (drillsData && drillsData.length > 0) {
			setAvailableDrills(drillsData.map((d: any) => d.name));
			setDrills(drillsData);
		}
	}, [drillsData]);

	// Handle loading and error states if needed
	if (drillsLoading) {
		return <Text>Loading drills...</Text>;
	}

	if (drillsError) {
		return <Text>Error loading drills: {drillsError}</Text>;
	}

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

	// Handle question modal close - reopen drill selection modal
	const handleQuestionModalClose = () => {
		setQuestionModalVisible(false);
		setSelectedDrillForDetails(null);
		setDrillSelectionModalVisible(true);
	};

	// Handle drill question icon click
	const handleDrillQuestionClick = (drillName: string) => {
		const drillObject = drills.find((d: DrillData) => d.name === drillName);
		setSelectedDrillForDetails(drillObject || null);
		setDrillSelectionModalVisible(false);
		setQuestionModalVisible(true);
	};

	// Helper function to capitalize first letter
	const capitalize = (str: string) => {
		return str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
	};

	// Helper function to parse and format array data
	const formatArrayData = (data: any) => {
		if (!data) return "Not specified";

		try {
			// If it's a JSON string, parse it
			const parsed = JSON.parse(data);
			if (Array.isArray(parsed)) {
				return parsed
					.map((item: string) => capitalize(item))
					.join(", ");
			}
			return capitalize(data);
		} catch (error) {
			// If parsing fails, treat as regular string
			return capitalize(data);
		}
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
										onPress={() =>
											setDrillSelectionModalVisible(true)
										}
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

									{/* Drill Selection Modal */}
									<Modal
										visible={drillSelectionModalVisible}
										animationType="slide"
										transparent={true}
										onRequestClose={() =>
											setDrillSelectionModalVisible(false)
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
																	<TouchableOpacity
																		onPress={() =>
																			handleDrillQuestionClick(
																				drill
																			)
																		}
																	>
																		<AntDesign
																			name="questioncircleo"
																			size={
																				24
																			}
																			color="black"
																		/>
																	</TouchableOpacity>
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
														setDrillSelectionModalVisible(
															false
														)
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

									{/* Question Modal - Drill Details */}
									<Modal
										visible={questionModalVisible}
										animationType="slide"
										transparent={true}
										onRequestClose={
											handleQuestionModalClose
										}
									>
										<View style={styles.modalBackdrop}>
											<View
												style={[
													styles.modalContent,
													{
														maxWidth: "90%",
														maxHeight: "80%",
													},
												]}
											>
												{selectedDrillForDetails && (
													<ScrollView
														style={{ flex: 1 }}
													>
														{/* Drill Name */}
														<Text
															style={[
																styles.modalTitle,
																{
																	marginBottom: 20,
																},
															]}
														>
															{
																selectedDrillForDetails.name
															}
														</Text>

														{/* Drill Image */}
														{selectedDrillForDetails.imageUrl && (
															<View
																style={{
																	marginBottom: 20,
																	alignItems:
																		"center",
																}}
															>
																<Image
																	source={{
																		uri: selectedDrillForDetails.imageUrl,
																	}}
																	style={{
																		width: 250,
																		height: 200,
																		borderRadius: 8,
																		resizeMode:
																			"cover",
																	}}
																/>
															</View>
														)}

														{/* Drill Details */}
														<View
															style={{
																marginBottom: 20,
															}}
														>
															<View
																style={{
																	flexDirection:
																		"row",
																	marginBottom: 8,
																}}
															>
																<Text
																	style={{
																		fontWeight:
																			"bold",
																		flex: 1,
																	}}
																>
																	Skill Focus:
																</Text>
																<Text
																	style={{
																		flex: 2,
																	}}
																>
																	{formatArrayData(
																		selectedDrillForDetails.skillFocus
																	)}
																</Text>
															</View>

															<View
																style={{
																	flexDirection:
																		"row",
																	marginBottom: 8,
																}}
															>
																<Text
																	style={{
																		fontWeight:
																			"bold",
																		flex: 1,
																	}}
																>
																	Type:
																</Text>
																<Text
																	style={{
																		flex: 2,
																	}}
																>
																	{formatArrayData(
																		selectedDrillForDetails.type
																	)}
																</Text>
															</View>

															<View
																style={{
																	flexDirection:
																		"row",
																	marginBottom: 8,
																}}
															>
																<Text
																	style={{
																		fontWeight:
																			"bold",
																		flex: 1,
																	}}
																>
																	Difficulty:
																</Text>
																<Text
																	style={{
																		flex: 2,
																	}}
																>
																	{formatArrayData(
																		selectedDrillForDetails.difficulty
																	)}
																</Text>
															</View>

															{selectedDrillForDetails.duration && (
																<View
																	style={{
																		flexDirection:
																			"row",
																		marginBottom: 8,
																	}}
																>
																	<Text
																		style={{
																			fontWeight:
																				"bold",
																			flex: 1,
																		}}
																	>
																		Duration:
																	</Text>
																	<Text
																		style={{
																			flex: 2,
																		}}
																	>
																		{
																			selectedDrillForDetails.duration
																		}{" "}
																		min
																	</Text>
																</View>
															)}
														</View>

														{/* Description/Notes */}
														{selectedDrillForDetails.notes &&
														selectedDrillForDetails.notes.trim() !==
															"" ? (
															<>
																<Text
																	style={{
																		fontWeight:
																			"bold",
																		fontSize: 16,
																		marginBottom: 8,
																	}}
																>
																	Description
																</Text>
																<Text
																	style={{
																		lineHeight: 20,
																		color: "#666",
																	}}
																>
																	{
																		selectedDrillForDetails.notes
																	}
																</Text>
															</>
														) : (
															<Text
																style={{
																	fontStyle:
																		"italic",
																	color: "#999",
																}}
															>
																No description
																available for
																this drill.
															</Text>
														)}
													</ScrollView>
												)}

												<TouchableOpacity
													style={
														styles.closeModalButton
													}
													onPress={
														handleQuestionModalClose
													}
												>
													<Text
														style={
															styles.closeModalButtonText
														}
													>
														Back to Drill Selection
													</Text>
												</TouchableOpacity>
											</View>
										</View>
									</Modal>
								</View>

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
		flexDirection: "row",
		justifyContent: "space-between",
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
