import React, { useState } from "react";
import {
	View,
	Text,
	StyleSheet,
	Image,
	ScrollView,
	ActivityIndicator,
} from "react-native";

export default function DrillDetails({ route }) {
	const { drill, category, subcategory } = route.params;
	const [imageLoading, setImageLoading] = useState(true);
	const [imageError, setImageError] = useState(false);

	console.log(drill, "drill");

	// Helper function to capitalize first letter
	const capitalize = (str) => {
		return str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
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

	return (
		<ScrollView style={styles.container}>
			<View style={styles.card}>
				{/* Category and Subcategory */}
				<Text style={styles.category}>
					{category?.toUpperCase() || "DRILL"}
				</Text>
				{subcategory && (
					<Text style={styles.subcategory}>{subcategory}</Text>
				)}

				{/* Drill Name */}
				<Text style={styles.name}>{drill.name}</Text>

				{/* Drill Image */}
				{drill.imageUrl && (
					<View style={styles.imageContainer}>
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
					</View>
				)}

				{/* Drill Details */}
				<View style={styles.detailsContainer}>
					<View style={styles.detailRow}>
						<Text style={styles.detailLabel}>Skill Focus:</Text>
						<Text style={styles.detailValue}>
							{capitalize(drill.skillFocus)}
						</Text>
					</View>

					<View style={styles.detailRow}>
						<Text style={styles.detailLabel}>Type:</Text>
						<Text style={styles.detailValue}>
							{capitalize(drill.type)}
						</Text>
					</View>

					<View style={styles.detailRow}>
						<Text style={styles.detailLabel}>Difficulty:</Text>
						<Text
							style={[
								styles.detailValue,
								styles.difficulty,
								{ color: getDifficultyColor(drill.difficulty) },
							]}
						>
							{capitalize(drill.difficulty)}
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
	detailsContainer: {
		marginBottom: 20,
	},
	detailRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: 8,
		borderBottomWidth: 1,
		borderBottomColor: "#f0f0f0",
	},
	detailLabel: {
		fontSize: 16,
		fontWeight: "600",
		color: "#666",
	},
	detailValue: {
		fontSize: 16,
		color: "#333",
		fontWeight: "500",
	},
	difficulty: {
		fontWeight: "700",
		textTransform: "uppercase",
		letterSpacing: 0.5,
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
});
