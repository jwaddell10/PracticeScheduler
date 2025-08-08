// hooks/useDrills.js - Modified to include admin drills
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase"; // Adjust import path as needed
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

			// Get current user's role
			const { data: userData, error: userError } = await supabase
				.from("users")
				.select("role")
				.eq("id", session.user.id)
				.single();

			if (userError) {
				throw userError;
			}

			let query = supabase.from("Drill").select(`
          *,
          users!Drill_user_id_fkey (
            id,
            email,
            role
          )
        `);

			// If user is admin, they see all drills
			// If user is not admin, they see:
			// 1. Their own drills
			// 2. Drills created by admin users
			if (userData.role !== "admin") {
				query = query.or(
					`user_id.eq.${session.user.id},users.role.eq.admin`
				);
			}

			const { data, error: drillsError } = await query.order("name");

			if (drillsError) {
				throw drillsError;
			}

			setDrills(data || []);
		} catch (err) {
			console.error("Error fetching drills:", err);
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	const refreshDrills = () => {
		fetchDrills();
	};

	useEffect(() => {
		fetchDrills();
	}, [session?.user?.id]);

	return {
		drills,
		loading,
		error,
		refreshDrills,
	};
}

// Alternative approach if the above query doesn't work with your Supabase setup
export function useDrillsAlternative() {
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

			// First, get current user's role
			const { data: userData, error: userError } = await supabase
				.from("users")
				.select("role")
				.eq("id", session.user.id)
				.single();

			if (userError) {
				throw userError;
			}

			// Then get admin user IDs
			const { data: adminUsers, error: adminError } = await supabase
				.from("users")
				.select("id")
				.eq("role", "admin");

			if (adminError) {
				throw adminError;
			}

			const adminUserIds = adminUsers.map((user) => user.id);

			let query = supabase.from("Drill").select(`
          *,
          users!Drill_user_id_fkey (
            id,
            email,
            role
          )
        `);

			// If user is admin, they see all drills
			if (userData.role === "admin") {
				// Admin sees all drills - no filter needed
			} else {
				// Non-admin users see their own drills + admin drills
				const allowedUserIds = [session.user.id, ...adminUserIds];
				query = query.in("user_id", allowedUserIds);
			}

			const { data, error: drillsError } = await query.order("name");

			if (drillsError) {
				throw drillsError;
			}

			setDrills(data || []);
		} catch (err) {
			console.error("Error fetching drills:", err);
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	const refreshDrills = () => {
		fetchDrills();
	};

	useEffect(() => {
		fetchDrills();
	}, [session?.user?.id]);

	return {
		drills,
		loading,
		error,
		refreshDrills,
	};
}
