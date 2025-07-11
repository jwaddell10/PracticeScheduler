import React, { useState } from "react";
import {
	View,
	Text,
	TextInput,
	StyleSheet,
	Alert,
	Platform,
	KeyboardAvoidingView,
	ScrollView,
	TouchableWithoutFeedback,
	Keyboard,
	TouchableOpacity,
} from "react-native";
import Dropdown from "react-native-input-select";
import Constants from "expo-constants";
import * as ImagePicker from "expo-image-picker";
import { Image } from "react-native";

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
	const localIP = Constants.expoConfig?.extra?.localIP;
	const PORT = Constants.expoConfig?.extra?.PORT;
	const [name, setName] = useState("");
	const [type, setType] = useState(null);
	const [category, setCategory] = useState(null);
	const [notes, setNotes] = useState("");
	const [saving, setSaving] = useState(false);
	const [image, setImage] = useState(null);

	const pickImage = async () => {
		const { status } =
			await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (status !== "granted") {
			Alert.alert(
				"Permission denied",
				"Camera roll permissions are required."
			);
			return;
		}

		let result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaType.Images,
			allowsEditing: false,
			quality: 0.6,
			base64: true,
		});

		if (!result.canceled) {
			setImage(result.assets[0]);
		}
	};

	const createDrill = async () => {
		if (!name || !type || !category) {
			Alert.alert(
				"Missing Fields",
				"Please fill in all required fields."
			);
			return;
		}

		setSaving(true);

		try {
			const response = await fetch(
				`http://${localIP}:${PORT}/drill/create`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						name,
						type,
						category,
						notes,
						image: image?.base64 || null, // optionally include base64
					}),
				}
			);

			if (!response.ok) {
				throw new Error(
					`"Failed to create drill.", ${response.status}`
				);
			}

			const data = await response.json();
			Alert.alert("Success", "Drill created successfully!");

			// Clear form
			setName("");
			setType(null);
			setCategory(null);
			setNotes("");
		} catch (error) {
			console.error(error);
			Alert.alert("Error", "There was an issue creating the drill.");
		} finally {
			setSaving(false);
		}
	};

	return (
		<KeyboardAvoidingView
			style={{ flex: 1, backgroundColor: "#fff" }}
			behavior={Platform.OS === "ios" ? "padding" : undefined}
			keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
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
						{/* <TextInput
							style={styles.input}
							placeholder="Enter duration in minutes"
							value={duration}
							onChangeText={setDuration}
							keyboardType="numeric"
						/> */}

						<Text style={styles.label}>Notes</Text>
						<TextInput
							style={[styles.input, styles.notesInput]}
							placeholder="Optional notes about the drill"
							value={notes}
							onChangeText={setNotes}
							multiline
							numberOfLines={4}
						/>

						<View style={styles.buttonContainer}>
							<TouchableOpacity
								style={styles.button}
								onPress={createDrill}
								disabled={saving}
							>
								<Text style={styles.buttonText}>
									{saving ? "Saving..." : "Create Drill"}
								</Text>
							</TouchableOpacity>
						</View>
						<Text style={styles.label}>
							Drill Screenshot (optional)
						</Text>
						<TouchableOpacity
							onPress={pickImage}
							style={styles.imagePicker}
						>
							<Text
								style={{ color: "#007AFF", fontWeight: "600" }}
							>
								{image ? "Change Image" : "Select Image"}
							</Text>
						</TouchableOpacity>

						{image && (
							<Image
								source={{ uri: image.uri }}
								style={{
									width: "100%",
									height: 200,
									marginTop: 12,
									borderRadius: 12,
								}}
								resizeMode="cover"
							/>
						)}
					</View>
				</TouchableWithoutFeedback>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		padding: 24,
		backgroundColor: "#fff",
		flexGrow: 1,
	},

	label: {
		fontWeight: "700",
		fontSize: 17,
		marginTop: 24,
		marginBottom: 8,
		color: "#222",
	},

	input: {
		borderWidth: 1,
		borderColor: "#ccc",
		borderRadius: 12,
		paddingVertical: Platform.OS === "ios" ? 16 : 12,
		paddingHorizontal: 18,
		fontSize: 17,
		backgroundColor: "#fafafa",
		shadowColor: "#000",
		shadowOpacity: 0.05,
		shadowRadius: 4,
		shadowOffset: { width: 0, height: 3 },
	},

	notesInput: {
		height: 120,
		textAlignVertical: "top",
		backgroundColor: "#fafafa",
	},

	dropdown: {
		borderWidth: 1,
		borderColor: "#ccc",
		borderRadius: 12,
		backgroundColor: "#fafafa",
		paddingHorizontal: 16,
		paddingVertical: 10,
		marginBottom: 12,
		shadowColor: "#000",
		shadowOpacity: 0.05,
		shadowRadius: 4,
		shadowOffset: { width: 0, height: 3 },
	},

	buttonContainer: {
		marginTop: 36,
		backgroundColor: "#007AFF",
		borderRadius: 12,
		overflow: "hidden",
	},

	button: {
		paddingVertical: 16,
		alignItems: "center",
	},

	buttonText: {
		color: "white",
		fontSize: 18,
		fontWeight: "700",
	},
});
