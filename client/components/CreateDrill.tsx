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
import { useRoute } from "@react-navigation/native";
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
	const route = useRoute();
	const { refreshDrills } = route.params || {};

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

		if (session) {
			await supabase.auth.setSession({
				access_token: session.access_token,
				refresh_token: session.refresh_token,
			});
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
			// 1️⃣ Check Auth app_metadata for role
			let isAdmin = session.user.app_metadata?.role === "admin";
			console.log(isAdmin, "is admin");

			// 2️⃣ If not admin, check database
			if (!isAdmin) {
				const { data: userData, error: userError } = await supabase
					.from("users")
					.select("role")
					.eq("id", session.user.id)
					.maybeSingle();

				console.log("Query result - data:", userData);
				console.log("Query result - error:", userError);

				if (userError) throw userError;

				// 🔥 ADD THIS - Actually set isAdmin based on the result
				if (userData?.role === "admin") {
					isAdmin = true;
					console.log("Setting isAdmin to true from database");
				}
			}

			console.log("Final isAdmin value:", isAdmin);

			// 3️⃣ Handle optional image upload
			let imageUrl = null;
			if (imageUri) {
				let fixedUri = imageUri;
				let fileExt = imageUri.split(".").pop()?.toLowerCase();

				if (fileExt === "heic") {
					const jpegUri = imageUri.replace(/\.heic$/i, ".jpg");
					await FileSystem.copyAsync({ from: imageUri, to: jpegUri });
					fixedUri = jpegUri;
					fileExt = "jpg";
				}

				imageUrl = await uploadImageAsync(fixedUri);
			}

			// 4️⃣ Insert drill
			const { error: insertError } = await supabase.from("Drill").insert([
				{
					user_id: session.user.id,
					name,
					type,
					skillFocus,
					difficulty,
					notes,
					imageUrl,
					isPublic: isAdmin, // This should now be true for admin users
				},
			]);

			if (insertError) throw insertError;

			Alert.alert("Success", "Drill created successfully!");
			resetForm();
			refreshDrills?.();
		} catch (error) {
			console.error("Submit error:", error);
			Alert.alert("Error", error.message || "Something went wrong.");
		} finally {
			setSaving(false);
		}
	};

	const resetForm = () => {
		setName("");
		setType([]);
		setSkillFocus([]);
		setDifficulty([]);
		setNotes("");
		setImageUri(null);
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
				nestedScrollEnabled={true}
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
		padding: 20,
		paddingBottom: 40,
	},
	label: {
		fontSize: 16,
		fontWeight: "600",
		marginBottom: 8,
		marginTop: 16,
		color: "#333",
	},
	input: {
		borderWidth: 1,
		borderColor: "#ddd",
		borderRadius: 8,
		padding: 12,
		fontSize: 16,
		backgroundColor: "#fff",
	},
	notesInput: {
		height: 100,
		textAlignVertical: "top",
	},
	selectionContainer: {
		marginBottom: 20,
	},
	buttonRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
	},
	selectionButton: {
		borderWidth: 1,
		borderColor: "#007AFF",
		borderRadius: 20,
		paddingHorizontal: 16,
		paddingVertical: 8,
		backgroundColor: "#fff",
	},
	selectedButton: {
		backgroundColor: "#007AFF",
	},
	selectionButtonText: {
		color: "#007AFF",
		fontSize: 14,
		fontWeight: "500",
	},
	selectedButtonText: {
		color: "#fff",
	},
	imageUploadButton: {
		borderWidth: 1,
		borderColor: "#007AFF",
		borderRadius: 8,
		padding: 12,
		alignItems: "center",
		backgroundColor: "#f8f9fa",
	},
	imageUploadButtonText: {
		color: "#007AFF",
		fontSize: 16,
		fontWeight: "500",
	},
	previewImage: {
		width: "100%",
		height: 200,
		borderRadius: 8,
		marginTop: 12,
	},
	buttonContainer: {
		marginTop: 30,
	},
	button: {
		backgroundColor: "#007AFF",
		borderRadius: 8,
		padding: 16,
		alignItems: "center",
	},
	buttonDisabled: {
		backgroundColor: "#ccc",
	},
	buttonText: {
		color: "#fff",
		fontSize: 18,
		fontWeight: "600",
	},
});
