import { supabase } from '../lib/supabase';

export const checkSubscriptionStatus = async (userId: string) => {
  try {
    console.log('🔍 Checking subscription status for user:', userId);
    
    // Query the subscriptions table
    const { data, error } = await supabase.from("subscriptions").select("status").eq("user_id", userId);
    
    console.log('📊 Subscription query result:', {
      data,
      error,
      errorCode: error?.code,
      errorMessage: error?.message
    });
    
    if (error) {
      console.warn('❌ Failed to fetch subscription:', error);
      return {
        isSubscriber: false,
        status: 'error',
        reason: 'Database error',
        error: error.message
      };
    }
    
    if (!data || data.length === 0) {
      console.warn('🚫 No subscription found');
      return {
        isSubscriber: false,
        status: 'none',
        reason: 'No subscription found'
      };
    }
    
    // Check if any subscription is active
    const activeSubscription = data.find(sub => sub.status === 'active');
    
    if (activeSubscription) {
      console.warn('✅ User has active subscription');
      return {
        isSubscriber: true,
        status: 'active',
        reason: 'Active subscription found'
      };
    } else {
      console.warn('❌ No active subscription found');
      return {
        isSubscriber: false,
        status: 'inactive',
        reason: 'No active subscription'
      };
    }
    
  } catch (error) {
    console.error('❌ Error checking subscription status:', error);
    return {
      isSubscriber: false,
      status: 'error',
      reason: 'Check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
