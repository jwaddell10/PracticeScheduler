import React, { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "./SessionContext";
import { checkSubscriptionStatus } from "../util/checkSubscriptionStatus";

type SubscriptionCheckContextType = {
	subscriptionCheckResult: any;
	loading: boolean;
	error: string | null;
	refreshSubscriptionCheck: () => Promise<void>;
};

const SubscriptionCheckContext = createContext<SubscriptionCheckContextType | undefined>(undefined);

export function SubscriptionCheckProvider({ children }: { children: React.ReactNode }) {
	const session = useSession();
	const [subscriptionCheckResult, setSubscriptionCheckResult] = useState<any>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const runSubscriptionCheck = async () => {
		if (!session?.user?.id) {
			setSubscriptionCheckResult(null);
			setError(null);
			return;
		}

		setLoading(true);
		setError(null);

		try {
			console.log('🔄 Running subscription check from context');
			const result = await checkSubscriptionStatus(session.user.id);
			setSubscriptionCheckResult(result);
		} catch (err) {
			console.error('Failed to check subscription status:', err);
			setError(err instanceof Error ? err.message : "Unknown error");
		} finally {
			setLoading(false);
		}
	};

	// Run subscription check when session changes
	useEffect(() => {
		if (session?.user?.id) {
			runSubscriptionCheck();
		}
	}, [session?.user?.id]);

	// Listen for subscription update events
	useEffect(() => {
		const handleSubscriptionUpdate = () => {
			console.log('🔄 Subscription update event received - running check from context');
			runSubscriptionCheck();
		};

		window.addEventListener('subscriptionUpdated', handleSubscriptionUpdate);

		return () => {
			window.removeEventListener('subscriptionUpdated', handleSubscriptionUpdate);
		};
	}, [session?.user?.id]);

	const value = {
		subscriptionCheckResult,
		loading,
		error,
		refreshSubscriptionCheck: runSubscriptionCheck,
	};

	return (
		<SubscriptionCheckContext.Provider value={value}>
			{children}
		</SubscriptionCheckContext.Provider>
	);
}

export function useSubscriptionCheck(): SubscriptionCheckContextType {
	const context = useContext(SubscriptionCheckContext);
	if (context === undefined) {
		throw new Error("useSubscriptionCheck must be used within a SubscriptionCheckProvider");
	}
	return context;
}
