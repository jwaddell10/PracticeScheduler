import React, { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "./SessionContext";
import { getSubscriptionInfo } from "../lib/revenueCat";

type UserRoleContextType = {
	isPremium: boolean;
	loading: boolean;
	error: string | null;
	refreshSubscription: () => Promise<void>;
};

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

export function UserRoleProvider({ children }: { children: React.ReactNode }) {
	const session = useSession();
	const [isPremium, setIsPremium] = useState<boolean>(false);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const checkSubscription = async () => {
		if (!session?.user) {
			setIsPremium(false);
			setLoading(false);
			return;
		}

		setLoading(true);
		setError(null);

		try {
			// Check RevenueCat directly for active subscription
			console.log('Checking RevenueCat subscription status...');
			const subscriptionInfo = await getSubscriptionInfo();
			
			console.log('RevenueCat subscription check result:', {
				hasActivePremium: subscriptionInfo.hasActivePremium,
				subscriptionStatus: subscriptionInfo.subscriptionStatus,
				expiresAt: subscriptionInfo.expiresAt
			});
			
			setIsPremium(subscriptionInfo.hasActivePremium);
		} catch (err) {
			console.error('Failed to check subscription status:', err);
			setError(err instanceof Error ? err.message : "Unknown error");
			setIsPremium(false);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		checkSubscription();
	}, [session]);

	const value = {
		isPremium,
		loading,
		error,
		refreshSubscription: checkSubscription,
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
