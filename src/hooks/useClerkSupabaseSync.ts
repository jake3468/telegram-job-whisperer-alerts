
import { useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';

export const useClerkSupabaseSync = () => {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    const syncUserToSupabase = async () => {
      if (!isLoaded || !user) return;

      try {
        // Check if user already exists in Supabase
        const { data: existingUser, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('clerk_id', user.id)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Error checking existing user:', fetchError);
          return;
        }

        const userData = {
          clerk_id: user.id,
          email: user.primaryEmailAddress?.emailAddress || '',
          first_name: user.firstName || null,
          last_name: user.lastName || null,
        };

        let userId = existingUser?.id;

        if (existingUser) {
          // Update existing user
          const { error: updateError } = await supabase
            .from('users')
            .update(userData)
            .eq('clerk_id', user.id);

          if (updateError) {
            console.error('Error updating user:', updateError);
          } else {
            console.log('User updated successfully in Supabase');
          }
        } else {
          // Create new user
          const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert([userData])
            .select()
            .single();

          if (insertError) {
            console.error('Error creating user:', insertError);
            return;
          } else {
            console.log('User created successfully in Supabase');
            userId = newUser.id;
          }
        }

        // Ensure user_profile exists
        if (userId) {
          const { data: existingProfile, error: profileFetchError } = await supabase
            .from('user_profile')
            .select('*')
            .eq('user_id', userId)
            .single();

          if (profileFetchError && profileFetchError.code === 'PGRST116') {
            // Create user profile if it doesn't exist
            const { error: profileCreateError } = await supabase
              .from('user_profile')
              .insert([{ user_id: userId }]);

            if (profileCreateError) {
              console.error('Error creating user profile:', profileCreateError);
            } else {
              console.log('User profile created successfully');
            }
          }
        }
      } catch (error) {
        console.error('Error syncing user to Supabase:', error);
      }
    };

    syncUserToSupabase();
  }, [user, isLoaded]);
};
