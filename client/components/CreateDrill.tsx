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
	Image,
} from "react-native";
import Dropdown from "react-native-input-select";
import * as ImagePicker from "expo-image-picker";
import Constants from "expo-constants";
import { createClient } from "@supabase/supabase-js";
import { useSession } from "../context/SessionContext";
import { decode } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system";

const supabaseUrl = Constants.expoConfig?.extra?.SUPABASE_URL;
const supabaseAnonKey = Constants.expoConfig?.extra?.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

const drillDifficulties = [
	{ label: "Beginner", value: "beginner" },
	{ label: "Intermediate", value: "intermediate" },
	{ label: "Advanced", value: "advanced" },
];

export default function CreateDrill() {
	const session = useSession();
	const [name, setName] = useState("");
	const [type, setType] = useState(null);
	const [skillFocus, setSkillFocus] = useState(null);
	const [difficulty, setDifficulty] = useState(null);
	// const [duration, setDuration] = useState("");
	const [notes, setNotes] = useState("");
	const [saving, setSaving] = useState(false);
	const [imageUri, setImageUri] = useState(null);
	const pickImage = async () => {
		const { status } =
			await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (status !== "granted") {
			Alert.alert(
				"Permission denied",
				"Please allow media access to upload images."
			);
			return;
		}
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaType,
			aspect: [4, 3],
			quality: 1,
		});
		if (!result.canceled) {
			setImageUri(result.assets[0].uri);
		}
	};

	const uploadImageAsync = async (uri: string): Promise<string> => {
		try {
			if (!session?.user) {
				throw new Error("Unable to get authenticated user.");
			}

			const userId = session.user.id;
			const fileName = `${Date.now()}_${uri.substring(
				uri.lastIndexOf("/") + 1
			)}`;
			const filePath = `${userId}/${fileName}`;

			// Read file as base64 string (without "data:image/..." prefix)
			const base64 = await FileSystem.readAsStringAsync(uri, {
				encoding: FileSystem.EncodingType.Base64,
			});

			// Decode base64 string to ArrayBuffer
			const arrayBuffer = decode(base64);

			// Upload to Supabase Storage as ArrayBuffer
			const { data, error } = await supabase.storage
				.from("drill-images")
				.upload(filePath, arrayBuffer, {
					contentType: "image/jpeg", // adjust if you want dynamic contentType
				});
			if (error) {
				console.error("Upload error here:", error.message);
				throw error;
			}

			// Get public URL
			const { data: publicData } = supabase.storage
				.from("drill-images")
				.getPublicUrl(filePath);

			return publicData.publicUrl;
		} catch (err) {
			console.error("Upload failed:", err);
			throw err;
		}
	};

	const handleSubmit = async () => {
		if (!name || !type || !skillFocus || !difficulty) {
			Alert.alert("Validation error", "Please fill in required fields");
			return;
		}
		console.log(imageUri, "imageuri");
		// setSaving(true);
		// const accessToken = session?.access_token;
		// console.log(accessToken, "access token");

		try {
			let imageUrl = null;
			if (imageUri) {
				imageUrl = await uploadImageAsync(imageUri);
			}
		
			const localIP = Constants.expoConfig?.extra?.localIP;
			const PORT = Constants.expoConfig?.extra?.PORT;

			const res = await fetch(`http://${localIP}:${PORT}/drill/create`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${session?.access_token}`,
				},
				body: JSON.stringify({
					name,
					type,
					skillFocus,
					difficulty,
					// duration: Number(duration),
					notes,
					imageUrl,
				}),
			});
			if (!res.ok) {
				throw new Error(`Failed to create drill: ${res.status}`);
			}

			Alert.alert("Success", "Drill created successfully!");
			setName("");
			setType(null);
			setSkillFocus(null);
			setDifficulty(null);
			// setDuration("");
			setNotes("");
			setImageUri(null);
		} catch (error) {
			Alert.alert("Error", error.message);
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

						<Text style={styles.label}>Skill Focus *</Text>
						<Dropdown
							label="Select Skill Focus"
							placeholder="Choose skill focus"
							options={drillCategories}
							selectedValue={skillFocus}
							onValueChange={setSkillFocus}
							primaryColor="#007AFF"
							containerStyle={styles.dropdown}
						/>

						<Text style={styles.label}>Difficulty *</Text>
						<Dropdown
							label="Select Difficulty"
							placeholder="Choose difficulty"
							options={drillDifficulties}
							selectedValue={difficulty}
							onValueChange={setDifficulty}
							primaryColor="#007AFF"
							containerStyle={styles.dropdown}
						/>

						{/* <Text style={styles.label}>Duration (minutes)</Text>
						<TextInput
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

						<Text style={styles.label}>
							Upload Image (optional)
						</Text>
						<TouchableOpacity
							style={styles.imageUploadButton}
							onPress={pickImage}
						>
							<Text style={styles.imageUploadButtonText}>
								{imageUri ? "Change Image" : "Pick an Image"}
							</Text>
						</TouchableOpacity>

						{imageUri && (
							<Image
								source={{ uri: imageUri }}
								style={styles.previewImage}
								resizeMode="cover"
							/>
						)}

						<View style={styles.buttonContainer}>
							<TouchableOpacity
								style={styles.button}
								onPress={handleSubmit}
								disabled={saving}
							>
								<Text style={styles.buttonText}>
									{saving ? "Saving..." : "Create Drill"}
								</Text>
							</TouchableOpacity>
						</View>
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
	imageUploadButton: {
		backgroundColor: "#E5F0FF",
		paddingVertical: 14,
		paddingHorizontal: 20,
		borderRadius: 10,
		marginTop: 10,
		alignItems: "center",
	},
	imageUploadButtonText: {
		color: "#007AFF",
		fontSize: 16,
		fontWeight: "600",
	},
	previewImage: {
		width: "100%",
		height: 200,
		marginTop: 16,
		borderRadius: 12,
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
