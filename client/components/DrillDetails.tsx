import React, { useState } from "react";
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
} from "react-native";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export default function DrillDetails({ route }) {
	const { drill } = route.params;
	const [imageLoading, setImageLoading] = useState(true);
	const [imageError, setImageError] = useState(false);
	const [modalVisible, setModalVisible] = useState(false);
	const [modalImageLoading, setModalImageLoading] = useState(true);

	console.log(drill, "drill");

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

	// Helper function to get first difficulty for color
	const getFirstDifficulty = (difficultyData) => {
		if (!difficultyData) return "";

		try {
			const parsed = JSON.parse(difficultyData);
			if (Array.isArray(parsed) && parsed.length > 0) {
				return parsed[0];
			}
			return difficultyData;
		} catch (error) {
			return difficultyData;
		}
	};

	// Helper function to get difficulty color
	const getDifficultyColor = (difficulty) => {
		switch (difficulty?.toLowerCase()) {
			case "beginner":
				return "#4CAF50";
			case "intermediate":
				return "#FF9800";
			case "advanced":
				return "#F44336";
			default:
				return "#666";
		}
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
				<Text style={styles.name}>{drill.name}</Text>

				{/* Drill Image */}
				{drill.imageUrl && (
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
								source={{ uri: drill.imageUrl }}
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
							{formatArrayData(drill.skillFocus)}
						</Text>
					</View>

					<View style={styles.detailRow}>
						<Text style={styles.detailLabel}>Type:</Text>
						<Text style={styles.detailValue}>
							{formatArrayData(drill.type)}
						</Text>
					</View>

					<View style={styles.detailRow}>
						<Text style={styles.detailLabel}>Difficulty:</Text>
						<Text style={[styles.detailValue]}>
							{formatArrayData(drill.difficulty)}
						</Text>
					</View>

					{drill.duration && (
						<View style={styles.detailRow}>
							<Text style={styles.detailLabel}>Duration:</Text>
							<Text style={styles.detailValue}>
								{drill.duration} min
							</Text>
						</View>
					)}
				</View>

				{/* Description/Notes */}
				{drill.notes && drill.notes.trim() !== "" ? (
					<>
						<Text style={styles.sectionTitle}>Description</Text>
						<Text style={styles.description}>{drill.notes}</Text>
					</>
				) : (
					<Text style={styles.noDescription}>
						No description available for this drill.
					</Text>
				)}
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
								source={{ uri: drill.imageUrl }}
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
		backgroundColor: "#f8f9fa",
	},
	card: {
		backgroundColor: "white",
		borderRadius: 12,
		margin: 20,
		padding: 20,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 3 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 5,
	},
	category: {
		fontSize: 14,
		fontWeight: "700",
		color: "#4CAF50",
		letterSpacing: 1,
		marginBottom: 4,
	},
	subcategory: {
		fontSize: 16,
		fontWeight: "600",
		color: "#333",
		marginBottom: 12,
	},
	name: {
		fontSize: 24,
		fontWeight: "bold",
		color: "#222",
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
		backgroundColor: "#f0f0f0",
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
		backgroundColor: "#f0f0f0",
		zIndex: 1,
	},
	loadingText: {
		marginTop: 10,
		fontSize: 14,
		color: "#666",
	},
	imageErrorContainer: {
		width: "100%",
		height: 200,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#f0f0f0",
	},
	imageErrorText: {
		fontSize: 14,
		color: "#999",
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
		borderBottomColor: "#f0f0f0",
	},
	detailLabel: {
		fontSize: 16,
		fontWeight: "600",
		color: "#666",
		minWidth: 100,
		marginRight: 12,
	},
	detailValue: {
		fontSize: 16,
		color: "#333",
		fontWeight: "500",
		flex: 1,
		flexShrink: 1,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: "#333",
		marginBottom: 12,
		marginTop: 8,
	},
	description: {
		fontSize: 16,
		lineHeight: 24,
		color: "#555",
	},
	noDescription: {
		fontSize: 16,
		color: "#999",
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
});
