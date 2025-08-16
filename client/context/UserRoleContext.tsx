import React, { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "./SessionContext";
import { supabase } from "../lib/supabase";

type UserRoleContextType = {
	role: string | null;
	isAdmin: boolean;
	loading: boolean;
	error: string | null;
};

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

export function UserRoleProvider({ children }: { children: React.ReactNode }) {
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

			try {
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
			} catch (err) {
				setError(err instanceof Error ? err.message : "Unknown error");
				setRole(null);
			} finally {
				setLoading(false);
			}
		};

		fetchRole();
	}, [session]);

	const value = {
		role,
		isAdmin: role === "admin",
		loading,
		error,
	};

	return (
		<UserRoleContext.Provider value={value}>
			{children}
		</UserRoleContext.Provider>
	);
}

export function useUserRole(): UserRoleContextType {
	const context = useContext(UserRoleContext);
	if (context === undefined) {
		throw new Error("useUserRole must be used within a UserRoleProvider");
	}
	return context;
}
