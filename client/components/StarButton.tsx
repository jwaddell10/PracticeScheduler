import React, { useState, useRef } from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface StarButtonProps {
	drillId: string;
	initialIsFavorited?: boolean;
	size?: number;
	onToggle?: (drillId: string, isFavorited: boolean) => Promise<void>;
	style?: any;
}

const StarButton: React.FC<StarButtonProps> = ({
	drillId,
	initialIsFavorited = false,
	size = 28,
	onToggle = async () => {},
	style = {},
}) => {
	const [isLoading, setIsLoading] = useState(false);
	const lastClickRef = useRef(0);

	// Remove local state management - rely entirely on prop
	// const [isFavorited, setIsFavorited] = useState(initialIsFavorited);

	const handleToggleFavorite = async () => {
		const now = Date.now();

		// Prevent rapid multiple clicks (debounce)
		if (now - lastClickRef.current < 300) {
			return;
		}
		lastClickRef.current = now;

		// Don't allow clicking while loading
		if (isLoading) {
			return;
		}

		setIsLoading(true);

		try {
			// Call the parent's onToggle function and wait for it to complete
			// The parent will handle state updates
			await onToggle(drillId, !initialIsFavorited);
		} catch (error) {
			console.error("Error toggling favorite:", error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<TouchableOpacity
			style={[styles.starButton, style]}
			onPress={handleToggleFavorite}
			disabled={isLoading}
			activeOpacity={0.7}
		>
			<MaterialIcons
				name={initialIsFavorited ? "star" : "star-border"}
				size={size}
				color={initialIsFavorited ? "#FFD700" : "#999"}
				style={[styles.starIcon, isLoading && styles.loadingIcon]}
			/>
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	starButton: {
		padding: 8,
		justifyContent: "center",
		alignItems: "center",
	},
	starIcon: {
		// Add any additional styling for the icon
	},
	loadingIcon: {
		opacity: 0.6,
	},
});

export default StarButton;
