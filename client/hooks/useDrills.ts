// hooks/useDrills.js
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export const useDrills = () => {
	const [drills, setDrills] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const fetchUserDrills = async () => {
		try {
			setLoading(true);
			setError(null);

			const { data: userData, error: userError } =
				await supabase.auth.getUser();
			if (userError) throw userError;
			if (!userData?.user) throw new Error("No user logged in");

			const { data: drills, error: drillError } = await supabase
				.from("Drill")
				.select("*")
				.eq("user_id", userData.user.id);

				console.log(drills, 'drills')
			if (drillError) throw drillError;

			setDrills(drills || []);
		} catch (err) {
			console.error("Error fetching drills:", err);
			setError(err.message);
			setDrills([]);
		} finally {
			setLoading(false);
		}
	};

	const refreshDrills = () => {
		fetchUserDrills();
	};

	useEffect(() => {
		fetchUserDrills();
	}, []);

	return {
		drills,
		loading,
		error,
		refreshDrills,
		setDrills, // Export setDrills for direct manipulation if needed
	};
};
