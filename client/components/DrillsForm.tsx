import { useState } from "react";
import { Button, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import DropDownPicker from "react-native-dropdown-picker";

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
	const [selectedDrill, setSelectedDrill] = useState(null);
	const [items, setItems] = useState(allDrills);

	const onChange = (event: any, selectedDate: any) => {
		const currentDate = selectedDate;
		setShow(false);
		setDate(currentDate);
	};

	const handleSubmit = () => {
		console.log(date, 'date', selectedDrill, 'selected drill')
	}

	return (
		<SafeAreaProvider>
			<SafeAreaView style={styles.safeArea}>
				<View style={styles.scrollView}>
					<Text style={styles.label}>Select Date & Time</Text>
					<DateTimePicker
						testID="dateTimePicker"
						value={date}
						mode="datetime"
						onChange={onChange}
					/>
					<Text style={styles.label}>Select Drill</Text>
					<DropDownPicker
						open={open}
						value={selectedDrill}
						items={items}
						setOpen={setOpen}
						setValue={setSelectedDrill}
						setItems={setItems}
						placeholder="Search or select a drill"
						searchable={true}
						style={styles.dropdown}
						dropDownContainerStyle={styles.dropdownContainer}
						multiple={true}
					/>

					{selectedDrill && (
						<View>
							<Text style={styles.selectedText}>
								Selected Drill:
							</Text>
							{selectedDrill.map((drill, index) => (
								<Text key={index}>{drill}</Text>
							))}
						</View>
					)}
					<Button title="Submit" onPress={handleSubmit} />
				</View>
			</SafeAreaView>
		</SafeAreaProvider>
	);
};

const styles = StyleSheet.create({
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
