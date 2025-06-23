
import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { setClerkToken, testJWTTransmission } from '@/integrations/supabase/client';
import { Environment } from '@/utils/environment';

/**
 * Production-optimized Clerk-Supabase sync with minimal logging.
 * Maintains security while improving performance.
 */
export function useClerkSupabaseSync() {
  const { getToken, isSignedIn, userId } = useAuth();

  useEffect(() => {
    let isMounted = true;
    
    async function setToken() {
      try {
        if (isSignedIn && getToken) {
          if (Environment.isDevelopment()) {
            console.log('[useClerkSupabaseSync] 🔄 Getting fresh Clerk JWT token...');
          }
          
          // Get fresh token with optimized delay for production
          const jwt = await getToken({ 
            template: 'supabase',
            skipCache: true,
            leewayInSeconds: 0
          }).catch((error) => {
            console.error('[useClerkSupabaseSync] ❌ Error getting Clerk JWT:', error);
            if (Environment.isDevelopment()) {
              console.warn('[useClerkSupabaseSync] ⚠️ Please ensure the "supabase" JWT template is configured with HS256');
            }
            return null;
          });
          
          if (!isMounted) return;
          
          if (!jwt) {
            console.warn("[useClerkSupabaseSync] ⚠️ No Clerk JWT returned. Check template configuration.");
            await setClerkToken(null);
          } else {
            if (Environment.isDevelopment()) {
              console.log(`[useClerkSupabaseSync] 🔑 Setting fresh HS256 JWT for user: ${userId}`);
              
              // Verify token algorithm only in development
              try {
                const header = JSON.parse(atob(jwt.split('.')[0]));
                console.log(`[useClerkSupabaseSync] 🔍 Token algorithm: ${header.alg}`);
                
                if (header.alg !== 'HS256') {
                  console.error('[useClerkSupabaseSync] ❌ ERROR: Expected HS256 but got:', header.alg);
                }
              } catch (e) {
                console.warn('[useClerkSupabaseSync] ⚠️ Could not decode JWT for verification:', e);
              }
            }
            
            // Set the JWT token
            const success = await setClerkToken(jwt);
            
            if (success) {
              if (Environment.isDevelopment()) {
                console.log(`[useClerkSupabaseSync] 📝 Token preview: ${jwt.substring(0, 50)}...`);
                
                // Test JWT transmission only in development
                console.log('[useClerkSupabaseSync] 🧪 Testing JWT transmission...');
                try {
                  const testResult = await testJWTTransmission();
                  console.log('[useClerkSupabaseSync] 📊 Token test:', testResult);
                  
                  if (testResult.data && testResult.data.length > 0) {
                    const result = testResult.data[0];
                    if (result.clerk_id) {
                      console.log('[useClerkSupabaseSync] ✅ SUCCESS! JWT recognized by Supabase!');
                    } else {
                      console.error('[useClerkSupabaseSync] 🚨 JWT not recognized by Supabase');
                    }
                  }
                } catch (error) {
                  console.warn('[useClerkSupabaseSync] ⚠️ JWT test failed:', error);
                }
              }
            } else {
              console.error('[useClerkSupabaseSync] ❌ Failed to set Clerk JWT token');
            }
          }
        } else {
          if (Environment.isDevelopment()) {
            console.log("[useClerkSupabaseSync] 👤 User not signed in. Clearing Supabase token.");
          }
          await setClerkToken(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error("[useClerkSupabaseSync] ❌ Error in token sync:", err);
        }
      }
    }
    
    // Immediate token refresh
    setToken();
    
    return () => { 
      isMounted = false; 
    };
  }, [getToken, isSignedIn, userId]);
}
