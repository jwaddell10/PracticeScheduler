import React, { createContext, useContext, useState, useEffect } from "react";
import Purchases from "react-native-purchases";
import { useSession } from "./SessionContext";
import { supabase } from "../lib/supabase";

type SubscriptionContextType = {
	isSubscriber: boolean;
	isAdmin: boolean;
	loading: boolean;
	error: string | null;
	checkSubscription: () => Promise<void>;
	refreshSubscription: () => Promise<void>;
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
	undefined
);

export function SubscriptionProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = useSession();
	const [isSubscriber, setIsSubscriber] = useState(false);
	const [isAdmin, setIsAdmin] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const checkSubscription = async () => {
		try {
			setLoading(true);
			setError(null);

			console.log(
				"🔍 SubscriptionContext: Checking subscription and admin status..."
			);

			// Check admin status from Supabase users table
			let adminStatus = false;
			if (session?.user?.id) {
				try {
					const { data: userData, error: userError } = await supabase
						.from('users')
						.select('role')
						.eq('id', session.user.id)
						.single();

					if (userError) {
						console.error('❌ SubscriptionContext: Error fetching user role:', userError);
					} else {
						adminStatus = userData?.role === 'admin';
						console.log('🔍 SubscriptionContext: Admin check result:', {
							userId: session.user.id,
							userRole: userData?.role,
							isAdmin: adminStatus
						});
					}
				} catch (adminError) {
					console.error('❌ SubscriptionContext: Error checking admin status:', adminError);
				}
			}

			// Get customer info from RevenueCat
			const customerInfo = await Purchases.getCustomerInfo();
			console.log("🔍 SubscriptionContext: Customer info received:", {
				originalAppUserId: customerInfo.originalAppUserId,
				activeSubscriptions: customerInfo.activeSubscriptions,
				entitlements: customerInfo.entitlements,
			});

			// Check if user has the 'default' entitlement (or any active entitlement)
			const hasDefaultEntitlement =
				typeof customerInfo.entitlements.active["default"] !==
				"undefined";
			const hasAnyEntitlement =
				Object.keys(customerInfo.entitlements.active).length > 0;

			// User is considered a subscriber if they have any active entitlement OR if they're an admin
			const subscriberStatus = (hasDefaultEntitlement || hasAnyEntitlement) || adminStatus;

			console.log("🔍 SubscriptionContext: Subscription check result:", {
				hasDefaultEntitlement,
				hasAnyEntitlement,
				isSubscriber: subscriberStatus,
				isAdmin: adminStatus,
			});

			setIsSubscriber(subscriberStatus);
			setIsAdmin(adminStatus);
		} catch (error) {
			console.error(
				"❌ SubscriptionContext: Error checking subscription:",
				error
			);
			setError(
				error instanceof Error
					? error.message
					: "Failed to check subscription"
			);
			setIsSubscriber(false);
			setIsAdmin(false);
		} finally {
			setLoading(false);
		}
	};

	const refreshSubscription = async () => {
		console.log("🔄 SubscriptionContext: Refreshing subscription...");
		await checkSubscription();
	};

	// Check subscription when session changes
	useEffect(() => {
		if (session?.user?.id) {
			console.log(
				"🔄 SubscriptionContext: Session detected, checking subscription for user:",
				session.user.id
			);
			checkSubscription();
		} else {
			console.log(
				"🔄 SubscriptionContext: No session, setting isSubscriber and isAdmin to false"
			);
			setIsSubscriber(false);
			setIsAdmin(false);
		}
	}, [session?.user?.id]);

	// Add RevenueCat listener for real-time updates
	useEffect(() => {
		const handleCustomerInfoUpdate = (customerInfo: any) => {
			console.log(
				"🔄 SubscriptionContext: Customer info updated via listener:",
				customerInfo
			);
			checkSubscription();
		};

		// Add the listener
		Purchases.addCustomerInfoUpdateListener(handleCustomerInfoUpdate);

		// Cleanup function (though RevenueCat handles this automatically)
		return () => {
			// RevenueCat automatically removes listeners
		};
	}, []);

	const value = {
		isSubscriber,
		isAdmin,
		loading,
		error,
		checkSubscription,
		refreshSubscription,
	};

	return (
		<SubscriptionContext.Provider value={value}>
			{children}
		</SubscriptionContext.Provider>
	);
}

export function useSubscription() {
	const context = useContext(SubscriptionContext);
	if (context === undefined) {
		throw new Error(
			"useSubscription must be used within a SubscriptionProvider"
		);
	}
	return context;
}
