// hooks/useDrills.js
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useSession } from "../context/SessionContext";

export function useDrills() {
	const [drills, setDrills] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const session = useSession();

	const fetchDrills = async () => {
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

			// 1. Get the current user's role
			const { data: userData, error: userError } = await supabase
				.from("users")
				.select("role")
				.eq("id", session.user.id)
				.maybeSingle();

			if (userError) throw userError;

			let query = supabase
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
				.order("name");

			if (userData?.role === "admin") {
				// Admins can see all drills - no additional filtering needed
			} else {
				// Non-admin users can see:
				// 1. Their own drills (user_id = session.user.id)
				// 2. Public drills (isPublic = true)

				// Apply OR conditions: Own drills OR public drills
				query = query.or(
					`user_id.eq.${session.user.id},isPublic.eq.true`
				);
			}

			// 4. Run final query
			const { data, error: drillsError } = await query;
			if (drillsError) throw drillsError;

			setDrills(data || []);
		} catch (err) {
			console.error("Error fetching drills:", err);
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchDrills();
	}, [session?.user?.id]);

	return { drills, loading, error, refreshDrills: fetchDrills };
}
