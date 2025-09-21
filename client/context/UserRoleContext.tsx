import React, { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "./SessionContext";
import { supabase } from "../lib/supabase";

type UserRoleContextType = {
	isSubscriber: boolean;
	isAdmin: boolean;
	subscriptionStatus: 'active' | 'expired' | 'none';
	loading: boolean;
	error: string | null;
	refreshSubscription: () => Promise<void>;
};

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

export function UserRoleProvider({ children }: { children: React.ReactNode }) {
	const session = useSession();
	const [isSubscriber, setIsSubscriber] = useState<boolean>(false);
	const [isAdmin, setIsAdmin] = useState<boolean>(false);
	const [subscriptionStatus, setSubscriptionStatus] = useState<'active' | 'expired' | 'none'>('none');
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const checkUserRole = async () => {
		if (!session?.user) {
			setIsSubscriber(false);
			setIsAdmin(false);
			setSubscriptionStatus('none');
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
				.maybeSingle();
			if (subscriptionError && subscriptionError.code !== 'PGRST116') {
				// PGRST116 is "not found" error, which is expected for non-subscribers
				console.warn('Failed to fetch subscription:', subscriptionError);
				setIsSubscriber(false);
				setSubscriptionStatus('none');
			} else if (subscriptionData) {
				// Check if subscription is active or expired based on expires_at
				const now = new Date();
				const expiresAt = new Date(subscriptionData.expires_at);
				
				if (expiresAt > now && subscriptionData.status === 'active') {
					setSubscriptionStatus('active');
					setIsSubscriber(true);
				} else {
					setSubscriptionStatus('expired');
					setIsSubscriber(false);
				}
			} else {
				// No subscription found
				setSubscriptionStatus('none');
				setIsSubscriber(false);
			}

			// Admins always get subscriber access regardless of subscription status
			if (userData?.role === "admin") {
				setIsSubscriber(true);
			}
		} catch (err) {
			console.error('Failed to check user role and subscription:', err);
			setError(err instanceof Error ? err.message : "Unknown error");
			setIsSubscriber(false);
			setIsAdmin(false);
			setSubscriptionStatus('none');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		checkUserRole();
	}, [session]);

	// Listen for purchase events to refresh subscription status
	useEffect(() => {
		const handleSubscriptionUpdate = async () => {
			console.log('🔄 Subscription update event received - refreshing status');
			
			// Retry logic with delays
			let attempts = 0;
			const maxAttempts = 3;
			
			const retryCheck = async () => {
				attempts++;
				console.log(`🔄 Attempt ${attempts}/${maxAttempts} to check subscription status`);
				
				await checkUserRole();
				
				// If still not a subscriber and we haven't reached max attempts, retry
				if (!isSubscriber && attempts < maxAttempts) {
					console.log(`⏳ Subscription not found yet, retrying in 2 seconds...`);
					setTimeout(retryCheck, 2000);
				} else if (isSubscriber) {
					console.log('✅ Subscription status updated successfully!');
				} else {
					console.log('❌ Subscription still not found after all attempts');
				}
			};
			
			retryCheck();
		};

		// Listen for subscription update events
		window.addEventListener('subscriptionUpdated', handleSubscriptionUpdate);

		return () => {
			window.removeEventListener('subscriptionUpdated', handleSubscriptionUpdate);
		};
	}, []);

	const value = {
		isSubscriber,
		isAdmin,
		subscriptionStatus,
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
