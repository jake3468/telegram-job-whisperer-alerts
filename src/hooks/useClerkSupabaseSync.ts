
import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { setClerkToken } from '@/integrations/supabase/client';

/**
 * Keeps Supabase client in sync with Clerk JWT for RLS policies.
 * This is critical for RLS to work! Must call this in your app root.
 */
export function useClerkSupabaseSync() {
  const { getToken, isSignedIn, userId } = useAuth();

  useEffect(() => {
    let stop = false;
    async function setToken() {
      // Get the token for this signed-in user
      if (isSignedIn && getToken) {
        try {
          const jwt = await getToken({ template: 'supabase' }).catch(() => null);
          console.log("[useClerkSupabaseSync] getToken({template:'supabase'}) returned:", jwt, "for Clerk user ID:", userId);
          if (!jwt) {
            console.warn("[useClerkSupabaseSync] No Clerk JWT. Supabase RLS will fail.");
          } else {
            setClerkToken(jwt);
            console.log("[useClerkSupabaseSync] Setting Clerk JWT in Supabase client headers:", jwt);
          }
        } catch (err) {
          console.error("[useClerkSupabaseSync] Error setting Clerk token:", err);
        }
      } else {
        console.warn("[useClerkSupabaseSync] Not signed in or getToken missing.");
      }
    }
    setToken();
    return () => { stop = true; };
  }, [getToken, isSignedIn, userId]);
}

