
import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { setClerkToken } from '@/integrations/supabase/client';

/**
 * Keeps Supabase client in sync with Clerk JWT for RLS policies.
 * This is critical for RLS to work! Must call this in your app root.
 */
export function useClerkSupabaseSync() {
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    let stop = false;
    async function setToken() {
      // Get the token for this signed-in user
      if (isSignedIn && getToken) {
        const jwt = await getToken({ template: 'supabase' }).catch(() => null);
        if (!stop && jwt) {
          // Set the Clerk JWT in Supabase globally
          setClerkToken(jwt);
        }
      }
    }
    setToken();
    return () => { stop = true; };
  }, [getToken, isSignedIn]);
}
