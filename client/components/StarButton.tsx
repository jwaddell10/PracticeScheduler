import React, { useState, useEffect, useRef } from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { supabase } from "../lib/supabase"; // Adjust path as needed

const StarButton = ({
	drillId,
	initialIsFavorited = false,
	size = 24,
	onToggle = () => {},
	style = {},
}) => {
	const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
	const [isLoading, setIsLoading] = useState(false);
	const timeoutRef = useRef(null);
	const lastClickRef = useRef(0);

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	const handleToggleFavorite = async () => {
		const now = Date.now();

		// Prevent rapid multiple clicks (debounce)
		if (now - lastClickRef.current < 300) {
			return;
		}
		lastClickRef.current = now;

		// Clear any existing timeout
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}

		// Optimistic update
		const previousState = isFavorited;
		setIsFavorited(!isFavorited);
		setIsLoading(true);

		try {
			// Get current user
			const {
				data: { user },
				error: userError,
			} = await supabase.auth.getUser();
			if (userError || !user) {
				throw new Error("User not authenticated");
			}

			// Get current favorite drills
			const { data: userData, error: fetchError } = await supabase
				.from("users")
				.select("favoriteDrills")
				.eq("id", user.id)
				.single();
			if (fetchError) {
				throw new Error(
					`Failed to fetch user data: ${fetchError.message}`
				);
			}

			const currentFavorites = userData?.favoriteDrills || [];
			let updatedFavorites;

			if (!previousState) {
				// Adding to favorites
				updatedFavorites = [...currentFavorites, drillId];
			} else {
				// Removing from favorites
				updatedFavorites = currentFavorites.filter(
					(id) => id !== drillId
				);
			}

			// Update the user's favorite drills
			const { error: updateError } = await supabase
				.from("users")
				.update({ favoriteDrills: updatedFavorites })
				.eq("id", user.id);

			if (updateError) {
				throw new Error(
					`Failed to update favorites: ${updateError.message}`
				);
			}

			// Call the callback to notify parent component
			onToggle(drillId, !previousState);
		} catch (error) {
			console.error("Error toggling favorite:", error);

			// Revert optimistic update on error
			setIsFavorited(previousState);

			// You could show a toast/alert here
			// Alert.alert('Error', 'Failed to update favorite. Please try again.');
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
			<AntDesign
				name={isFavorited ? "star" : "staro"}
				size={size}
				color={isFavorited ? "#FFD700" : "#999"}
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
