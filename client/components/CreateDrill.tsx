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
	const [type, setType] = useState([]);
	const [skillFocus, setSkillFocus] = useState([]);
	const [difficulty, setDifficulty] = useState([]);
	const [notes, setNotes] = useState("");
	const [saving, setSaving] = useState(false);
	const [imageUri, setImageUri] = useState(null);

	// Button selection component
	const SelectionButtons = ({
		title,
		options,
		selectedValues,
		onSelect,
		required = false,
	}) => (
		<View style={styles.selectionContainer}>
			<Text style={styles.label}>
				{title} {"(select all that apply)"}
			</Text>
			<View style={styles.buttonRow}>
				{options.map((option) => {
					const isSelected = selectedValues.includes(option.value);
					return (
						<TouchableOpacity
							key={option.value}
							style={[
								styles.selectionButton,
								isSelected && styles.selectedButton,
							]}
							onPress={() => {
								if (isSelected) {
									// Remove from selection
									onSelect(
										selectedValues.filter(
											(val) => val !== option.value
										)
									);
								} else {
									// Add to selection
									onSelect([...selectedValues, option.value]);
								}
							}}
						>
							<Text
								style={[
									styles.selectionButtonText,
									isSelected && styles.selectedButtonText,
								]}
							>
								{option.label}
							</Text>
						</TouchableOpacity>
					);
				})}
			</View>
		</View>
	);

	const pickImage = async () => {
		try {
			// Ask for permission
			const { status } =
				await ImagePicker.requestMediaLibraryPermissionsAsync();
			if (status !== "granted") {
				Alert.alert(
					"Permission denied",
					"Please allow media access to upload images."
				);
				return;
			}

			// Open image picker
			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: "images",
				allowsEditing: false,
				// aspect: [4, 3],
				quality: 1,
			});

			// If user didn't cancel, and assets exist
			if (!result.canceled && result.assets?.length > 0) {
				const uri = result.assets[0].uri;

				// Make sure the file exists before setting state
				const fileInfo = await FileSystem.getInfoAsync(uri);
				if (!fileInfo.exists) {
					Alert.alert("Error", "Selected file does not exist.");
					return;
				}

				setImageUri(uri);
			}
		} catch (error) {
			console.error("Image picker error:", error);
			Alert.alert("Error", "Unable to pick image. Please try again.");
		}
	};

	const uploadImageAsync = async (uri) => {
		try {
			if (!session?.user) {
				throw new Error("Unable to get authenticated user.");
			}

			// Verify file exists before upload
			const fileInfo = await FileSystem.getInfoAsync(uri);
			if (!fileInfo.exists) {
				throw new Error("Image file not found.");
			}

			const userId = session.user.id;
			const fileName = `${Date.now()}_${uri.substring(
				uri.lastIndexOf("/") + 1
			)}`;
			const filePath = `${userId}/${fileName}`;

			// Read file as base64
			const base64 = await FileSystem.readAsStringAsync(uri, {
				encoding: FileSystem.EncodingType.Base64,
			});

			// Convert to ArrayBuffer
			const arrayBuffer = decode(base64);

			// Upload to Supabase
			const { error } = await supabase.storage
				.from("drill-images")
				.upload(filePath, arrayBuffer, {
					contentType: "image/jpeg",
				});

			if (error) {
				console.error("Upload error:", error.message);
				throw new Error("Failed to upload image.");
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
		if (!session?.user) {
			Alert.alert("Error", "You must be logged in to create a drill.");
			return;
		}

		if (
			!name ||
			type.length === 0 ||
			skillFocus.length === 0 ||
			difficulty.length === 0
		) {
			Alert.alert(
				"Validation error",
				"Please fill in all required fields."
			);
			return;
		}

		setSaving(true);

		try {
			console.log("Supabase URL:", supabaseUrl);
			console.log(
				"Supabase Key:",
				supabaseAnonKey ? "Loaded" : "Missing"
			);
			console.log("User:", session?.user);

			let imageUrl = null;

			if (imageUri) {
				// Handle HEIC files from iOS
				let fixedUri = imageUri;
				let fileExt = imageUri.split(".").pop()?.toLowerCase();

				if (fileExt === "heic") {
					const jpegUri = imageUri.replace(/\.heic$/i, ".jpg");
					await FileSystem.copyAsync({ from: imageUri, to: jpegUri });
					fixedUri = jpegUri;
					fileExt = "jpg";
				}

				// Upload and get public URL
				imageUrl = await uploadImageAsync(fixedUri);
			}

			// Insert into Supabase
			const { error: insertError } = await supabase
				.from("Drill")
				.insert([
					{
						user_id: session.user.id,
						name,
						type,
						skillFocus: skillFocus,
						difficulty,
						notes,
						imageUrl: imageUrl,
					},
				]);

			if (insertError) throw insertError;

			Alert.alert("Success", "Drill created successfully!");

			// Reset form
			setName("");
			setType([]);
			setSkillFocus([]);
			setDifficulty([]);
			setNotes("");
			setImageUri(null);
		} catch (error) {
			console.error("Submit error:", error);
			Alert.alert("Error", error.message || "Something went wrong.");
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
				nestedScrollEnabled={true} // ✅ prevents VirtualizedList nesting issues
			>
				<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
					<View>
						<Text style={styles.label}>Drill Name</Text>
						<TextInput
							style={styles.input}
							placeholder="Enter drill name"
							value={name}
							onChangeText={setName}
						/>
						<Text style={styles.label}>Description</Text>
						<TextInput
							style={[styles.input, styles.notesInput]}
							placeholder="Optional description about the drill"
							value={notes}
							onChangeText={setNotes}
							multiline
							numberOfLines={4}
						/>

						<SelectionButtons
							title="Type"
							options={drillTypes}
							selectedValues={type}
							onSelect={setType}
							required={true}
						/>

						<SelectionButtons
							title="Skill Focus"
							options={drillCategories}
							selectedValues={skillFocus}
							onSelect={setSkillFocus}
							required={true}
						/>

						<SelectionButtons
							title="Difficulty"
							options={drillDifficulties}
							selectedValues={difficulty}
							onSelect={setDifficulty}
							required={true}
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
								style={[
									styles.button,
									saving && styles.buttonDisabled,
								]}
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
	selectionContainer: {
		marginBottom: 8,
	},
	buttonRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
	},
	selectionButton: {
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderRadius: 8,
		borderWidth: 2,
		borderColor: "#E5E5E5",
		backgroundColor: "#FAFAFA",
		marginRight: 8,
		marginBottom: 8,
	},
	selectedButton: {
		backgroundColor: "#007AFF",
		borderColor: "#007AFF",
	},
	selectionButtonText: {
		fontSize: 16,
		fontWeight: "600",
		color: "#666",
	},
	selectedButtonText: {
		color: "#FFFFFF",
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
	buttonDisabled: {
		backgroundColor: "#B0B0B0",
	},
	buttonText: {
		color: "white",
		fontSize: 18,
		fontWeight: "700",
	},
});
