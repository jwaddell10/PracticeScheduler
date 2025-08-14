import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

interface Drill {
	id: string;
	name: string;
	skillFocus?: any;
	type?: any;
	difficulty?: any;
	duration?: number;
	notes?: string;
	imageUrl?: string;
	user_id?: string;
	isPublic?: boolean;
}

interface FavoritesContextType {
	favoriteDrills: Drill[];
	favoriteDrillIds: Set<string>;
	loading: boolean;
	error: string | null;
	handleFavoriteToggle: (drillId: string, isFavorited: boolean) => Promise<void>;
	refreshFavorites: () => void;
	setFavoriteDrills: React.Dispatch<React.SetStateAction<Drill[]>>;
}

export const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [favoriteDrills, setFavoriteDrills] = useState<Drill[]>([]);
	const [favoriteDrillIds, setFavoriteDrillIds] = useState<Set<string>>(new Set());
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchFavorites = async () => {
		try {
			setLoading(true);
			setError(null);

			// Get current user
			const {
				data: { user },
				error: userError,
			} = await supabase.auth.getUser();
			if (userError || !user) {
				console.log("No user authenticated");
				setFavoriteDrills([]);
				setFavoriteDrillIds(new Set());
				return;
			}

			// Get user's favorite drill IDs
			const { data: userData, error: fetchError } = await supabase
				.from("users")
				.select("favoriteDrills")
				.eq("id", user.id)
				.maybeSingle();

			if (fetchError) {
				throw fetchError;
			}

			const favoriteIds = userData?.favoriteDrills || [];
			setFavoriteDrillIds(new Set(favoriteIds));

			// If there are favorite drill IDs, fetch the full drill data
			if (favoriteIds.length > 0) {
				const { data: drillsData, error: drillsError } = await supabase
					.from("Drill")
					.select("*")
					.in("id", favoriteIds);

				if (drillsError) {
					throw drillsError;
				}

				setFavoriteDrills(drillsData || []);
			} else {
				setFavoriteDrills([]);
			}
		} catch (err) {
			console.error("Error fetching favorites:", err);
			setError(err instanceof Error ? err.message : "Unknown error");
			setFavoriteDrills([]);
			setFavoriteDrillIds(new Set());
		} finally {
			setLoading(false);
		}
	};

	const handleFavoriteToggle = async (drillId: string, isFavorited: boolean) => {
		try {
			// Calculate the new IDs array first
			const currentIds = Array.from(favoriteDrillIds);
			const updatedIds = isFavorited
				? [...currentIds, drillId]
				: currentIds.filter((id) => id !== drillId);

			// Update local state immediately for better UX
			const newFavoriteIdsSet = new Set(updatedIds);
			setFavoriteDrillIds(newFavoriteIdsSet);

			// Update the drills array
			if (isFavorited) {
				// Fetch the drill data and add it to favorites
				const { data: drillData, error: drillError } = await supabase
					.from("Drill")
					.select("*")
					.eq("id", drillId)
					.single();

				if (!drillError && drillData) {
					setFavoriteDrills((prev) => [...prev, drillData]);
				}
			} else {
				// Remove from favorites array
				setFavoriteDrills((prev) =>
					prev.filter((drill) => drill.id !== drillId)
				);
			}

			// Update the database
			const {
				data: { user },
			} = await supabase.auth.getUser();

			if (user) {
				const { error: updateError } = await supabase
					.from("users")
					.update({ favoriteDrills: updatedIds })
					.eq("id", user.id);

				if (updateError) {
					console.error(
						"Error updating favorites in database:",
						updateError
					);
					// Revert local state on error
					fetchFavorites();
				}
			}
		} catch (err) {
			console.error("Error toggling favorite:", err);
			// Revert local state on error
			fetchFavorites();
		}
	};

	const refreshFavorites = () => {
		fetchFavorites();
	};

	useEffect(() => {
		fetchFavorites();
	}, []);

	const value = {
		favoriteDrills,
		favoriteDrillIds,
		loading,
		error,
		handleFavoriteToggle,
		refreshFavorites,
		setFavoriteDrills,
	};

	return (
		<FavoritesContext.Provider value={value}>
			{children}
		</FavoritesContext.Provider>
	);
};

// Custom hook to use the context
export const useFavorites = () => {
	const context = useContext(FavoritesContext);
	if (!context) {
		throw new Error("useFavorites must be used within a FavoritesProvider");
	}
	return context;
};
