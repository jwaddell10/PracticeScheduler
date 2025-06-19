import { SetStateAction, useState } from "react";
import {
	Button,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
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
	// Flatten the drills into one array
	// Flatten drills into an array of objects with label and value
	const allDrills = volleyballDrillsList.flatMap(({ subcategory, drills }) =>
		drills.map((drill) => ({
			label: `${subcategory}: ${drill.name}`,
			value: drill.name,
		}))
	);

	// If you want to display drills grouped by subcategory for debugging/logging:
	// const drillsToDisplay = volleyballDrillsList.map(
	// 	({ subcategory, drills }) => {
	// 		console.log(`Subcategory: ${subcategory}`);
	// 		drills.forEach((drill) => console.log(`- ${drill.name}`));
	// 		return null;
	// 	}
	// );

	// Date Picker State
	const [startDate, setStartDate] = useState(new Date());
	const [endDate, setEndDate] = useState(new Date());
	const [show, setShow] = useState(false);

	// Dropdown State
	const [open, setOpen] = useState(false);
	const [selectedDrills, setSelectedDrills] = useState([]);
	const [items, setItems] = useState(allDrills);
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
	async function insertData(startDate, endDate, drills) {
		const { data, error } = await supabase.from("Practice").insert([
			{
				startTime: startDate.toISOString(), // Store dates as ISO strings (standard format)
				endTime: endDate.toISOString(),
				teamId: "b2416750-a2c4-4142-a47b-d0fd11ca678a",
				drills: drills, // Make sure your drills column can store an array, or convert to JSON/text
			},
		]);

		if (error) {
			console.error("Error inserting data:", error);
		} else {
			console.log("Data inserted successfully:", data);
		}
	}
	const handleSubmit = async () => {
		console.log(startDate, endDate, selectedDrills, "dates and drills");
		await insertData(startDate, endDate, selectedDrills);
		navigation.goBack(); // 👈 This will close the screen
	};

	return (
		<SafeAreaProvider>
			<SafeAreaView style={styles.safeArea}>
				<GestureHandlerRootView style={styles.scrollView}>
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
								<Text style={{ color: "white" }}>{item}</Text>
							</TouchableOpacity>
						)}
						onDragEnd={({ data }) => setSelectedDrills(data)}
					/>
					<Dropdown
						label="Menu"
						placeholder="Select an option..."
						options={allDrills}
						selectedValue={selectedDrills}
						onValueChange={(value) => {
							setSelectedDrills(value);
						}}
						primaryColor={"green"}
						isMultiple
					/>
					<Button title="Submit" onPress={handleSubmit} />
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
	dropdown: {
		borderColor: "#ccc",
		borderRadius: 8,
	},
	dropdownContainer: {
		borderColor: "#ccc",
	},
	selectedText: {
		marginTop: 16,
		fontSize: 16,
	},
});

export default CreatePractice;
