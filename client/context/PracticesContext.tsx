import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Alert } from "react-native";
import { useSession } from "./SessionContext";

interface Practice {
	id: string;
	title?: string;
	startTime: string;
	endTime: string;
	drills: string[];
	practiceDuration?: number;
	notes?: string;
	teamId: string;
	user_id?: string; // Add user_id field
}

interface PracticesContextType {
	practices: Practice[];
	loading: boolean;
	error: string | null;
	fetchPractices: () => Promise<void>;
	addPractice: (practice: Omit<Practice, 'id'>) => Promise<Practice | null>;
	updatePractice: (id: string, updates: Partial<Practice>) => Promise<void>;
	deletePractice: (id: string) => Promise<void>;
	refreshPractices: () => Promise<void>;
}

const PracticesContext = createContext<PracticesContextType | undefined>(undefined);

export const usePractices = () => {
	const context = useContext(PracticesContext);
	if (context === undefined) {
		throw new Error("usePractices must be used within a PracticesProvider");
	}
	return context;
};

interface PracticesProviderProps {
	children: React.ReactNode;
	initialPractices?: Practice[];
}

export const PracticesProvider: React.FC<PracticesProviderProps> = ({ children, initialPractices = [] }) => {
	const [practices, setPractices] = useState<Practice[]>(initialPractices);
	const [loading, setLoading] = useState(initialPractices.length === 0);
	const [error, setError] = useState<string | null>(null);
	const [hasInitialized, setHasInitialized] = useState(initialPractices.length > 0);
	const session = useSession();

	const fetchPractices = async () => {
		try {
			setLoading(true);
			setError(null);
			
			// Don't fetch if no session
			if (!session?.user?.id) {
				setPractices([]);
				return;
			}

			// Set the Supabase session for RLS policies
			await supabase.auth.setSession({
				access_token: session.access_token,
				refresh_token: session.refresh_token,
			});
			
			const { data, error: supabaseError } = await supabase
				.from("Practice")
				.select("id, title, startTime, endTime, drills, practiceDuration, notes, teamId, user_id")
				.eq("user_id", session.user.id) // Filter by current user
				.order("startTime", { ascending: true });

			if (supabaseError) {
				console.error("Supabase error:", supabaseError.message);
				setError("Failed to fetch practices.");
				Alert.alert("Error", "Failed to fetch practices.");
			} else {
				setPractices(data || []);
			}
		} catch (err) {
			console.error("Error fetching practices:", err);
			setError("Failed to fetch practices.");
		} finally {
			setLoading(false);
		}
	};

	const addPractice = async (practice: Omit<Practice, 'id'>) => {
		try {
			// Add user_id to the practice
			const practiceWithUser = {
				...practice,
				user_id: session?.user?.id
			};

			const { data, error: supabaseError } = await supabase
				.from("Practice")
				.insert([practiceWithUser])
				.select();

			if (supabaseError) {
				console.error("Error inserting practice:", supabaseError);
				throw new Error(supabaseError.message);
			}

			// Add the new practice to the local state
			if (data && data.length > 0) {
				setPractices(prev => [...prev, data[0]]);
				return data[0]; // Return the created practice
			}
			return null;
		} catch (err) {
			console.error("Error adding practice:", err);
			throw err;
		}
	};

	const updatePractice = async (id: string, updates: Partial<Practice>) => {
		try {
			const { data, error: supabaseError } = await supabase
				.from("Practice")
				.update(updates)
				.eq("id", id)
				.eq("user_id", session?.user?.id) // Ensure user can only update their own practices
				.select();

			if (supabaseError) {
				console.error("Error updating practice:", supabaseError);
				throw new Error(supabaseError.message);
			}

			// Update the practice in local state
			if (data && data.length > 0) {
				setPractices(prev => prev.map(practice => 
					practice.id === id ? { ...practice, ...data[0] } : practice
				));
			}
		} catch (err) {
			console.error("Error updating practice:", err);
			throw err;
		}
	};

	const deletePractice = async (id: string) => {
		try {
			const { error: supabaseError } = await supabase
				.from("Practice")
				.delete()
				.eq("id", id)
				.eq("user_id", session?.user?.id); // Ensure user can only delete their own practices

			if (supabaseError) {
				console.error("Delete error:", supabaseError.message);
				throw new Error(supabaseError.message);
			}

			// Remove the practice from local state
			setPractices(prev => prev.filter(practice => practice.id !== id));
		} catch (err) {
			console.error("Error deleting practice:", err);
			throw err;
		}
	};

	const refreshPractices = async () => {
		await fetchPractices();
	};

	// Initialize practices when session is available (only if we don't have initial data)
	useEffect(() => {
		if (session?.user?.id && !hasInitialized) {
			fetchPractices();
			setHasInitialized(true);
		} else if (!session?.user?.id) {
			// Clear practices when user logs out
			setPractices([]);
			setHasInitialized(false);
			setLoading(false);
		}
	}, [session, hasInitialized]);

	const value: PracticesContextType = {
		practices,
		loading,
		error,
		fetchPractices,
		addPractice,
		updatePractice,
		deletePractice,
		refreshPractices,
	};

	return (
		<PracticesContext.Provider value={value}>
			{children}
		</PracticesContext.Provider>
	);
};
