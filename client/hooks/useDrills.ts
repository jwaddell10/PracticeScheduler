// hooks/useDrills.js
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useSession } from "../context/SessionContext";

export function useDrills() {
	const [drills, setDrills] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const session = useSession();

	const fetchPublicDrills = async () => {
		try {
			setLoading(true);
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

			setDrills(data || []);
		} catch (err) {
			console.error("Error fetching public drills:", err);
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	const fetchUserDrills = async () => {
		try {
			setLoading(true);
			setError(null);

			if (!session?.user?.id) {
				setDrills([]);
				return;
			}

			// Set the Supabase session for RLS policies
			if (session) {
				await supabase.auth.setSession({
					access_token: session.access_token,
					refresh_token: session.refresh_token,
				});
			}

			// Query only for current user's drills
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

			setDrills(data || []);
		} catch (err) {
			console.error("Error fetching user drills:", err);
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	// Default to fetching public drills
	const fetchDrills = fetchPublicDrills;

	useEffect(() => {
		fetchDrills();
	}, [session?.user?.id]);

	return {
		drills,
		loading,
		error,
		refreshDrills: fetchDrills,
		fetchPublicDrills,
		fetchUserDrills,
	};
}
