
import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { setClerkToken, testJWTTransmission } from '@/integrations/supabase/client';
import { Environment } from '@/utils/environment';

/**
 * Production-optimized Clerk-Supabase sync with minimal overhead.
 */
export function useClerkSupabaseSync() {
  const { getToken, isSignedIn, userId } = useAuth();

  useEffect(() => {
    let isMounted = true;
    
    async function setToken() {
      try {
        if (isSignedIn && getToken) {
          // Get fresh token - no artificial delays in production
          const jwt = await getToken({ 
            template: 'supabase',
            skipCache: true,
            leewayInSeconds: 0
          }).catch((error) => {
            if (Environment.isDevelopment()) {
              console.error('[useClerkSupabaseSync] Error getting Clerk JWT:', error);
            }
            return null;
          });
          
          if (!isMounted) return;
          
          if (!jwt) {
            if (Environment.isDevelopment()) {
              console.warn("[useClerkSupabaseSync] No Clerk JWT returned. Check template configuration.");
            }
            await setClerkToken(null);
          } else {
            // Set the JWT token immediately
            const success = await setClerkToken(jwt);
            
            // Only run comprehensive tests in development
            if (success && Environment.isDevelopment()) {
              console.log(`[useClerkSupabaseSync] Token set for user: ${userId}`);
              
              // Test JWT transmission only in development
              try {
                const testResult = await testJWTTransmission();
                if (testResult.data?.[0]?.clerk_id) {
                  console.log('[useClerkSupabaseSync] ✅ JWT verified');
                } else {
                  console.error('[useClerkSupabaseSync] JWT not recognized');
                }
              } catch (error) {
                console.warn('[useClerkSupabaseSync] JWT test failed:', error);
              }
            }
          }
        } else {
          await setClerkToken(null);
        }
      } catch (err) {
        if (isMounted && Environment.isDevelopment()) {
          console.error("[useClerkSupabaseSync] Error in token sync:", err);
        }
      }
    }
    
    // Immediate token refresh with no delays
    setToken();
    
    return () => { 
      isMounted = false; 
    };
  }, [getToken, isSignedIn, userId]);
}
