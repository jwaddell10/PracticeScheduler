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
	Switch,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useSession } from "../context/SessionContext";
import { decode } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system";
import { supabase } from "../lib/supabase";
import { useUserRole } from "../hooks/useUserRole"; // ⬅️ import our hook

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

export default function CreateDrill({ refreshDrills, onClose }) {
	const session = useSession();
	const { isAdmin, loading: roleLoading, error: roleError } = useUserRole(); // ⬅️ use the hook

	const [name, setName] = useState("");
	const [type, setType] = useState([]);
	const [skillFocus, setSkillFocus] = useState([]);
	const [difficulty, setDifficulty] = useState([]);
	const [notes, setNotes] = useState("");
	const [saving, setSaving] = useState(false);
	const [imageUri, setImageUri] = useState(null);
	const [isPublic, setIsPublic] = useState(isAdmin); // default to admin value

	// Button selection component
	const SelectionButtons = ({ title, options, selectedValues, onSelect }) => (
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
									onSelect(
										selectedValues.filter(
											(val) => val !== option.value
										)
									);
								} else {
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
				mediaTypes: "images",
				allowsEditing: false,
				quality: 1,
			});

			if (!result.canceled && result.assets?.length > 0) {
				const uri = result.assets[0].uri;
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
		if (!session?.user) {
			throw new Error("Unable to get authenticated user.");
		}

		const fileInfo = await FileSystem.getInfoAsync(uri);
		if (!fileInfo.exists) {
			throw new Error("Image file not found.");
		}

		const userId = session.user.id;
		const fileName = `${Date.now()}_${uri.substring(
			uri.lastIndexOf("/") + 1
		)}`;
		const filePath = `${userId}/${fileName}`;

		const base64 = await FileSystem.readAsStringAsync(uri, {
			encoding: FileSystem.EncodingType.Base64,
		});
		const arrayBuffer = decode(base64);

		const { error } = await supabase.storage
			.from("drill-images")
			.upload(filePath, arrayBuffer, {
				contentType: "image/jpeg",
			});

		if (error) {
			console.error("Upload error:", error.message);
			throw new Error("Failed to upload image.");
		}

		const { data: publicData } = supabase.storage
			.from("drill-images")
			.getPublicUrl(filePath);

		return publicData.publicUrl;
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
			let imageUrl = null;
			if (imageUri) {
				let fixedUri = imageUri;
				let fileExt = imageUri.split(".").pop()?.toLowerCase();
				if (fileExt === "heic") {
					const jpegUri = imageUri.replace(/\.heic$/i, ".jpg");
					await FileSystem.copyAsync({ from: imageUri, to: jpegUri });
					fixedUri = jpegUri;
				}
				imageUrl = await uploadImageAsync(fixedUri);
			}

			const { error: insertError } = await supabase.from("Drill").insert([
				{
					user_id: session.user.id,
					name,
					type,
					skillFocus,
					difficulty,
					notes,
					imageUrl,
					isPublic: isAdmin ? isPublic : false,
				},
			]);

			if (insertError) throw insertError;

			Alert.alert("Success", "Drill created successfully!", [
				{
					text: "OK",
					onPress: () => {
						resetForm();
						refreshDrills?.();
						onClose?.();
					},
				},
			]);
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
		setIsPublic(isAdmin);
	};

	// While role is loading, show a loading state (optional)
	if (roleLoading) {
		return (
			<View style={styles.container}>
				<Text>Loading permissions...</Text>
			</View>
		);
	}

	if (roleError) {
		return (
			<View style={styles.container}>
				<Text>Error loading role: {roleError}</Text>
			</View>
		);
	}

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
						/>
						<SelectionButtons
							title="Skill Focus"
							options={drillCategories}
							selectedValues={skillFocus}
							onSelect={setSkillFocus}
						/>
						<SelectionButtons
							title="Difficulty"
							options={drillDifficulties}
							selectedValues={difficulty}
							onSelect={setDifficulty}
						/>

						{/* Admin toggle for public drills */}
						{isAdmin && (
							<View style={styles.toggleRow}>
								<Text style={styles.toggleLabel}>
									Make Public
								</Text>
								<Switch
									value={isPublic}
									onValueChange={setIsPublic}
								/>
							</View>
						)}

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
		flexGrow: 1,
		padding: 16,
		backgroundColor: "#fff",
	},
	label: {
		fontSize: 16,
		fontWeight: "600",
		color: "#333",
		marginBottom: 8,
		marginTop: 16,
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
		marginBottom: 16,
	},
	buttonRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
	},
	selectionButton: {
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 20,
		borderWidth: 1,
		borderColor: "#ddd",
		backgroundColor: "#fff",
	},
	selectedButton: {
		backgroundColor: "#007AFF",
		borderColor: "#007AFF",
	},
	selectionButtonText: {
		fontSize: 14,
		color: "#333",
	},
	selectedButtonText: {
		color: "#fff",
		fontWeight: "500",
	},
	toggleRow: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 16,
		marginBottom: 8,
	},
	toggleLabel: {
		fontSize: 16,
		fontWeight: "600",
		color: "#333",
		marginRight: 8,
	},
	imageUploadButton: {
		backgroundColor: "#f0f0f0",
		padding: 12,
		borderRadius: 8,
		alignItems: "center",
		marginBottom: 16,
	},
	imageUploadButtonText: {
		fontSize: 16,
		color: "#007AFF",
		fontWeight: "500",
	},
	previewImage: {
		width: "100%",
		height: 200,
		borderRadius: 8,
		marginBottom: 16,
	},
	buttonContainer: {
		marginTop: 20,
		marginBottom: 40,
	},
	button: {
		backgroundColor: "#007AFF",
		padding: 16,
		borderRadius: 8,
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
