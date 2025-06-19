import { SetStateAction, useState } from "react";
import {
	Button,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
	KeyboardAvoidingView,
	Platform,
	TouchableWithoutFeedback,
	Keyboard,
} from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import Dropdown from "react-native-input-select";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import DraggableFlatList from "react-native-draggable-flatlist";
import { volleyballDrillsList } from "../utils/volleyballDrillsData";
import { supabase } from "../supabase";
import { useNavigation } from "@react-navigation/native";

const CreatePractice = () => {
	const navigation = useNavigation();

	const allDrills = volleyballDrillsList.flatMap(({ subcategory, drills }) =>
		drills.map((drill) => ({
			label: `${subcategory}: ${drill.name}`,
			value: drill.name,
		}))
	);

	const [startDate, setStartDate] = useState(new Date());
	const [endDate, setEndDate] = useState(new Date());

	const [selectedDrills, setSelectedDrills] = useState<string[]>([]);
	const [notes, setNotes] = useState("");

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
				startTime: toLocalISOString(startDate), // local ISO without timezone
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
		console.log(
			startDate,
			endDate,
			selectedDrills,
			notes,
			"dates, drills, notes"
		);
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
								<Text style={styles.label}>Start</Text>
								<DateTimePicker
									testID="startDateTimePicker"
									value={startDate}
									mode="datetime"
									onChange={onChange("start")}
								/>

								<Text style={styles.label}>End</Text>
								<DateTimePicker
									testID="endDateTimePicker"
									value={endDate}
									mode="datetime"
									onChange={onChange("end")}
								/>

								<Text style={styles.label}>Drills</Text>
								<DraggableFlatList
									data={selectedDrills}
									keyExtractor={(item, index) => item}
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
											<Text style={{ color: "white" }}>
												{item}
											</Text>
										</TouchableOpacity>
									)}
									onDragEnd={({ data }) =>
										setSelectedDrills(data)
									}
								/>

								<Dropdown
									label="Menu"
									placeholder="Select an option..."
									options={allDrills}
									selectedValue={selectedDrills}
									onValueChange={(value) =>
										setSelectedDrills(value)
									}
									primaryColor={"green"}
									isMultiple
								/>

								<Text style={styles.label}>Notes</Text>
								<TextInput
									style={styles.notesInput}
									value={notes}
									onChangeText={setNotes}
									placeholder="Add notes about this practice..."
									multiline
									numberOfLines={4}
								/>

								<Button title="Submit" onPress={handleSubmit} />
							</ScrollView>
						</TouchableWithoutFeedback>
					</KeyboardAvoidingView>
				</GestureHandlerRootView>
			</SafeAreaView>
		</SafeAreaProvider>
	);
};

const styles = StyleSheet.create({
	draggableItem: {
		padding: 20,
		backgroundColor: "#007AFF",
		borderRadius: 8,
		marginVertical: 4,
	},
	safeArea: {
		flex: 1,
		backgroundColor: "#fff",
	},
	scrollView: {
		padding: 16,
		paddingBottom: 32,
		flexGrow: 1,
	},
	label: {
		fontSize: 16,
		fontWeight: "bold",
		marginVertical: 8,
	},
	notesInput: {
		borderWidth: 1,
		borderColor: "#ccc",
		borderRadius: 8,
		padding: 12,
		fontSize: 16,
		marginBottom: 16,
		textAlignVertical: "top",
		backgroundColor: "#fff",
	},
});

export default CreatePractice;
