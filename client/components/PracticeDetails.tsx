import { useEffect, useState } from "react";
import {
	View,
	Text,
	TextInput,
	ActivityIndicator,
	StyleSheet,
	Button,
	Alert,
	TouchableOpacity,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { supabase } from "../../server/src/supabase";
import { MaterialIcons } from "@expo/vector-icons";
import DraggableFlatList from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Constants from "expo-constants";

export default function PracticeDetails({ route }) {
	const { practiceId } = route.params;
	const [practice, setPractice] = useState(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	const [startDate, setStartDate] = useState(new Date());
	const [endDate, setEndDate] = useState(new Date());
	const [notes, setNotes] = useState("");
	const [isEditingNotes, setIsEditingNotes] = useState(false);

	const [showStartPicker, setShowStartPicker] = useState(false);
	const [showEndPicker, setShowEndPicker] = useState(false);

	// Drills state for drag & drop
	const [drills, setDrills] = useState([]);

	useEffect(() => {
		fetchPracticeDetails();
	}, []);

	const toggleStartPicker = () => setShowStartPicker((prev) => !prev);
	const toggleEndPicker = () => setShowEndPicker((prev) => !prev);
	const fetchPracticeDetails = async () => {
		// const { data, error } = await supabase
		// 	.from("Practice")
		// 	.select("*")
		// 	.eq("id", practiceId)
		// 	.single();

		// if (error) {
		// 	console.error("Error fetching practice:", error);
		// 	Alert.alert("Error", "Could not load practice details.");
		// } else {
		// 	setPractice(data);
		// 	setStartDate(new Date(data.startTime));
		// 	setEndDate(new Date(data.endTime));
		// 	setNotes(data.notes || "");
		// 	setDrills(data.drills || []);
		// }
		// setLoading(false);
	};

	const onChangeStart = (event, selectedDate) => {
		setShowStartPicker(false);
		if (selectedDate) setStartDate(selectedDate);
	};

	const onChangeEnd = (event, selectedDate) => {
		setShowEndPicker(false);
		if (selectedDate) setEndDate(selectedDate);
	};

	const saveChanges = async () => {
		setSaving(true);
		try {
			const response = await fetch(`http://${Constants.expoConfig?.extra?.localIP}:8081/practice`)
			const data = await response.json();
			// console.log(data, 'data pract details')
		} catch (error) {
			console.log(error, 'err')
		}
		// const { error } = await supabase
		// 	.from("Practice")
		// 	.update({
		// 		startTime: startDate.toISOString(),
		// 		endTime: endDate.toISOString(),
		// 		notes,
		// 		drills, // save updated drills order here
		// 	})
		// 	.eq("id", practiceId);

		// setSaving(false);

		// if (error) {
		// 	console.error("Error updating practice:", error);
		// 	Alert.alert("Error", "Failed to update practice.");
		// } else {
		// 	Alert.alert("Success", "Practice updated!");
		// 	setIsEditingNotes(false);
		// }
	};

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

	const renderDrill = ({ item, drag, isActive }) => (
		<TouchableOpacity
			style={[
				styles.drillItem,
				{ backgroundColor: isActive ? "#005BBB" : "#F1F3F6" },
			]}
			onLongPress={drag}
			activeOpacity={0.8}
		>
			<Text style={styles.drillText}>{item}</Text>
			<MaterialIcons name="drag-handle" size={20} color="#666" />
		</TouchableOpacity>
	);

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<View style={styles.container}>
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
				{showStartPicker && (
					<DateTimePicker
						value={startDate}
						mode="datetime"
						display="default"
						onChange={onChangeStart}
					/>
				)}

				<Text style={styles.label}>End Time</Text>
				<TouchableOpacity
					onPress={toggleEndPicker}
					style={styles.dateTouchable}
					activeOpacity={0.7}
				>
					<Text style={styles.dateText}>
						{endDate.toLocaleString()}
					</Text>
					<MaterialIcons name="edit" size={18} color="#007AFF" />
				</TouchableOpacity>
				{showEndPicker && (
					<DateTimePicker
						value={endDate}
						mode="datetime"
						display="default"
						onChange={onChangeEnd}
					/>
				)}

				<View style={styles.notesHeader}>
					<Text style={styles.label}>Notes</Text>
					<TouchableOpacity
						onPress={() => setIsEditingNotes(!isEditingNotes)}
						activeOpacity={0.7}
					>
						<MaterialIcons
							name={isEditingNotes ? "close" : "edit"}
							size={24}
							color="#007AFF"
						/>
					</TouchableOpacity>
				</View>

				<TextInput
					style={[
						styles.notesInput,
						!isEditingNotes && styles.notesInputDisabled,
					]}
					multiline
					numberOfLines={4}
					value={notes}
					onChangeText={setNotes}
					editable={isEditingNotes}
					placeholder="Add notes about this practice..."
					placeholderTextColor="#aaa"
				/>

				<Text style={[styles.label, { marginTop: 24 }]}>
					Drills (drag to reorder)
				</Text>
				<DraggableFlatList
					data={drills}
					onDragEnd={({ data }) => setDrills(data)}
					keyExtractor={(item, index) => `${item}-${index}`}
					renderItem={renderDrill}
					containerStyle={styles.drillListContainer}
					scrollEnabled={false}
				/>

				{isEditingNotes && (
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
				)}
			</View>
		</GestureHandlerRootView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20,
		backgroundColor: "#fff",
	},
	containerCentered: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#fff",
	},
	emptyText: {
		fontSize: 18,
		color: "#666",
	},
	title: {
		fontSize: 26,
		fontWeight: "700",
		marginBottom: 24,
		color: "#222",
	},
	label: {
		fontWeight: "600",
		fontSize: 16,
		marginBottom: 8,
		color: "#444",
	},
	dateTouchable: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		borderBottomWidth: 1,
		borderColor: "#ccc",
		paddingVertical: 10,
		marginBottom: 16,
	},
	dateText: {
		fontSize: 16,
		color: "#007AFF",
	},
	notesHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	notesInput: {
		borderWidth: 1,
		borderColor: "#ccc",
		borderRadius: 10,
		padding: 12,
		fontSize: 16,
		backgroundColor: "#FAFAFA",
		textAlignVertical: "top",
		color: "#222",
	},
	notesInputDisabled: {
		backgroundColor: "#F5F5F5",
		color: "#999",
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
		backgroundColor: "#F1F3F6",
		borderRadius: 12,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
	},
	drillText: {
		fontSize: 16,
		color: "#333",
	},
	saveButton: {
		marginTop: 30,
		backgroundColor: "#007AFF",
		paddingVertical: 16,
		borderRadius: 12,
		alignItems: "center",
		shadowColor: "#007AFF",
		shadowOffset: { width: 0, height: 5 },
		shadowOpacity: 0.4,
		shadowRadius: 6,
		elevation: 5,
	},
	saveButtonDisabled: {
		backgroundColor: "#7AB8FF",
	},
	saveButtonText: {
		color: "#fff",
		fontWeight: "700",
		fontSize: 18,
	},
});
