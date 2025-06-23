
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
          console.log('[useClerkSupabaseSync] 🔄 Getting Clerk JWT token...');
          
          // Get the token for this signed-in user with the supabase template
          const jwt = await getToken({ template: 'supabase' }).catch((error) => {
            console.error('[useClerkSupabaseSync] ❌ Error getting Clerk JWT:', error);
            console.warn('[useClerkSupabaseSync] ⚠️ Please ensure the "supabase" JWT template is configured in your Clerk dashboard');
            return null;
          });
          
          if (!isMounted) return; // Component unmounted
          
          if (!jwt) {
            console.warn("[useClerkSupabaseSync] ⚠️ No Clerk JWT returned. Using Supabase anon key only.");
            await setClerkToken(null);
          } else {
            console.log(`[useClerkSupabaseSync] 🔑 Setting Clerk JWT for user: ${userId}`);
            await setClerkToken(jwt);
            
            // Debug: Log token info (first 50 chars for security)
            console.log(`[useClerkSupabaseSync] 📝 Token preview: ${jwt.substring(0, 50)}...`);
            
            // Verify token was set by testing it
            setTimeout(async () => {
              try {
                const { data: testResult } = await import('@/integrations/supabase/client').then(m => 
                  m.supabase.rpc('debug_user_auth')
                );
                console.log('[useClerkSupabaseSync] 🧪 JWT test result:', testResult);
              } catch (error) {
                console.warn('[useClerkSupabaseSync] ⚠️ JWT test failed:', error);
              }
            }, 1000);
          }
        } else {
          console.log("[useClerkSupabaseSync] 👤 User not signed in. Using Supabase anon key only.");
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
