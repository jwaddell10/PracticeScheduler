import React, { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "./SessionContext";
import { supabase } from "../lib/supabase";

type UserRoleContextType = {
	isSubscriber: boolean;
	isAdmin: boolean;
	loading: boolean;
	error: string | null;
	refreshSubscription: () => Promise<void>;
};

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

export function UserRoleProvider({ children }: { children: React.ReactNode }) {
	const session = useSession();
	const [isSubscriber, setIsSubscriber] = useState<boolean>(false);
	const [isAdmin, setIsAdmin] = useState<boolean>(false);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const checkUserRole = async () => {
		if (!session?.user) {
			setIsSubscriber(false);
			setIsAdmin(false);
			setLoading(false);
			return;
		}

		setLoading(true);
		setError(null);

		try {
			// Check user role from database
			const { data: userData, error: userError } = await supabase
				.from("users")
				.select("role")
				.eq("id", session.user.id)
				.single();

			if (userError) {
				console.warn('Failed to fetch user role:', userError);
				setIsAdmin(false);
			} else {
				setIsAdmin(userData?.role === "admin");
			}

			// Check subscription status from subscriptions table
			const { data: subscriptionData, error: subscriptionError } = await supabase
				.from("subscriptions")
				.select("*")
				.eq("user_id", session.user.id)
				.single();

			if (subscriptionError && subscriptionError.code !== 'PGRST116') {
				// PGRST116 is "not found" error, which is expected for non-subscribers
				console.warn('Failed to fetch subscription:', subscriptionError);
				setIsSubscriber(false);
			} else {
				// User has a subscription record, so they're a subscriber
				// Also check if they're admin (admins get subscriber access too)
				setIsSubscriber(!!subscriptionData || userData?.role === "admin");
			}
		} catch (err) {
			console.error('Failed to check user role and subscription:', err);
			setError(err instanceof Error ? err.message : "Unknown error");
			setIsSubscriber(false);
			setIsAdmin(false);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		checkUserRole();
	}, [session]);

	const value = {
		isSubscriber,
		isAdmin,
		loading,
		error,
		refreshSubscription: checkUserRole,
	};

	return (
		<UserRoleContext.Provider value={value}>
			{children}
		</UserRoleContext.Provider>
	);
}

export function useSubscription(): UserRoleContextType {
	const context = useContext(UserRoleContext);
	if (context === undefined) {
		throw new Error("useSubscription must be used within a UserRoleProvider");
	}
	return context;
}
