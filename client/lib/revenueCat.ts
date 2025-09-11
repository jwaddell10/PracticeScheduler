import Purchases, { PurchasesOffering, CustomerInfo } from 'react-native-purchases';
import Constants from 'expo-constants';

let isInitialized = false;

// Initialize RevenueCat SDK
export const initializeRevenueCat = async () => {
  try {
    // If already initialized, return true
    if (isInitialized) {
      console.log('RevenueCat already initialized');
      return true;
    }

    // Get your RevenueCat API key from environment variables
    const apiKey = "appl_VTApErVWbdFRrWEYqfslhIgvWub";
    
    console.log('RevenueCat initialization - API Key found:', !!apiKey);
    console.log('RevenueCat initialization - API Key length:', apiKey?.length);
    
    if (!apiKey) {
      console.warn('RevenueCat API key not found. Please add REVENUECAT_API_KEY to your environment variables.');
      console.log('Available extra config keys:', Object.keys(Constants.expoConfig?.extra || {}));
      return false;
    }

    // Configure RevenueCat
    Purchases.configure({
      apiKey: apiKey,
      appUserID: null, // Will be set when user logs in
    });

    console.log('RevenueCat SDK initialized successfully');
    isInitialized = true;
    return true;
  } catch (error) {
    console.error('Failed to initialize RevenueCat SDK:', error);
    return false;
  }
};

// Set user ID when user logs in
export const setRevenueCatUser = async (userId: string) => {
  try {
    // Ensure RevenueCat is initialized first
    if (!isInitialized) {
      console.log('RevenueCat not initialized, initializing before setting user...');
      const initResult = await initializeRevenueCat();
      if (!initResult) {
        console.error('Failed to initialize RevenueCat before setting user');
        return;
      }
    }

    await Purchases.logIn(userId);
    console.log('RevenueCat user set:', userId);
  } catch (error) {
    console.error('Failed to set RevenueCat user:', error);
  }
};

// Get current offerings
export const getOfferings = async (): Promise<PurchasesOffering | null> => {
  try {
    // Ensure RevenueCat is initialized
    if (!isInitialized) {
      console.warn('RevenueCat not initialized, attempting to initialize...');
      const initResult = await initializeRevenueCat();
      if (!initResult) {
        console.error('Failed to initialize RevenueCat for getOfferings');
        return null;
      }
    }
    
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (error) {
    console.error('Failed to get offerings:', error);
    return null;
  }
};

// Get customer info
export const getCustomerInfo = async (): Promise<CustomerInfo | null> => {
  try {
    // Ensure RevenueCat is initialized
    if (!isInitialized) {
      console.warn('RevenueCat not initialized, attempting to initialize...');
      const initResult = await initializeRevenueCat();
      if (!initResult) {
        console.error('Failed to initialize RevenueCat for getCustomerInfo');
        return null;
      }
    }

    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo;
  } catch (error) {
    console.error('Failed to get customer info:', error);
    return null;
  }
};

// Purchase a package
export const purchasePackage = async (packageToPurchase: any) => {
  try {
    // Ensure RevenueCat is initialized
    if (!isInitialized) {
      console.warn('RevenueCat not initialized, attempting to initialize...');
      const initResult = await initializeRevenueCat();
      if (!initResult) {
        throw new Error('Failed to initialize RevenueCat for purchase');
      }
    }

    const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
    return customerInfo;
  } catch (error) {
    console.error('Failed to purchase package:', error);
    throw error;
  }
};

// Restore purchases
export const restorePurchases = async (): Promise<CustomerInfo | null> => {
  try {
    // Ensure RevenueCat is initialized
    if (!isInitialized) {
      console.warn('RevenueCat not initialized, attempting to initialize...');
      const initResult = await initializeRevenueCat();
      if (!initResult) {
        console.error('Failed to initialize RevenueCat for restorePurchases');
        return null;
      }
    }

    const customerInfo = await Purchases.restorePurchases();
    return customerInfo;
  } catch (error) {
    console.error('Failed to restore purchases:', error);
    return null;
  }
};

// Check if user has active premium subscription
export const hasActivePremium = async (): Promise<boolean> => {
  try {
    // Ensure RevenueCat is initialized
    if (!isInitialized) {
      console.warn('RevenueCat not initialized, attempting to initialize...');
      const initResult = await initializeRevenueCat();
      if (!initResult) {
        console.error('Failed to initialize RevenueCat for hasActivePremium');
        return false;
      }
    }

    const customerInfo = await Purchases.getCustomerInfo();
    
    // Check for active premium entitlements
    // You'll need to configure these in your RevenueCat dashboard
    const hasPremium = customerInfo.entitlements.active['premium'] !== undefined;
    
    return hasPremium;
  } catch (error) {
    console.error('Failed to check premium status:', error);
    return false;
  }
};

// Get detailed subscription information
export const getSubscriptionInfo = async () => {
  try {
    // Ensure RevenueCat is initialized
    if (!isInitialized) {
      console.warn('RevenueCat not initialized, attempting to initialize...');
      const initResult = await initializeRevenueCat();
      if (!initResult) {
        throw new Error('Failed to initialize RevenueCat');
      }
    }

    const customerInfo = await Purchases.getCustomerInfo();
    
    // Check for active premium entitlements
    const premiumEntitlement = customerInfo.entitlements.active['premium'];
    
    const hasActivePremium = premiumEntitlement !== undefined;
    
    // Get expiration date if subscription exists
    let expiresAt: Date | null = null;
    let subscriptionStatus: 'active' | 'expired' | 'cancelled' | 'grace_period' | 'free' = 'free';
    
    if (hasActivePremium) {
      expiresAt = new Date(premiumEntitlement.expirationDate);
      subscriptionStatus = 'active';
    }
    
    // Check if subscription is in grace period or expired
    if (expiresAt) {
      const now = new Date();
      if (expiresAt < now) {
        subscriptionStatus = 'expired';
      }
    }
    
    return {
      hasActivePremium,
      subscriptionStatus,
      expiresAt,
      customerInfo,
      premiumEntitlement
    };
  } catch (error) {
    console.error('Failed to get subscription info:', error);
    return {
      hasActivePremium: false,
      subscriptionStatus: 'free' as const,
      expiresAt: null,
      customerInfo: null,
      premiumEntitlement: null
    };
  }
};

// Update user role in Supabase based on RevenueCat subscription status
export const syncSubscriptionWithDatabase = async (userId: string) => {
  try {
    const subscriptionInfo = await getSubscriptionInfo();
    
    // Determine the role based on subscription status
    let role = 'free';
    if (subscriptionInfo.hasActivePremium) {
      role = 'premium';
    }
    
    console.log('Syncing subscription status:', {
      userId,
      role,
      subscriptionStatus: subscriptionInfo.subscriptionStatus,
      expiresAt: subscriptionInfo.expiresAt
    });
    
    // Import supabase here to avoid circular dependencies
    const { supabase } = await import('./supabase');
    
    // Update user role in database
    const { error } = await supabase
      .from('users')
      .update({ 
        role
      })
      .eq('id', userId);
    
    if (error) {
      console.error('Failed to update user role in database:', error);
      throw error;
    }
    
    console.log('Successfully synced subscription status to database');
    return { role, subscriptionStatus: subscriptionInfo.subscriptionStatus };
  } catch (error) {
    console.error('Failed to sync subscription with database:', error);
    throw error;
  }
};
