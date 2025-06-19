
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
          console.log('[useClerkSupabaseSync] User is signed in, getting token...');
          
          // Get the token for this signed-in user with the supabase template
          const jwt = await getToken({ template: 'supabase' }).catch((error) => {
            console.error('[useClerkSupabaseSync] Error getting Clerk JWT:', error);
            return null;
          });
          
          if (!isMounted) return; // Component unmounted
          
          if (!jwt) {
            console.warn("[useClerkSupabaseSync] No Clerk JWT was returned. This usually means the 'supabase' JWT template is not configured in Clerk. Supabase RLS will fail.");
            await setClerkToken(null);
          } else {
            // Only show the first/last 5 chars, do NOT log the full JWT!
            const masked = jwt.length > 10 ? jwt.substring(0,5) + "..." + jwt.substring(jwt.length-5) : "[short]";
            await setClerkToken(jwt);
            console.log(`[useClerkSupabaseSync] Clerk JWT was set (masked): ${masked} for Clerk user ID: ${userId}`);
            
            // Debug: Log JWT claims structure (safely)
            try {
              const payload = JSON.parse(atob(jwt.split('.')[1]));
              console.log('[useClerkSupabaseSync] JWT claims structure:', {
                sub: payload.sub ? `present (${payload.sub.substring(0,8)}...)` : 'missing',
                iss: payload.iss ? 'present' : 'missing',
                aud: payload.aud ? 'present' : 'missing',
                exp: payload.exp ? 'present' : 'missing',
                iat: payload.iat ? 'present' : 'missing'
              });
            } catch (parseError) {
              console.warn('[useClerkSupabaseSync] Could not parse JWT for debugging');
            }
          }
        } else {
          console.log("[useClerkSupabaseSync] User not signed in or getToken missing. Using Supabase anon key only.");
          await setClerkToken(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error("[useClerkSupabaseSync] Error setting Clerk token:", err);
        }
      }
    }
    
    setToken();
    
    return () => { 
      isMounted = false; 
    };
  }, [getToken, isSignedIn, userId]);
}
