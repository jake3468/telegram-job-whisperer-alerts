
import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { setClerkToken, testJWTTransmission } from '@/integrations/supabase/client';

/**
 * Enhanced Clerk-Supabase sync with forced token refresh to get HS256 tokens.
 * This is critical for RLS to work! Must call this in your app root.
 */
export function useClerkSupabaseSync() {
  const { getToken, isSignedIn, userId } = useAuth();

  useEffect(() => {
    let isMounted = true;
    
    async function setToken() {
      try {
        if (isSignedIn && getToken) {
          console.log('[useClerkSupabaseSync] 🔄 Getting fresh Clerk JWT token...');
          
          // CRITICAL: Force fresh token with skipCache to get new HS256 token
          const jwt = await getToken({ 
            template: 'supabase',
            skipCache: true, // This ensures we get a fresh HS256 token, not cached RS256
            leewayInSeconds: 0 // No leeway to ensure completely fresh token
          }).catch((error) => {
            console.error('[useClerkSupabaseSync] ❌ Error getting Clerk JWT:', error);
            console.warn('[useClerkSupabaseSync] ⚠️ Please ensure the "supabase" JWT template is configured with HS256');
            return null;
          });
          
          if (!isMounted) return; // Component unmounted
          
          if (!jwt) {
            console.warn("[useClerkSupabaseSync] ⚠️ No Clerk JWT returned. Check template configuration.");
            await setClerkToken(null);
          } else {
            console.log(`[useClerkSupabaseSync] 🔑 Setting fresh HS256 JWT for user: ${userId}`);
            
            // Verify the token algorithm before proceeding
            try {
              const payload = JSON.parse(atob(jwt.split('.')[1]));
              const header = JSON.parse(atob(jwt.split('.')[0]));
              
              console.log(`[useClerkSupabaseSync] 🔍 Token algorithm: ${header.alg}`);
              console.log(`[useClerkSupabaseSync] 🔍 Token claims:`, {
                aud: payload.aud,
                role: payload.role,
                sub: payload.sub,
                iss: payload.iss
              });
              
              if (header.alg !== 'HS256') {
                console.error('[useClerkSupabaseSync] ❌ ERROR: Expected HS256 but got:', header.alg);
                console.error('[useClerkSupabaseSync] 💡 Please check your Clerk JWT template configuration');
              }
              
            } catch (e) {
              console.warn('[useClerkSupabaseSync] ⚠️ Could not decode JWT for verification:', e);
            }
            
            // Set the JWT token
            const success = await setClerkToken(jwt);
            
            if (success) {
              // Debug: Log token info (first 50 chars for security)
              console.log(`[useClerkSupabaseSync] 📝 Token preview: ${jwt.substring(0, 50)}...`);
              
              // Test JWT transmission immediately after setting
              console.log('[useClerkSupabaseSync] 🧪 Testing JWT transmission with fresh HS256 token...');
              try {
                const testResult = await testJWTTransmission();
                console.log('[useClerkSupabaseSync] 📊 Fresh token test:', testResult);
                
                if (testResult.data && testResult.data.length > 0) {
                  const result = testResult.data[0];
                  console.log('[useClerkSupabaseSync] 🔍 JWT Recognition Status:', {
                    clerkId: result.clerk_id || 'NOT_FOUND',
                    authRole: result.auth_role || 'NOT_FOUND',
                    userExists: result.user_exists || false,
                    jwtTransmissionWorking: !!result.clerk_id
                  });
                  
                  if (result.clerk_id) {
                    console.log('[useClerkSupabaseSync] ✅ SUCCESS! HS256 JWT successfully recognized by Supabase!');
                  } else {
                    console.error('[useClerkSupabaseSync] 🚨 HS256 JWT still not recognized by Supabase');
                  }
                } else if (testResult.error) {
                  if (testResult.error.message.includes('JWSInvalidSignature')) {
                    console.error('[useClerkSupabaseSync] 🚨 SIGNATURE ERROR: HS256 JWT signature invalid');
                    console.error('[useClerkSupabaseSync] 💡 Check that Supabase JWT secret matches Clerk exactly');
                  } else {
                    console.error('[useClerkSupabaseSync] ❌ JWT test error:', testResult.error.message);
                  }
                }
              } catch (error) {
                console.warn('[useClerkSupabaseSync] ⚠️ JWT verification test failed:', error);
              }
            } else {
              console.error('[useClerkSupabaseSync] ❌ Failed to set Clerk JWT token');
            }
          }
        } else {
          console.log("[useClerkSupabaseSync] 👤 User not signed in. Clearing Supabase token.");
          await setClerkToken(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error("[useClerkSupabaseSync] ❌ Error in token sync:", err);
        }
      }
    }
    
    // Force immediate token refresh
    setToken();
    
    return () => { 
      isMounted = false; 
    };
  }, [getToken, isSignedIn, userId]);
}
