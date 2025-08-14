
import { supabase, makeAuthenticatedRequest } from '@/integrations/supabase/client';
import { UserProfile, UserProfileUpdateData } from '@/types/userProfile';
import { Environment } from '@/utils/environment';
import { createUserProfileDebugger } from '@/utils/userProfileDebug';

const { debugLog } = createUserProfileDebugger();

export const fetchUserFromDatabase = async (clerkUserId: string) => {
  // Validate Clerk user ID format before making database call
  if (!clerkUserId || typeof clerkUserId !== 'string' || clerkUserId.length === 0) {
    throw new Error('Invalid Clerk user ID provided');
  }

  return await makeAuthenticatedRequest(async () => {
    return await supabase
      .from('users')
      .select('id, clerk_id, email, first_name, last_name')
      .eq('clerk_id', clerkUserId)
      .maybeSingle();
  });
};

export const fetchUserProfile = async (userId: string, maxAttempts: number = 3) => {
  // Validate user ID format before making database call
  if (!userId || typeof userId !== 'string' || userId.length === 0) {
    throw new Error('Invalid user ID provided');
  }

  let profileData = null;
  let profileError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    debugLog(`Profile fetch attempt ${attempt}/${maxAttempts} for user ID: ${userId}`);

    const profileResult = await makeAuthenticatedRequest(async () => {
      return await supabase
        .from('user_profile')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
    });

    profileData = profileResult.data;
    profileError = profileResult.error;

    if (!profileError) {
      break; // Success
    }

    // Handle UUID format errors specifically
    if (profileError.message?.includes('invalid input syntax for type uuid')) {
      debugLog('UUID format error detected:', profileError.message);
      break; // Don't retry UUID format errors
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
  // Validate profile ID format before making database call
  if (!profileId || typeof profileId !== 'string' || profileId.length === 0) {
    throw new Error('Invalid profile ID provided');
  }

  return await makeAuthenticatedRequest(async () => {
    return await supabase
      .from('user_profile')
      .update(updates)
      .eq('id', profileId);
  });
};
