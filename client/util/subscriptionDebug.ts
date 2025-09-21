import { supabase } from '../lib/supabase';

export const debugSubscriptionData = async (userId: string) => {
  try {
    console.log('🔍 Debugging subscription data for user:', userId);
    
    // Check if subscriptions table exists and get its structure
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    
    console.log('📊 Raw subscription query result:', {
      data: subscriptionData,
      error: subscriptionError,
      errorCode: subscriptionError?.code,
      errorMessage: subscriptionError?.message
    });
    
    // Also try to get all subscriptions to see the table structure
    const { data: allSubscriptions, error: allError } = await supabase
      .from("subscriptions")
      .select("*")
      .limit(5);
    
    console.log('📋 Sample subscriptions table data:', {
      allSubscriptions,
      allError
    });
    
    // Check user data
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();
    
    console.log('👤 User data:', {
      userData,
      userError
    });
    
    return {
      subscriptionData,
      subscriptionError,
      userData,
      userError,
      allSubscriptions,
      allError
    };
  } catch (error) {
    console.error('❌ Error debugging subscription data:', error);
    return { error };
  }
};

// Test function to manually check subscription status
export const testSubscriptionStatus = async (userId: string) => {
  console.log('🧪 Testing subscription status for user:', userId);
  
  const debugResult = await debugSubscriptionData(userId);
  
  if (debugResult.error) {
    console.error('❌ Debug failed:', debugResult.error);
    return;
  }
  
  const { subscriptionData, userData } = debugResult;
  
  if (!subscriptionData) {
    console.log('🚫 No subscription found - user should see upgrade banner');
    return { isSubscriber: false, reason: 'No subscription found' };
  }
  
  const now = new Date();
  const expiresAt = new Date(subscriptionData.expires_at);
  const isExpired = expiresAt <= now;
  const isActive = subscriptionData.status === 'active';
  
  console.log('📊 Subscription analysis:', {
    status: subscriptionData.status,
    expiresAt: subscriptionData.expires_at,
    now: now.toISOString(),
    isExpired,
    isActive,
    shouldBeSubscriber: !isExpired && isActive
  });
  
  if (!isExpired && isActive) {
    console.log('✅ User should have subscriber access');
    return { isSubscriber: true, reason: 'Active subscription' };
  } else {
    console.log('❌ User should NOT have subscriber access');
    return { 
      isSubscriber: false, 
      reason: isExpired ? 'Subscription expired' : 'Subscription not active' 
    };
  }
};
