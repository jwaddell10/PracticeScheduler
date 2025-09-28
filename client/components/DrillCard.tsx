import React from "react";
import {
	View,
	Text,
	TouchableOpacity,
	Image,
	StyleSheet,
	Pressable,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import StarButton from "./StarButton";
import { useFavorites } from "../context/FavoritesContext";
import { useClipboard } from "../context/ClipboardContext";
import { useSubscription } from "../context/SubscriptionContext";
import { useDrills } from "../context/DrillsContext";
import { addDrillToClipboard, removeDrillFromClipboard } from "../util/clipboardManager";
import { Alert } from "react-native";
import theme from "./styles/theme";

interface DrillCardProps {
	drill: {
		id: string;
		name: string;
		notes?: string;
		imageUrl?: string;
		type?: string | string[];
		skillFocus?: string | string[];
		difficulty?: string | string[];
		isPublic?: boolean;
		users?: { role?: string };
		user_id?: string;
		isUserDrill?: boolean;
		isFavorited?: boolean;
	};
	showStarButton?: boolean;
	showClipboardButton?: boolean;
	showStarOnlyIfFavorited?: boolean;
	onRefresh?: () => void;
}

export default function DrillCard({ 
	drill, 
	showStarButton = true, 
	showClipboardButton = true,
	showStarOnlyIfFavorited = false,
	onRefresh
}: DrillCardProps) {
	const navigation = useNavigation();
	const { favoriteDrillIds, handleFavoriteToggle } = useFavorites();
	const { clipboardStatus, updateClipboardStatus, refreshClipboard } = useClipboard();
	const { isAdmin } = useSubscription();

	const isAdminDrill = drill.users?.role === "admin";
	const isOwnDrill = drill.user_id === drill.user_id; // This will be passed from parent
	const isPublicDrill = drill.isPublic === true;
	const isFavorited = drill.isFavorited || favoriteDrillIds.has(drill.id);
	const isUserCreated = drill.isUserDrill || isOwnDrill;

	// Helper function to format array values
	const formatArrayValue = (value: string | string[] | undefined): string => {
		if (!value) return "N/A";
		
		// If it's already an array, join it
		if (Array.isArray(value)) {
			return value.join(", ");
		}
		
		// If it's a string, try to parse it as JSON
		if (typeof value === 'string') {
			try {
				const parsed = JSON.parse(value);
				if (Array.isArray(parsed)) {
					return parsed.join(", ");
				}
				return parsed;
			} catch (error) {
				// If parsing fails, return the original string
				return value;
			}
		}
		
		return String(value);
	};

	const handleToggleClipboard = async () => {
		const isCurrentlyInClipboard = clipboardStatus[drill.id];
		
		try {
			if (isCurrentlyInClipboard) {
				// Remove from clipboard
				await removeDrillFromClipboard(drill.id);
				updateClipboardStatus(drill.id, false);
			} else {
				// Add to clipboard
				const clipboardDrill = {
					id: drill.id,
					name: drill.name,
					type: Array.isArray(drill.type) ? drill.type.join(", ") : drill.type,
					skillFocus: Array.isArray(drill.skillFocus) ? drill.skillFocus.join(", ") : drill.skillFocus,
					difficulty: Array.isArray(drill.difficulty) ? drill.difficulty.join(", ") : drill.difficulty,
					duration: 0, // Default duration
					notes: drill.notes,
				};
				
				await addDrillToClipboard(clipboardDrill);
				updateClipboardStatus(drill.id, true);
			}
			
			// Ensure clipboard is refreshed
			await refreshClipboard();
		} catch (error) {
			console.error("Error toggling drill in clipboard:", error);
			Alert.alert("Error", "Failed to update clipboard");
		}
	};


	return (
		<TouchableOpacity
			style={styles.drillCard}
			activeOpacity={0.7}
			onPress={() =>
				(navigation as any).navigate("Drill Details", { drill })
			}
		>
			{/* Image Section */}
			{drill.imageUrl ? (
				<Image
					source={{ uri: drill.imageUrl }}
					style={styles.drillImage}
					resizeMode="cover"
				/>
			) : (
				<View style={[styles.drillImage, styles.placeholderImage]}>
					<MaterialIcons
						name="fitness-center"
						size={24}
						color="#999"
					/>
				</View>
			)}

			{/* Content Section */}
			<View style={styles.drillContent}>
				{/* Header with Title and Badges */}
				<View style={styles.drillHeader}>
					<View style={styles.titleContainer}>
						<Text style={styles.drillTitle} numberOfLines={2}>
							{drill.name}
						</Text>
					</View>

					<View style={styles.badgeContainer}>
						{showStarButton && (!showStarOnlyIfFavorited || isFavorited) && (
							<StarButton
								drillId={drill.id}
								initialIsFavorited={favoriteDrillIds.has(drill.id)}
								size={16}
								onToggle={handleFavoriteToggle}
								style={styles.topStarButton}
							/>
						)}
						{isPublicDrill && (
							<View style={styles.premiumBadge}>
								<Text style={styles.premiumBadgeText}>
									Premium
								</Text>
							</View>
						)}
						{isAdminDrill && !isOwnDrill && (
							<View style={styles.adminBadge}>
								<MaterialIcons
									name="verified"
									size={12}
									color="#4CAF50"
								/>
								<Text style={styles.adminBadgeText}>
									Admin
								</Text>
							</View>
						)}
					</View>
				</View>

				{/* Description */}
				{drill.notes && drill.notes.trim() !== "" && (
					<View style={styles.descriptionContainer}>
						<Text style={styles.descriptionText} numberOfLines={3}>
							{drill.notes}
						</Text>
					</View>
				)}

				{/* Tags */}
				<View style={styles.tagsContainer}>
					{drill.difficulty && (
						<View style={styles.tag}>
							<Text style={styles.tagText}>
								{formatArrayValue(drill.difficulty)}
							</Text>
						</View>
					)}
					{drill.skillFocus && (
						<View style={styles.tag}>
							<Text style={styles.tagText}>
								{formatArrayValue(drill.skillFocus)}
							</Text>
						</View>
					)}
					{drill.type && (
						<View style={styles.tag}>
							<Text style={styles.tagText}>
								{formatArrayValue(drill.type)}
							</Text>
						</View>
					)}
				</View>

				{/* Action Buttons */}
				<View style={styles.actionButtonsContainer}>
					{showClipboardButton && (
						<TouchableOpacity
							style={[
								styles.clipboardButton,
								clipboardStatus[drill.id] && styles.clipboardButtonActive
							]}
							onPress={handleToggleClipboard}
							activeOpacity={1}
						>
							<MaterialIcons
								name={clipboardStatus[drill.id] ? "check" : "content-paste"}
								size={16}
								color={clipboardStatus[drill.id] ? theme.colors.white : theme.colors.primary}
							/>
							<Text style={[
								styles.clipboardButtonText,
								clipboardStatus[drill.id] && styles.clipboardButtonTextActive
							]}>
								{clipboardStatus[drill.id] ? "Added" : "Add to Clipboard"}
							</Text>
						</TouchableOpacity>
					)}


				</View>
			</View>
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	drillCard: {
		flexDirection: "row",
		backgroundColor: theme.colors.surface,
		borderRadius: 12,
		marginBottom: 12,
		borderWidth: 1,
		borderColor: theme.colors.border,
		shadowColor: theme.colors.surface,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
	},
	drillImage: {
		width: 80,
		minHeight: 80,
		borderTopLeftRadius: 12,
		borderBottomLeftRadius: 12,
		overflow: 'hidden',
	},
	placeholderImage: {
		backgroundColor: theme.colors.background,
		justifyContent: "center",
		alignItems: "center",
		minHeight: 80,
	},
	drillContent: {
		flex: 1,
		padding: 12,
	},
	drillHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
		marginBottom: 8,
	},
	titleContainer: {
		flex: 1,
		flexDirection: "row",
		alignItems: "flex-start",
	},
	favoriteIcon: {
		marginRight: 4,
		marginTop: 2,
	},
	drillTitle: {
		fontSize: 16,
		fontWeight: "600",
		color: theme.colors.textPrimary,
		flex: 1,
	},
	badgeContainer: {
		flexDirection: "row",
		gap: 4,
	},
	premiumBadge: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: theme.colors.proPurple,
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 8,
	},
	premiumBadgeText: {
		fontSize: 10,
		color: theme.colors.white,
		fontWeight: "600",
	},
	adminBadge: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#E8F5E8",
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 8,
	},
	adminBadgeText: {
		fontSize: 10,
		color: "#2E7D32",
		fontWeight: "600",
		marginLeft: 2,
	},
	myDrillBadge: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#FFF3E0",
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 8,
	},
	myDrillBadgeText: {
		fontSize: 10,
		color: "#E65100",
		fontWeight: "600",
		marginLeft: 2,
	},
	descriptionContainer: {
		marginBottom: 8,
	},
	descriptionText: {
		fontSize: 14,
		color: theme.colors.textMuted,
		lineHeight: 20,
	},
	tagsContainer: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 6,
		marginBottom: 8,
	},
	tag: {
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 12,
		backgroundColor: theme.colors.background,
	},
	tagText: {
		fontSize: 12,
		fontWeight: "500",
		color: theme.colors.textSecondary,
	},
	actionButtonsContainer: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	clipboardButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 16,
		paddingVertical: 10,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: theme.colors.primary,
		backgroundColor: "transparent",
		gap: 6,
		alignSelf: "flex-start",
	},
	clipboardButtonActive: {
		backgroundColor: theme.colors.primary,
	},
	clipboardButtonText: {
		fontSize: 14,
		fontWeight: "600",
		color: theme.colors.primary,
	},
	clipboardButtonTextActive: {
		color: theme.colors.white,
	},
	topStarButton: {
		marginRight: 4,
	},
});
