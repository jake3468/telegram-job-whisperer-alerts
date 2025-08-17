import { UserProfileUpdateData } from '@/types/userProfile';

export const detectAndStoreLocation = async (
  userProfile: { user_location?: string | null } | null,
  updateUserProfile: (updates: UserProfileUpdateData) => Promise<any>
) => {
  // Only detect location if it hasn't been set yet (allow null/undefined values)
  if (userProfile?.user_location && userProfile.user_location !== null) {
    return;
  }
  
  try {
    // Use a free IP geolocation service to detect location
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();

    // Check if the user is in India based on country code
    const isInIndia = data.country_code === 'IN';
    const location = isInIndia ? 'india' : 'global';

    // Update user profile with location
    await updateUserProfile({
      user_location: location
    });
  } catch (error) {
    // Fallback to 'global' if detection fails
    try {
      await updateUserProfile({
        user_location: 'global'
      });
    } catch (fallbackError) {
      // Silent fail - location detection is not critical
    }
  }
};