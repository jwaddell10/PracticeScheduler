import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useSession } from "./SessionContext";

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
	users?: {
		id: string;
		email: string;
		role: string;
	};
}

interface DrillsContextType {
	publicDrills: Drill[];
	userDrills: Drill[];
	loading: boolean;
	error: string | null;
	fetchPublicDrills: () => Promise<void>;
	fetchUserDrills: () => Promise<void>;
	refreshAllDrills: () => Promise<void>;
	addDrill: (drill: Omit<Drill, 'id'>) => Promise<void>;
	updateDrill: (id: string, updates: Partial<Drill>, isAdmin?: boolean) => Promise<void>;
	deleteDrill: (id: string, isAdmin?: boolean) => Promise<void>;
}

const DrillsContext = createContext<DrillsContextType | undefined>(undefined);

export const useDrills = () => {
	const context = useContext(DrillsContext);
	if (!context) {
		throw new Error("useDrills must be used within a DrillsProvider");
	}
	return context;
};

interface DrillsProviderProps {
	children: React.ReactNode;
	initialPublicDrills?: Drill[];
	initialUserDrills?: Drill[];
}

export const DrillsProvider: React.FC<DrillsProviderProps> = ({ 
	children, 
	initialPublicDrills = [], 
	initialUserDrills = [] 
}) => {
	const [publicDrills, setPublicDrills] = useState<Drill[]>(initialPublicDrills);
	const [userDrills, setUserDrills] = useState<Drill[]>(initialUserDrills);
	const [loading, setLoading] = useState(initialPublicDrills.length === 0 && initialUserDrills.length === 0);
	const [error, setError] = useState<string | null>(null);
	const [hasInitialized, setHasInitialized] = useState(initialPublicDrills.length > 0 || initialUserDrills.length > 0);
	const session = useSession();

	const fetchPublicDrills = async () => {
		try {
			setError(null);

			// Set the Supabase session for RLS policies
			if (session) {
				await supabase.auth.setSession({
					access_token: session.access_token,
					refresh_token: session.refresh_token,
				});
			}

			// Query only for public drills
			const { data, error: drillsError } = await supabase
				.from("Drill")
				.select(
					`
          *,
          users!Drill_user_id_fkey (
            id,
            email,
            role
          )
        `
				)
				.eq("isPublic", true)
				.order("name");

			if (drillsError) throw drillsError;

			setPublicDrills(data || []);
		} catch (err) {
			console.error("Error fetching public drills:", err);
			setError(err instanceof Error ? err.message : "Unknown error");
		}
	};

	const fetchUserDrills = async () => {
		try {
			setError(null);

			if (!session?.user?.id) {
				setUserDrills([]);
				return;
			}

			// Set the Supabase session for RLS policies
			await supabase.auth.setSession({
				access_token: session.access_token,
				refresh_token: session.refresh_token,
			});

			// Query for user's drills
			const { data, error: drillsError } = await supabase
				.from("Drill")
				.select(
					`
          *,
          users!Drill_user_id_fkey (
            id,
            email,
            role
          )
        `
				)
				.eq("user_id", session.user.id)
				.order("name");

			if (drillsError) throw drillsError;

			setUserDrills(data || []);
		} catch (err) {
			console.error("Error fetching user drills:", err);
			setError(err instanceof Error ? err.message : "Unknown error");
		}
	};

	const refreshAllDrills = async () => {
		try {
			setLoading(true);
			await Promise.all([fetchPublicDrills(), fetchUserDrills()]);
		} catch (err) {
			console.error("Error refreshing drills:", err);
		} finally {
			setLoading(false);
		}
	};

	const addDrill = async (drill: Omit<Drill, 'id'>) => {
		try {
			const drillWithUser = {
				...drill,
				user_id: session?.user?.id,
			};

			const { data, error: supabaseError } = await supabase
				.from("Drill")
				.insert([drillWithUser])
				.select(
					`
          *,
          users!Drill_user_id_fkey (
            id,
            email,
            role
          )
        `
				);

			if (supabaseError) {
				console.error("Error inserting drill:", supabaseError);
				throw new Error(supabaseError.message);
			}

			// Add the new drill to the appropriate list
			if (data && data.length > 0) {
				const newDrill = data[0];
				if (newDrill.isPublic) {
					setPublicDrills(prev => [...prev, newDrill]);
				} else {
					setUserDrills(prev => [...prev, newDrill]);
				}
			}
		} catch (err) {
			console.error("Error adding drill:", err);
			throw err;
		}
	};

	const updateDrill = async (id: string, updates: Partial<Drill>, isAdmin: boolean = false) => {
		try {
			// Build the query - admins can update any drill, regular users can only update their own
			let query = supabase
				.from("Drill")
				.update(updates)
				.eq("id", id);

			// Only add user_id filter for non-admin users
			if (!isAdmin) {
				query = query.eq("user_id", session?.user?.id);
			}

			const { data, error: supabaseError } = await query
				.select(
					`
          *,
          users!Drill_user_id_fkey (
            id,
            email,
            role
          )
        `
				);

			if (supabaseError) {
				console.error("Error updating drill:", supabaseError);
				throw new Error(supabaseError.message);
			}

			// Update the drill in the appropriate list
			if (data && data.length > 0) {
				const updatedDrill = data[0];
				if (updatedDrill.isPublic) {
					setPublicDrills(prev => prev.map(drill => 
						drill.id === id ? updatedDrill : drill
					));
				} else {
					setUserDrills(prev => prev.map(drill => 
						drill.id === id ? updatedDrill : drill
					));
				}
			}
		} catch (err) {
			console.error("Error updating drill:", err);
			throw err;
		}
	};

	const deleteDrill = async (id: string, isAdmin: boolean = false) => {
		try {
			// Build the query - admins can delete any drill, regular users can only delete their own
			let query = supabase
				.from("Drill")
				.delete()
				.eq("id", id);

			// Only add user_id filter for non-admin users
			if (!isAdmin) {
				query = query.eq("user_id", session?.user?.id);
			}

			const { error: supabaseError } = await query;

			if (supabaseError) {
				console.error("Delete error:", supabaseError.message);
				throw new Error(supabaseError.message);
			}

			// Remove the drill from both lists
			setPublicDrills(prev => prev.filter(drill => drill.id !== id));
			setUserDrills(prev => prev.filter(drill => drill.id !== id));
		} catch (err) {
			console.error("Error deleting drill:", err);
			throw err;
		}
	};

	// Initialize drills when session is available (only if we don't have initial data)
	useEffect(() => {
		if (session?.user?.id && !hasInitialized) {
			refreshAllDrills();
			setHasInitialized(true);
		} else if (!session?.user?.id) {
			// Clear drills when user logs out
			setPublicDrills([]);
			setUserDrills([]);
			setHasInitialized(false);
			setLoading(false);
		}
	}, [session, hasInitialized]);

	const value: DrillsContextType = {
		publicDrills,
		userDrills,
		loading,
		error,
		fetchPublicDrills,
		fetchUserDrills,
		refreshAllDrills,
		addDrill,
		updateDrill,
		deleteDrill,
	};

	return (
		<DrillsContext.Provider value={value}>
			{children}
		</DrillsContext.Provider>
	);
};
