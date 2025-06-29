import { SetStateAction, useEffect, useState } from "react";
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
} from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import Dropdown from "react-native-input-select";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import DraggableFlatList from "react-native-draggable-flatlist";
// import { supabase } from "../../server/supabase";
import { useNavigation } from "@react-navigation/native";
import Constants from "expo-constants"

const CreatePractice = () => {
	const navigation = useNavigation();

	const [drills, setDrills] = useState([]);
	const [loadingDrills, setLoadingDrills] = useState(true);

	const [startDate, setStartDate] = useState(new Date());
	const [endDate, setEndDate] = useState(new Date());

	const [selectedDrills, setSelectedDrills] = useState<string[]>([]);
	const [notes, setNotes] = useState("");

	useEffect(() => {
		fetchDrills();
	}, []);

	const fetchDrills = async () => {
		try {
			const response = await fetch(`http://${Constants.expoConfig?.extra?.localIP}:8081/practice`)
			const data = await response.json();
			console.log(data, 'data from fetch')
		} catch (error) {
			console.log(error, 'error practice')
		}
		// const { data, error } = await supabase.from("Drill").select("*");
		// if (error) {
		// 	console.error("Error fetching drills:", error);
		// } else {
		// 	const formattedDrills = data.map((drill) => ({
		// 		label: `${drill.type}, ${drill.category}: ${drill.name}`,
		// 		value: drill.name,
		// 	}));
		// 	setDrills(formattedDrills);
		// }
		// setLoadingDrills(false);
	};

	const onChange =
		(type: string) => (event: any, selectedDate: SetStateAction<Date>) => {
			if (selectedDate) {
				if (type === "start") {
					setStartDate(selectedDate);
				} else {
					setEndDate(selectedDate);
				}
			}
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
		await insertData(startDate, endDate, selectedDrills, notes);
		navigation.goBack();
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
								{/* Start Date */}
								<View style={styles.section}>
									<Text style={styles.label}>Start Time</Text>
										<DateTimePicker
											testID="startDateTimePicker"
											value={startDate}
											mode="datetime"
											onChange={onChange("start")}
											style={styles.datePicker}
										/>
								</View>

								{/* End Date */}
								<View style={styles.section}>
									<Text style={styles.label}>End Time</Text>
										<DateTimePicker
											testID="endDateTimePicker"
											value={endDate}
											mode="datetime"
											onChange={onChange("end")}
											style={styles.datePicker}
										/>
								</View>

								{/* Drills */}
								<View style={styles.section}>
									<Text style={styles.label}>Selected Drills</Text>
									{loadingDrills ? (
										<ActivityIndicator
											size="large"
											color="#007AFF"
											style={{ marginVertical: 12 }}
										/>
									) : (
										<>
											<DraggableFlatList
												data={selectedDrills}
												keyExtractor={(item) => item}
												renderItem={({ item, drag, isActive }) => (
													<TouchableOpacity
														style={[
															styles.draggableItem,
															{
																backgroundColor: isActive
																	? "#005BBB"
																	: "#007AFF",
															},
														]}
														onLongPress={drag}
													>
														<Text style={styles.draggableText}>
															{item}
														</Text>
													</TouchableOpacity>
												)}
												onDragEnd={({ data }) =>
													setSelectedDrills(data)
												}
												scrollEnabled={false}
												style={{ marginBottom: 16 }}
											/>

											<Dropdown
												label="Add Drills"
												placeholder="Select drills..."
												options={drills}
												selectedValue={selectedDrills}
												onValueChange={(value) =>
													setSelectedDrills(value)
												}
												primaryColor={"#007AFF"}
												isMultiple
												containerStyle={styles.dropdownContainer}
												labelStyle={styles.dropdownLabel}
												placeholderStyle={styles.dropdownPlaceholder}
											/>
										</>
									)}
								</View>

								{/* Notes */}
								<View style={styles.section}>
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
								</View>

								{/* Submit Button */}
								<TouchableOpacity
									style={styles.submitButton}
									onPress={handleSubmit}
									activeOpacity={0.8}
								>
									<Text style={styles.submitButtonText}>Create Practice</Text>
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
	datePickerContainer: {
		borderWidth: 1,
		borderColor: "#ddd",
		borderRadius: 8,
		overflow: "hidden",
	},
	datePicker: {
		width: "100%",
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
});

export default CreatePractice;
