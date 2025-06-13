import { useState } from "react";
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

const DrillsForm = () => {
	const drills = {
		Serving: [
			"Target Serve Challenge",
			"Wall Serve Accuracy",
			"Consistent Float Serve Reps",
		],
		Passing: ["Wall Bumps", "Target Passing", "Move & Pass"],
		Setting: ["Wall Sets", "Self-Set Max Reps", "High-Set Control"],
		Defense: ["Dig or Die", "Cone Reaction Drill", "Scramble Save"],
		Hitting: [
			"Approach & Arm Swing",
			"Block + Hit Combo",
			"Cross-Court Kill",
		],
		Blocking: ["Shadow Blocking", "Read & Block", "Mirror Blocking"],
		TeamPlay: [
			"6v6 Game to 7 with Serve Receive Focus",
			"Wash Drill",
			"Free Ball Transition",
		],
	};

	// Flatten the drills into one array
	const allDrills = Object.entries(drills).flatMap(([category, drillList]) =>
		drillList.map((drill) => ({
			label: `${category}: ${drill}`,
			value: drill,
		}))
	);

	// Date Picker State
	const [date, setDate] = useState(new Date());
	const [show, setShow] = useState(false);

	// Dropdown State
	const [open, setOpen] = useState(false);
	const [selectedDrills, setSelectedDrills] = useState([]);
	const [items, setItems] = useState(allDrills);

	const onChange = (event: any, selectedDate: any) => {
		const currentDate = selectedDate;
		setShow(false);
		setDate(currentDate);
	};

	// const handleSubmit = () => {
	// 	console.log(date, "date", selectedDrill, "selected drill");
	// };

	return (
		<SafeAreaProvider>
			<SafeAreaView style={styles.safeArea}>
				<GestureHandlerRootView style={styles.scrollView}>
					<Text style={styles.label}>Select Date & Time</Text>
					<DateTimePicker
						testID="dateTimePicker"
						value={date}
						mode="datetime"
						onChange={onChange}
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
					<Button title="Submit" />
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

export default DrillsForm;
