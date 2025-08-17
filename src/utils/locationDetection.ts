import { UserProfileUpdateData } from '@/types/userProfile';

export const detectAndStoreLocation = async (
  userProfile: { user_location?: string | null } | null,
  updateUserProfile: (updates: UserProfileUpdateData) => Promise<any>
) => {
  // Only detect location if it hasn't been set yet
  if (userProfile?.user_location) {
    console.log('Location already set:', userProfile.user_location);
    return;
  }
  
  console.log('Starting location detection...');
  
  try {
    // Use a free IP geolocation service to detect location
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    
    console.log('IP geolocation data:', data);

    // Check if the user is in India based on country code
    const isInIndia = data.country_code === 'IN';
    const location = isInIndia ? 'india' : 'global';
    
    console.log('Detected location:', location);

    // Update user profile with location
    const result = await updateUserProfile({
      user_location: location
    });
    
    console.log('Update profile result:', result);
  } catch (error) {
    console.error('Location detection error:', error);
    // Fallback to 'global' if detection fails
    const result = await updateUserProfile({
      user_location: 'global'
    });
    console.log('Fallback update result:', result);
  }
};