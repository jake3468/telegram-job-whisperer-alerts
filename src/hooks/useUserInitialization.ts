
import { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';

export const useUserInitialization = () => {
  const { user } = useUser();
  const [isInitializing, setIsInitializing] = useState(false);

  const initializeUser = async () => {
    if (!user) {
      return { success: false, error: 'No user found' };
    }

    setIsInitializing(true);

    try {
      // Call the edge function to create/verify user
      const { data, error } = await supabase.functions.invoke('user-management', {
        body: {
          clerk_id: user.id,
          email: user.emailAddresses?.[0]?.emailAddress || user.primaryEmailAddress?.emailAddress,
          first_name: user.firstName,
          last_name: user.lastName
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };

    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to initialize user' };
    } finally {
      setIsInitializing(false);
    }
  };

  return {
    initializeUser,
    isInitializing
  };
};
