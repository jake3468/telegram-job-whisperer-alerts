
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
          if (!jwt) {
            console.warn("[useClerkSupabaseSync] No Clerk JWT was returned. Supabase RLS will fail. This means requests are unauthenticated.");
          } else {
            // Only show the first/last 5 chars, do NOT log the full JWT!
            const masked = jwt.length > 10 ? jwt.substring(0,5) + "..." + jwt.substring(jwt.length-5) : "[short]";
            setClerkToken(jwt);
            console.log(`[useClerkSupabaseSync] Clerk JWT was set (masked): ${masked} for Clerk user ID: ${userId}`);
          }
        } catch (err) {
          console.error("[useClerkSupabaseSync] Error setting Clerk token:", err);
        }
      } else {
        console.warn("[useClerkSupabaseSync] Not signed in or getToken missing. Using Supabase ANON key only.");
      }
    }
    setToken();
    return () => { stop = true; };
  }, [getToken, isSignedIn, userId]);
}
