import { useEffect, useState } from "react";
import { useSession } from "../context/SessionContext";
import { supabase } from "../lib/supabase";

type RoleData = {
	role: string | null;
	isAdmin: boolean;
	loading: boolean;
	error: string | null;
};

export function useUserRole(): RoleData {
	const session = useSession();
	const [role, setRole] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchRole = async () => {
			if (!session?.user) {
				setRole(null);
				setLoading(false);
				return;
			}

			setLoading(true);
			setError(null);

			const { data, error } = await supabase
				.from("users")
				.select("role")
				.eq("id", session.user.id)
				.single();

			if (error) {
				setError(error.message);
				setRole(null);
			} else {
				setRole(data?.role ?? null);
			}

			setLoading(false);
		};

		fetchRole();
	}, [session]);

	return {
		role,
		isAdmin: role === "admin",
		loading,
		error,
	};
}
