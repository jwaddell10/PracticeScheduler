import React, { useState, useEffect } from "react";
import {
	View,
	Text,
	StyleSheet,
	Image,
	ScrollView,
	ActivityIndicator,
	TouchableOpacity,
	Modal,
	Dimensions,
	Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSubscription } from "../context/UserRoleContext";
import { useSession } from "../context/SessionContext";
import { useDrills } from "../context/DrillsContext";
import theme from "./styles/theme";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export default function DrillDetails({ route }: { route: any }) {
	const { drill: initialDrill } = route.params;
	const [currentDrill, setCurrentDrill] = useState(initialDrill);
	
	// Add defensive check for drill object
	if (!currentDrill) {
		return (
			<View style={styles.container}>
				<Text style={styles.errorText}>Drill not found</Text>
			</View>
		);
	}
	const navigation = useNavigation();
	const { isPremium } = useSubscription();
	const { deleteDrill, publicDrills, userDrills } = useDrills();
	const session = useSession();
	
	const [imageLoading, setImageLoading] = useState(true);
	const [imageError, setImageError] = useState(false);
	const [modalVisible, setModalVisible] = useState(false);
	const [modalImageLoading, setModalImageLoading] = useState(true);
	const [isDeleting, setIsDeleting] = useState(false);

	// Refresh drill data when screen comes into focus
	useEffect(() => {
		const unsubscribe = navigation.addListener('focus', () => {
			// Find the updated drill from the drills context
			const allDrills = [...(publicDrills || []), ...(userDrills || [])];
			const updatedDrill = allDrills.find(d => d.id === currentDrill.id);
			if (updatedDrill) {
				setCurrentDrill(updatedDrill);
			}
		});

		return unsubscribe;
	}, [navigation, currentDrill.id, publicDrills, userDrills]);

	// Helper function to capitalize first letter
	const capitalize = (str) => {
		return str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
	};

	// Helper function to parse and format array data
	const formatArrayData = (data) => {
		if (!data) return "Not specified";

		try {
			// If it's a JSON string, parse it
			const parsed = JSON.parse(data);
			if (Array.isArray(parsed)) {
				return parsed.map((item) => capitalize(item)).join(", ");
			}
			return capitalize(data);
		} catch (error) {
			// If parsing fails, treat as regular string
			return capitalize(data);
		}
	};

	// Check if user can delete this drill
	const canDeleteDrill = () => {
		// User can only delete their own drills (admin functionality removed)
		return currentDrill.user_id === session?.user?.id;
	};

	// Check if user can edit this drill
	const canEditDrill = () => {
		// User can only edit their own drills (admin functionality removed)
		return currentDrill.user_id === session?.user?.id;
	};

	// Handle delete drill
	const handleDeleteDrill = async () => {
		if (!canDeleteDrill()) {
			Alert.alert("Permission Denied", "You don't have permission to delete this drill.");
			return;
		}

		Alert.alert(
			"Delete Drill",
			"Are you sure you want to delete this drill? This action cannot be undone.",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete",
					style: "destructive",
					onPress: async () => {
						try {
							setIsDeleting(true);
							await deleteDrill(currentDrill.id);
							Alert.alert("Success", "Drill deleted successfully.");
							navigation.goBack();
						} catch (error) {
							Alert.alert("Error", "Failed to delete drill. Please try again.");
						} finally {
							setIsDeleting(false);
						}
					},
				},
			]
		);
	};

	const handleImagePress = () => {
		setModalVisible(true);
		setModalImageLoading(true);
	};

	const closeModal = () => {
		setModalVisible(false);
		setModalImageLoading(true);
	};

	return (
		<ScrollView style={styles.container}>
			<View style={styles.card}>
				{/* Drill Name */}
				<Text style={styles.name}>{currentDrill.name}</Text>

				{/* Drill Image */}
				{currentDrill.imageUrl && (
					<TouchableOpacity
						style={styles.imageContainer}
						onPress={handleImagePress}
						activeOpacity={0.8}
					>
						{imageLoading && (
							<View style={styles.imageLoadingContainer}>
								<ActivityIndicator
									size="large"
									color="#4CAF50"
								/>
								<Text style={styles.loadingText}>
									Loading image...
								</Text>
							</View>
						)}
						{!imageError && (
							<Image
								source={{ uri: currentDrill.imageUrl }}
								style={[
									styles.drillImage,
									imageLoading && styles.hiddenImage,
								]}
								resizeMode="cover"
								onLoad={() => setImageLoading(false)}
								onError={() => {
									setImageLoading(false);
									setImageError(true);
								}}
							/>
						)}
						{imageError && (
							<View style={styles.imageErrorContainer}>
								<Text style={styles.imageErrorText}>
									Failed to load image
								</Text>
							</View>
						)}
						{!imageLoading && !imageError && (
							<View style={styles.imageOverlay}>
								<Text style={styles.tapToViewText}>
									Tap to view full image
								</Text>
							</View>
						)}
					</TouchableOpacity>
				)}

				{/* Drill Details */}
				<View style={styles.detailsContainer}>
					<View style={styles.detailRow}>
						<Text style={styles.detailLabel}>Skill Focus:</Text>
						<Text style={styles.detailValue}>
							{formatArrayData(currentDrill.skillFocus)}
						</Text>
					</View>

					<View style={styles.detailRow}>
						<Text style={styles.detailLabel}>Type:</Text>
						<Text style={styles.detailValue}>
							{formatArrayData(currentDrill.type)}
						</Text>
					</View>

					<View style={styles.detailRow}>
						<Text style={styles.detailLabel}>Difficulty:</Text>
						<Text style={[styles.detailValue]}>
							{formatArrayData(currentDrill.difficulty)}
						</Text>
					</View>

					{currentDrill.duration && (
						<View style={styles.detailRow}>
							<Text style={styles.detailLabel}>Duration:</Text>
							<Text style={styles.detailValue}>
								{currentDrill.duration} min
							</Text>
						</View>
					)}
				</View>

				{/* Description/Notes */}
				{currentDrill.notes && currentDrill.notes.trim() !== "" ? (
					<>
						<Text style={styles.sectionTitle}>Description</Text>
						<Text style={styles.description}>{currentDrill.notes}</Text>
					</>
				) : (
					<Text style={styles.noDescription}>
						No description available for this drill.
					</Text>
				)}

				{/* Action Buttons */}
				<View style={styles.actionButtonsContainer}>
					{/* Edit Button */}
					{canEditDrill() && (
						<TouchableOpacity
							style={styles.editButton}
							onPress={() => navigation.navigate('CreateDrill', { 
								mode: 'edit', 
								drill: currentDrill,
								refreshDrills: () => {
									// Refresh the drill details
									navigation.goBack();
								}
							})}
						>
							<MaterialIcons name="edit" size={20} color="white" />
							<Text style={styles.editButtonText}>Edit Drill</Text>
						</TouchableOpacity>
					)}

					{/* Delete Button */}
					{canDeleteDrill() && (
						<TouchableOpacity
							style={styles.deleteButton}
							onPress={handleDeleteDrill}
							disabled={isDeleting}
						>
							{isDeleting ? (
								<ActivityIndicator size="small" color="white" />
							) : (
								<MaterialIcons name="delete" size={20} color="white" />
							)}
							<Text style={styles.deleteButtonText}>
								{isDeleting ? "Deleting..." : "Delete Drill"}
							</Text>
						</TouchableOpacity>
					)}
				</View>
			</View>

			{/* Full Screen Image Modal */}
			<Modal
				visible={modalVisible}
				transparent={true}
				animationType="fade"
				onRequestClose={closeModal}
			>
				<View style={styles.modalContainer}>
					<TouchableOpacity
						style={styles.modalOverlay}
						onPress={closeModal}
						activeOpacity={1}
					>
						<View style={styles.modalContent}>
							{modalImageLoading && (
								<View style={styles.modalLoadingContainer}>
									<ActivityIndicator
										size="large"
										color="#4CAF50"
									/>
									<Text style={styles.modalLoadingText}>
										Loading full image...
									</Text>
								</View>
							)}
							<Image
								source={{ uri: currentDrill.imageUrl }}
								style={styles.fullScreenImage}
								resizeMode="contain"
								onLoad={() => setModalImageLoading(false)}
								onError={() => setModalImageLoading(false)}
							/>
							<TouchableOpacity
								style={styles.closeButton}
								onPress={closeModal}
							>
								<Text style={styles.closeButtonText}>✕</Text>
							</TouchableOpacity>
						</View>
					</TouchableOpacity>
				</View>
			</Modal>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: theme.colors.background,
	},
	card: {
		backgroundColor: theme.colors.surface,
		borderRadius: 12,
		margin: 20,
		padding: 20,
		shadowColor: theme.colors.surface,
		shadowOffset: { width: 0, height: 3 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 5,
		borderWidth: 1,
		borderColor: theme.colors.border,
	},
	category: {
		fontSize: 14,
		fontWeight: "700",
		color: theme.colors.primary,
		letterSpacing: 1,
		marginBottom: 4,
	},
	subcategory: {
		fontSize: 16,
		fontWeight: "600",
		color: theme.colors.textPrimary,
		marginBottom: 12,
	},
	name: {
		fontSize: 24,
		fontWeight: "bold",
		color: theme.colors.textPrimary,
		marginBottom: 16,
	},
	imageContainer: {
		marginBottom: 20,
		borderRadius: 8,
		overflow: "hidden",
		position: "relative",
	},
	drillImage: {
		width: "100%",
		height: 200,
		backgroundColor: theme.colors.border,
	},
	hiddenImage: {
		opacity: 0,
	},
	imageLoadingContainer: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: theme.colors.border,
		zIndex: 1,
	},
	loadingText: {
		marginTop: 10,
		fontSize: 14,
		color: theme.colors.textMuted,
	},
	imageErrorContainer: {
		width: "100%",
		height: 200,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: theme.colors.border,
	},
	imageErrorText: {
		fontSize: 14,
		color: theme.colors.textMuted,
		fontStyle: "italic",
	},
	imageOverlay: {
		position: "absolute",
		bottom: 0,
		left: 0,
		right: 0,
		backgroundColor: "rgba(0, 0, 0, 0.6)",
		paddingVertical: 8,
		paddingHorizontal: 12,
	},
	tapToViewText: {
		color: "white",
		fontSize: 12,
		textAlign: "center",
		fontWeight: "500",
	},
	detailsContainer: {
		marginBottom: 20,
	},
	detailRow: {
		flexDirection: "row",
		paddingVertical: 8,
		borderBottomWidth: 1,
		borderBottomColor: theme.colors.border,
	},
	detailLabel: {
		fontSize: 16,
		fontWeight: "600",
		color: theme.colors.textMuted,
		minWidth: 100,
		marginRight: 12,
	},
	detailValue: {
		fontSize: 16,
		color: theme.colors.textPrimary,
		fontWeight: "500",
		flex: 1,
		flexShrink: 1,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: theme.colors.textPrimary,
		marginBottom: 12,
		marginTop: 8,
	},
	description: {
		fontSize: 16,
		lineHeight: 24,
		color: theme.colors.textMuted,
	},
	noDescription: {
		fontSize: 16,
		color: theme.colors.textMuted,
		fontStyle: "italic",
		textAlign: "center",
		marginTop: 20,
	},
	// Modal styles
	modalContainer: {
		flex: 1,
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: "rgba(0, 0, 0, 0.9)",
		justifyContent: "center",
		alignItems: "center",
	},
	modalContent: {
		width: screenWidth,
		height: screenHeight,
		justifyContent: "center",
		alignItems: "center",
		position: "relative",
	},
	fullScreenImage: {
		width: screenWidth - 40,
		height: screenHeight - 100,
		maxWidth: screenWidth - 40,
		maxHeight: screenHeight - 100,
	},
	modalLoadingContainer: {
		position: "absolute",
		justifyContent: "center",
		alignItems: "center",
		zIndex: 1,
	},
	modalLoadingText: {
		color: "white",
		marginTop: 10,
		fontSize: 16,
	},
	closeButton: {
		position: "absolute",
		top: 50,
		right: 20,
		backgroundColor: "rgba(255, 255, 255, 0.2)",
		borderRadius: 20,
		width: 40,
		height: 40,
		justifyContent: "center",
		alignItems: "center",
	},
	closeButtonText: {
		color: "white",
		fontSize: 20,
		fontWeight: "bold",
	},
	// Action buttons container
	actionButtonsContainer: {
		marginTop: 24,
		gap: 12,
	},
	// Edit button styles
	editButton: {
		backgroundColor: "#007bff",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderRadius: 8,
		gap: 8,
	},
	editButtonText: {
		color: "white",
		fontSize: 16,
		fontWeight: "600",
	},
	// Delete button styles
	deleteButton: {
		backgroundColor: "#dc3545",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderRadius: 8,
		gap: 8,
	},
	deleteButtonText: {
		color: "white",
		fontSize: 16,
		fontWeight: "600",
	},
	errorText: {
		color: theme.colors.error,
		fontSize: 18,
		textAlign: "center",
		marginTop: 50,
	},
});
