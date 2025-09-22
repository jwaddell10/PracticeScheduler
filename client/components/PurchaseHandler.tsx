import React, { useEffect } from 'react';
import { addPurchaseListener } from '../lib/revenueCat';
import { useSubscription } from '../context/UserRoleContext';
/**
 * Component that handles RevenueCat purchase events and automatically
 * refreshes subscription status to show premium content immediately
 */
export default function PurchaseHandler() {
    const { refreshSubscription } = useSubscription();
    
	useEffect(() => {
		// Set up purchase listener to automatically refresh subscription status
		const handlePurchaseSuccess = async () => {
			console.log('🛒 Purchase completed - refreshing subscription status...');
			
			// Wait a moment for RevenueCat to process the purchase
			setTimeout(async () => {
				try {
					await refreshSubscription();
					console.log('✅ Subscription status refreshed after purchase');
				} catch (error) {
					console.error('❌ Failed to refresh subscription after purchase:', error);
				}
			}, 2000); // 2 second delay to allow RevenueCat processing
		};

		// Add the purchase listener
		addPurchaseListener(handlePurchaseSuccess);

		// Cleanup function (though RevenueCat listeners don't need explicit cleanup)
		return () => {
			// RevenueCat doesn't provide a way to remove listeners, but that's okay
			// as this component will be mounted for the app's lifetime
		};
	}, [refreshSubscription]);

	// This component doesn't render anything
	return null;
}
