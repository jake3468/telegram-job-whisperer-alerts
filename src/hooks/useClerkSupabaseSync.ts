
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
    let isMounted = true;
    
    async function setToken() {
      try {
        if (isSignedIn && getToken) {
          // Get the token for this signed-in user with the supabase template
          const jwt = await getToken({ template: 'supabase' }).catch((error) => {
            console.error('[useClerkSupabaseSync] Error getting Clerk JWT:', error);
            return null;
          });
          
          if (!isMounted) return; // Component unmounted
          
          if (!jwt) {
            console.warn("[useClerkSupabaseSync] No Clerk JWT was returned. Using Supabase anon key only.");
            await setClerkToken(null);
          } else {
            await setClerkToken(jwt);
            console.log(`[useClerkSupabaseSync] ✅ Clerk JWT was set successfully for user: ${userId}`);
          }
        } else {
          console.log("[useClerkSupabaseSync] User not signed in. Using Supabase anon key only.");
          await setClerkToken(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error("[useClerkSupabaseSync] ❌ Error setting Clerk token:", err);
        }
      }
    }
    
    setToken();
    
    return () => { 
      isMounted = false; 
    };
  }, [getToken, isSignedIn, userId]);
}
