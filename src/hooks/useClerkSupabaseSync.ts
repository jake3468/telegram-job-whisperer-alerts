
import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { setClerkToken, testJWTTransmission } from '@/integrations/supabase/client';

/**
 * Enhanced Clerk-Supabase sync with improved JWT handling and immediate transmission.
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
          
          // Get the token with explicit template and skipCache
          const jwt = await getToken({ 
            template: 'supabase',
            skipCache: true
          }).catch((error) => {
            console.error('[useClerkSupabaseSync] ❌ Error getting Clerk JWT:', error);
            console.warn('[useClerkSupabaseSync] ⚠️ Please ensure the "supabase" JWT template is configured in your Clerk dashboard');
            console.warn('[useClerkSupabaseSync] 💡 Template should include: {"aud": "authenticated", "role": "authenticated"}');
            return null;
          });
          
          if (!isMounted) return; // Component unmounted
          
          if (!jwt) {
            console.warn("[useClerkSupabaseSync] ⚠️ No Clerk JWT returned. Check template configuration.");
            await setClerkToken(null);
          } else {
            console.log(`[useClerkSupabaseSync] 🔑 Setting Clerk JWT for user: ${userId}`);
            
            // Set the JWT token
            const success = await setClerkToken(jwt);
            
            if (success) {
              // Debug: Log token info (first 50 chars for security)
              console.log(`[useClerkSupabaseSync] 📝 Token preview: ${jwt.substring(0, 50)}...`);
              
              // Test JWT transmission immediately after setting
              console.log('[useClerkSupabaseSync] 🧪 Testing JWT transmission immediately...');
              try {
                const testResult = await testJWTTransmission();
                console.log('[useClerkSupabaseSync] 📊 Immediate JWT test:', testResult);
                
                if (testResult.data && testResult.data.length > 0) {
                  const result = testResult.data[0];
                  console.log('[useClerkSupabaseSync] 🔍 JWT Recognition Status:', {
                    clerkId: result.clerk_id || 'NOT_FOUND',
                    authRole: result.auth_role || 'NOT_FOUND',
                    userExists: result.user_exists || false,
                    jwtTransmissionWorking: !!result.clerk_id
                  });
                  
                  // If JWT is not being recognized, provide guidance
                  if (!result.clerk_id) {
                    console.error('[useClerkSupabaseSync] 🚨 JWT NOT RECOGNIZED BY SUPABASE!');
                    console.error('[useClerkSupabaseSync] 💡 This usually means:');
                    console.error('[useClerkSupabaseSync] 1. JWT template is missing "aud": "authenticated"');
                    console.error('[useClerkSupabaseSync] 2. JWT template is missing "role": "authenticated"');
                    console.error('[useClerkSupabaseSync] 3. JWT is not reaching Supabase backend properly');
                  } else {
                    console.log('[useClerkSupabaseSync] ✅ JWT successfully recognized by Supabase!');
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
    
    setToken();
    
    return () => { 
      isMounted = false; 
    };
  }, [getToken, isSignedIn, userId]);
}
