
import { supabase, makeAuthenticatedRequest } from '@/integrations/supabase/client';
import { UserProfile, UserProfileUpdateData } from '@/types/userProfile';
import { Environment } from '@/utils/environment';
import { createUserProfileDebugger } from '@/utils/userProfileDebug';

const { debugLog } = createUserProfileDebugger();

export const fetchUserFromDatabase = async (clerkUserId: string) => {
  return await makeAuthenticatedRequest(async () => {
    return await supabase
      .from('users')
      .select('id, clerk_id, email, first_name, last_name')
      .eq('clerk_id', clerkUserId)
      .maybeSingle();
  }, 'user lookup');
};

export const fetchUserProfile = async (userId: string, maxAttempts: number = 3) => {
  let profileData = null;
  let profileError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    debugLog(`Profile fetch attempt ${attempt}/${maxAttempts}`);

    const profileResult = await makeAuthenticatedRequest(async () => {
      return await supabase
        .from('user_profile')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
    }, `profile fetch attempt ${attempt}`);

    profileData = profileResult.data;
    profileError = profileResult.error;

    if (!profileError) {
      break; // Success
    }

    // Only retry on permission errors and only in development
    if ((profileError.code === '42501' || profileError.message.includes('permission')) && 
        attempt < maxAttempts && Environment.isDevelopment()) {
      debugLog('Permission error, retrying...');
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 200));
    } else {
      break; // Don't retry other errors or in production
    }
  }

  return { data: profileData, error: profileError };
};

export const updateUserProfileInDatabase = async (profileId: string, updates: UserProfileUpdateData) => {
  return await makeAuthenticatedRequest(async () => {
    return await supabase
      .from('user_profile')
      .update(updates)
      .eq('id', profileId);
  }, 'profile update');
};
