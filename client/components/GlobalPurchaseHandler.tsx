import React, { useEffect } from 'react';
import { addPurchaseListener } from '../lib/revenueCat';
import { useSubscription } from '../context/SubscriptionContext';
import Purchases from 'react-native-purchases';

/**
 * Global component that handles RevenueCat purchase events and automatically
 * refreshes subscription status across all components
 */
export default function GlobalPurchaseHandler() {
    const { checkRevenueCatStatus, checkRevenueCatDirectly } = useSubscription();
    
    useEffect(() => {
        // Set up purchase listener to automatically refresh subscription status
        const handlePurchaseSuccess = async () => {
            console.log('🛒 GlobalPurchaseHandler: Purchase completed - checking RevenueCat status...');
            
            try {
                // Check RevenueCat status immediately using direct method
                await checkRevenueCatDirectly();
                console.log('✅ GlobalPurchaseHandler: RevenueCat status checked successfully');
                
                // Also trigger the event for any components that might be listening
                window.dispatchEvent(new Event('subscriptionUpdated'));
            } catch (error) {
                console.error('❌ GlobalPurchaseHandler: Failed to check RevenueCat status:', error);
            }
        };

        // Add the purchase listener
        addPurchaseListener(handlePurchaseSuccess);

        // Add RevenueCat customer info update listener for real-time updates
        Purchases.addCustomerInfoUpdateListener((customerInfo) => {
            console.log('🛒 GlobalPurchaseHandler: RevenueCat customer info updated:', customerInfo);
            
            // Trigger the event for components to update
            window.dispatchEvent(new Event('subscriptionUpdated'));
        });

        // Note: RevenueCat listeners are automatically cleaned up when the app is destroyed
        // No explicit cleanup needed
    }, [checkRevenueCatDirectly]);

    // This component doesn't render anything
    return null;
}
