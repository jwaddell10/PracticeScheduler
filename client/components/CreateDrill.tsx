import React, { useState } from "react";
import {
	View,
	Text,
	TextInput,
	StyleSheet,
	Button,
	Alert,
	Platform,
	KeyboardAvoidingView,
	ScrollView,
	TouchableWithoutFeedback,
	Keyboard,
} from "react-native";
import Dropdown from "react-native-input-select";
import { supabase } from "../supabase";

const drillTypes = [
	{ label: "Individual", value: "individual" },
	{ label: "Team Drill", value: "team drill" },
];

const drillCategories = [
	{ label: "Offense", value: "offense" },
	{ label: "Defense", value: "defense" },
	{ label: "Serve", value: "serve" },
	{ label: "Serve Receive", value: "serve receive" },
	{ label: "Blocking", value: "blocking" },
];

export default function CreateDrill() {
	const [name, setName] = useState("");
	const [type, setType] = useState(null);
	const [category, setCategory] = useState(null);
	const [duration, setDuration] = useState(""); // new duration state (string to control input)
	const [notes, setNotes] = useState("");
	const [saving, setSaving] = useState(false);

	const handleSubmit = async () => {
		// Validate duration as positive number if entered
		const durationNum = Number(duration);
		if (!name || !type || !category) {
			Alert.alert("Validation", "Please fill in all required fields.");
			return;
		}
		if (duration && (isNaN(durationNum) || durationNum <= 0)) {
			Alert.alert("Validation", "Duration must be a positive number.");
			return;
		}

		setSaving(true);

		const { data, error } = await supabase.from("Drill").insert([
			{
				name,
				type,
				category,
				duration: duration ? durationNum : null,
				notes: notes || null,
			},
		]);

		setSaving(false);

		if (error) {
			console.error("Error inserting drill:", error);
			Alert.alert("Error", "Failed to create drill.");
		} else {
			Alert.alert("Success", "Drill created!");
			setName("");
			setType(null);
			setCategory(null);
			setDuration("");
			setNotes("");
		}
	};

	return (
		<KeyboardAvoidingView
			style={{ flex: 1, backgroundColor: "#fff" }}
			behavior={Platform.OS === "ios" ? "padding" : undefined}
			keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0} // Adjust if you have a header
		>
			<ScrollView
				contentContainerStyle={styles.container}
				keyboardShouldPersistTaps="handled"
			>
				<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
					<View>
						<Text style={styles.label}>Drill Name *</Text>
						<TextInput
							style={styles.input}
							placeholder="Enter drill name"
							value={name}
							onChangeText={setName}
						/>

						<Text style={styles.label}>Type *</Text>
						<Dropdown
							label="Select Type"
							placeholder="Choose type"
							options={drillTypes}
							selectedValue={type}
							onValueChange={setType}
							primaryColor="#007AFF"
							containerStyle={styles.dropdown}
						/>

						<Text style={styles.label}>Category *</Text>
						<Dropdown
							label="Select Category"
							placeholder="Choose category"
							options={drillCategories}
							selectedValue={category}
							onValueChange={setCategory}
							primaryColor="#007AFF"
							containerStyle={styles.dropdown}
						/>

						<Text style={styles.label}>Duration (minutes)</Text>
						<TextInput
							style={styles.input}
							placeholder="Enter duration in minutes"
							value={duration}
							onChangeText={setDuration}
							keyboardType="numeric"
						/>

						<Text style={styles.label}>Notes</Text>
						<TextInput
							style={[styles.input, styles.notesInput]}
							placeholder="Optional notes about the drill"
							value={notes}
							onChangeText={setNotes}
							multiline
							numberOfLines={4}
						/>

						<Button
							title={saving ? "Saving..." : "Create Drill"}
							onPress={handleSubmit}
							disabled={saving}
						/>
					</View>
				</TouchableWithoutFeedback>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		padding: 16,
	},
	label: {
		fontWeight: "bold",
		marginTop: 16,
		marginBottom: 8,
		fontSize: 16,
	},
	input: {
		borderWidth: 1,
		borderColor: "#ccc",
		borderRadius: 8,
		padding: Platform.OS === "ios" ? 12 : 8,
		fontSize: 16,
	},
	notesInput: {
		height: 100,
		textAlignVertical: "top",
	},
	dropdown: {
		borderWidth: 1,
		borderColor: "#ccc",
		borderRadius: 8,
	},
});
