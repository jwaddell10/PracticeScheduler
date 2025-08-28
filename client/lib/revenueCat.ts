import Purchases, { PurchasesOffering, CustomerInfo } from 'react-native-purchases';
import Constants from 'expo-constants';

let isInitialized = false;

// Initialize RevenueCat SDK
export const initializeRevenueCat = async () => {
  try {
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
    // Check if SDK is initialized by trying to get customer info
    await Purchases.getCustomerInfo();
    await Purchases.logIn(userId);
    console.log('RevenueCat user set:', userId);
  } catch (error) {
    console.error('Failed to set RevenueCat user:', error);
  }
};

// Get current offerings
export const getOfferings = async (): Promise<PurchasesOffering | null> => {
  if (!isInitialized) {
    console.warn('RevenueCat SDK not initialized. Please wait for initialization to complete.');
    return null;
  }
  
  try {
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
    const customerInfo = await Purchases.getCustomerInfo();
    
    // Check for active premium entitlements
    // You'll need to configure these in your RevenueCat dashboard
    const hasPremium = customerInfo.entitlements.active['premium'] !== undefined;
    const hasAdmin = customerInfo.entitlements.active['admin'] !== undefined;
    
    return hasPremium || hasAdmin;
  } catch (error) {
    console.error('Failed to check premium status:', error);
    return false;
  }
};
