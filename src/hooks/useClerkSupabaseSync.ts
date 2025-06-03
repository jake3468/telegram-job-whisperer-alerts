
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
          const { error: insertError } = await supabase
            .from('users')
            .insert([userData]);

          if (insertError) {
            console.error('Error creating user:', insertError);
          } else {
            console.log('User created successfully in Supabase');
          }
        }
      } catch (error) {
        console.error('Error syncing user to Supabase:', error);
      }
    };

    syncUserToSupabase();
  }, [user, isLoaded]);
};
