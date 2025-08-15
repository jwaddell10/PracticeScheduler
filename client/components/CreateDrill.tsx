import React, { useState, useLayoutEffect } from "react";
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
import { useDrills } from "../context/DrillsContext";
import { useNavigation, useRoute } from "@react-navigation/native";
import theme from "./styles/theme";

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

interface CreateDrillProps {
	refreshDrills?: () => void;
	onClose?: () => void;
	isModal?: boolean;
}

export default function CreateDrill(props?: CreateDrillProps) {
	const navigation = useNavigation();
	const route = useRoute();
	const session = useSession();
	const { isAdmin, loading: roleLoading, error: roleError, role } = useUserRole(); // ⬅️ use the hook
	
	// Get params from route
	const { mode = 'create', drill: existingDrill } = (route.params as any) || {};
	
	// Use props if available (for modal usage), otherwise use route params
	const refreshDrills = props?.refreshDrills || (route.params as any)?.refreshDrills;
	const onClose = props?.onClose || (route.params as any)?.onClose;
	const isModal = props?.isModal || (route.params as any)?.isModal || false;
	const isEditMode = mode === 'edit';

	const [name, setName] = useState(existingDrill?.name || "");
	const [type, setType] = useState(existingDrill?.type ? JSON.parse(existingDrill.type) : []);
	const [skillFocus, setSkillFocus] = useState(existingDrill?.skillFocus ? JSON.parse(existingDrill.skillFocus) : []);
	const [difficulty, setDifficulty] = useState(existingDrill?.difficulty ? JSON.parse(existingDrill.difficulty) : []);
	const [notes, setNotes] = useState(existingDrill?.notes || "");
	const [saving, setSaving] = useState(false);
	const [imageUri, setImageUri] = useState(null);
	const [isPublic, setIsPublic] = useState(existingDrill?.isPublic ?? isAdmin); // default to admin value

	// Set up header with back button and save button (only when not in modal)
	useLayoutEffect(() => {
		if (!isModal) {
			navigation.setOptions({
				headerTitle: isEditMode ? "Edit Drill" : "Create Drill",
				headerLeft: () => (
					<TouchableOpacity onPress={() => navigation.goBack()}>
						<Text style={styles.headerButton}>Cancel</Text>
					</TouchableOpacity>
				),
				headerRight: () => (
					<TouchableOpacity onPress={handleSubmit} disabled={saving}>
						<Text style={[styles.headerButton, saving && styles.headerButtonDisabled]}>
							{saving ? "Saving..." : (isEditMode ? "Update" : "Save")}
						</Text>
					</TouchableOpacity>
				),
			});
		}
	}, [navigation, name, type, skillFocus, difficulty, notes, saving, isEditMode, isModal]);

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
			Alert.alert("Error", `You must be logged in to ${isEditMode ? 'edit' : 'create'} a drill.`);
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
			let imageUrl = existingDrill?.imageUrl || null;
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

			if (isEditMode) {
				// Update existing drill
				const { error: updateError } = await supabase
					.from("Drill")
					.update({
						name,
						type,
						skillFocus,
						difficulty,
						notes,
						imageUrl,
						isPublic: isAdmin ? isPublic : existingDrill.isPublic,
					})
					.eq("id", existingDrill.id);

				if (updateError) throw updateError;

				Alert.alert("Success", "Drill updated successfully!", [
					{
						text: "OK",
						onPress: () => {
							// Call the refresh function passed from parent component
							refreshDrills?.();
							// If onClose is provided, use it, otherwise navigate back
							if (onClose) {
								onClose();
							} else {
								navigation.goBack();
							}
						},
					},
				]);
			} else {
				// Create new drill
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
							// Call the refresh function passed from parent component
							refreshDrills?.();
							// If onClose is provided, use it, otherwise navigate back
							if (onClose) {
								onClose();
							} else {
								navigation.goBack();
							}
						},
					},
				]);
			}
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

						{/* Only show image upload for premium users */}
						{role === 'premium' || role === 'Premium' ? (
							<>
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
							</>
						) : (
							<View style={styles.premiumFeatureContainer}>
								<Text style={styles.premiumFeatureText}>
									Add images to your drills with Premium
								</Text>
								<TouchableOpacity
									style={styles.upgradeButton}
									onPress={() => {
										Alert.alert(
											"Coming Soon!",
											"Premium features are currently in development. Stay tuned for updates!",
											[{ text: "OK", style: "default" }]
										);
									}}
								>
									<Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
								</TouchableOpacity>
							</View>
						)}
					</View>
				</TouchableWithoutFeedback>
			</ScrollView>
			
			{/* Sticky button at bottom */}
			<View style={styles.stickyButtonContainer}>
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
		</KeyboardAvoidingView>
	);
}


const styles = StyleSheet.create({
	container: {
		flexGrow: 1,
		padding: 16,
		paddingBottom: 100, // Add space for sticky button
		backgroundColor: theme.colors.background,
	},
	label: {
		fontSize: 16,
		fontWeight: "600",
		color: theme.colors.textPrimary,
		marginBottom: 8,
		marginTop: 16,
	},
	input: {
		borderWidth: 1,
		borderColor: theme.colors.border,
		borderRadius: 8,
		padding: 12,
		fontSize: 16,
		backgroundColor: theme.colors.surface,
		color: theme.colors.textPrimary,
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
		borderColor: theme.colors.border,
		backgroundColor: theme.colors.surface,
	},
	selectedButton: {
		backgroundColor: theme.colors.primary,
		borderColor: theme.colors.primary,
	},
	selectionButtonText: {
		fontSize: 14,
		color: theme.colors.textPrimary,
	},
	selectedButtonText: {
		color: theme.colors.white,
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
		color: theme.colors.textPrimary,
		marginRight: 8,
	},
	imageUploadButton: {
		backgroundColor: theme.colors.border,
		padding: 12,
		borderRadius: 8,
		alignItems: "center",
		marginBottom: 16,
	},
	imageUploadButtonText: {
		fontSize: 16,
		color: theme.colors.primary,
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
	stickyButtonContainer: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		backgroundColor: theme.colors.background,
		padding: 16,
		borderTopWidth: 1,
		borderTopColor: theme.colors.border,
	},
	button: {
		backgroundColor: theme.colors.primary,
		padding: 16,
		borderRadius: 8,
		alignItems: "center",
	},
	buttonDisabled: {
		backgroundColor: theme.colors.border,
	},
	buttonText: {
		color: theme.colors.white,
		fontSize: 18,
		fontWeight: "600",
	},
	headerButton: {
		fontSize: 16,
		color: theme.colors.primary,
		fontWeight: "500",
	},
	headerButtonDisabled: {
		color: theme.colors.textMuted,
	},
	premiumFeatureContainer: {
		backgroundColor: theme.colors.surface,
		borderRadius: 12,
		padding: 16,
		marginTop: 16,
		marginBottom: 16,
		borderWidth: 1,
		borderColor: theme.colors.border,
		alignItems: "center",
	},
	premiumFeatureText: {
		fontSize: 16,
		color: theme.colors.textMuted,
		marginBottom: 12,
		textAlign: "center",
	},
	upgradeButton: {
		backgroundColor: '#8B5CF6',
		paddingVertical: 12,
		paddingHorizontal: 20,
		borderRadius: 8,
		alignItems: "center",
	},
	upgradeButtonText: {
		color: theme.colors.white,
		fontSize: 16,
		fontWeight: "600",
	},
});
