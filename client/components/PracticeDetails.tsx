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
import { supabase } from "../supabase";
import { MaterialIcons } from "@expo/vector-icons";
import DraggableFlatList from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";

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

	// New state to store drills for drag & drop
	const [drills, setDrills] = useState([]);

	useEffect(() => {
		fetchPracticeDetails();
	}, []);

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
			setStartDate(new Date(data.startTime));
			setEndDate(new Date(data.endTime));
			setNotes(data.notes || "");
			setDrills(data.drills || []);
		}
		setLoading(false);
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
		const { error } = await supabase
			.from("Practice")
			.update({
				startTime: startDate.toISOString(),
				endTime: endDate.toISOString(),
				notes,
				drills, // save updated drills order here
			})
			.eq("id", practiceId);

		setSaving(false);

		if (error) {
			console.error("Error updating practice:", error);
			Alert.alert("Error", "Failed to update practice.");
		} else {
			Alert.alert("Success", "Practice updated!");
			setIsEditingNotes(false);
		}
	};

	if (loading) {
		return (
			<View style={styles.container}>
				<ActivityIndicator size="large" />
			</View>
		);
	}

	if (!practice) {
		return (
			<View style={styles.container}>
				<Text>Practice not found.</Text>
			</View>
		);
	}

	const renderDrill = ({ item, drag, isActive }) => (
		<TouchableOpacity
			style={[
				styles.drillItem,
				{ backgroundColor: isActive ? "#005BBB" : "#e0e0e0" },
			]}
			onLongPress={drag}
		>
			<Text>{item}</Text>
		</TouchableOpacity>
	);

	return (
		<GestureHandlerRootView>
			<View style={styles.container}>
				<Text style={styles.title}>Practice Details</Text>

				<Text style={styles.label}>Start Time</Text>
				<Text
					style={styles.dateText}
					onPress={() => setShowStartPicker(true)}
				>
					{startDate.toLocaleString()}
				</Text>
				{showStartPicker && (
					<DateTimePicker
						value={startDate}
						mode="datetime"
						display="default"
						onChange={onChangeStart}
					/>
				)}

				<Text style={styles.label}>End Time</Text>
				<Text
					style={styles.dateText}
					onPress={() => setShowEndPicker(true)}
				>
					{endDate.toLocaleString()}
				</Text>
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
				/>

				<Text style={[styles.label, { marginTop: 16 }]}>
					Drills (drag to reorder)
				</Text>
				<DraggableFlatList
					data={drills}
					onDragEnd={({ data }) => setDrills(data)}
					keyExtractor={(item, index) => `${item}-${index}`}
					renderItem={renderDrill}
					containerStyle={{ maxHeight: 250 }}
				/>

				{isEditingNotes && (
					<Button
						title={saving ? "Saving..." : "Save Changes"}
						onPress={saveChanges}
						disabled={saving}
					/>
				)}
			</View>
		</GestureHandlerRootView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 16,
		backgroundColor: "#fff",
	},
	title: {
		fontSize: 24,
		fontWeight: "bold",
		marginBottom: 16,
	},
	label: {
		fontWeight: "bold",
		marginTop: 12,
		marginBottom: 4,
		fontSize: 16,
	},
	dateText: {
		paddingVertical: 8,
		fontSize: 16,
		color: "#007AFF",
		borderBottomWidth: 1,
		borderColor: "#ccc",
	},
	notesHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	notesInput: {
		borderWidth: 1,
		borderColor: "#ccc",
		borderRadius: 8,
		padding: 8,
		textAlignVertical: "top",
		fontSize: 16,
	},
	notesInputDisabled: {
		backgroundColor: "#f0f0f0",
		color: "#888",
	},
	drillItem: {
		padding: 12,
		marginVertical: 4,
		borderRadius: 6,
	},
});
