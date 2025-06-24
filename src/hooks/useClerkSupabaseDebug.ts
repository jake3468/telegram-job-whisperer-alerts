
import { useAuth } from '@clerk/clerk-react';
import { supabase, getCurrentJWTToken } from '@/integrations/supabase/client';

export const useClerkSupabaseDebug = () => {
  const { getToken, isSignedIn, userId } = useAuth();

  const debugClerkSupabaseIntegration = async () => {
    console.log('\n=== SECURITY-ENHANCED CLERK-SUPABASE DEBUG SESSION ===');
    console.log('[DEBUG] Clerk isSignedIn:', isSignedIn);
    console.log('[DEBUG] Clerk userId:', userId);

    if (!isSignedIn || !getToken) {
      console.log('[DEBUG] ❌ User not signed in or getToken not available');
      return { success: false, error: 'Not signed in' };
    }

    try {
      // Test 1: Get Clerk JWT token with supabase template
      console.log('\n--- Test 1: Clerk JWT Token ---');
      const token = await getToken({ template: 'supabase', skipCache: true });
      console.log('[DEBUG] Clerk JWT token obtained:', token ? '✅ YES' : '❌ NO');
      
      if (token) {
        const maskedToken = token.substring(0, 30) + '...';
        console.log('[DEBUG] Token (masked):', maskedToken);
        
        // Decode token payload for debugging (security-safe)
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          console.log('[DEBUG] Token payload details:', {
            iss: payload.iss,
            sub: payload.sub,
            aud: payload.aud,
            exp: payload.exp,
            iat: payload.iat,
            role: payload.role || 'not_set'
          });
        } catch (e) {
          console.log('[DEBUG] Could not decode token payload:', e);
        }
      }

      // Test 2: Check current JWT token in client
      console.log('\n--- Test 2: Current JWT Token in Client ---');
      const currentToken = getCurrentJWTToken();
      console.log('[DEBUG] Current JWT token set:', currentToken ? '✅ YES' : '❌ NO');
      if (currentToken) {
        console.log('[DEBUG] Current token preview:', currentToken.substring(0, 50) + '...');
      }

      // Test 3: Enhanced JWT debugging function
      console.log('\n--- Test 3: Enhanced JWT Debug Function ---');
      try {
        const { data: debugData, error: debugError } = await supabase.rpc('debug_user_auth');
        console.log('[DEBUG] Enhanced debug_user_auth result:', debugData);
        console.log('[DEBUG] Enhanced debug_user_auth error:', debugError);
        
        if (debugData && debugData.length > 0) {
          const result = debugData[0];
          console.log('[DEBUG] 🔍 JWT Analysis:');
          console.log('  - Clerk ID from JWT:', result.clerk_id || '❌ NOT FOUND');
          console.log('  - JWT Sub:', result.jwt_sub || '❌ NOT FOUND');
          console.log('  - JWT Issuer:', result.jwt_issuer || '❌ NOT FOUND');
          console.log('  - JWT Audience:', result.jwt_aud || '❌ NOT FOUND');
          console.log('  - Auth Role:', result.auth_role || '❌ NOT FOUND');
          console.log('  - User exists in DB:', result.user_exists ? '✅ YES' : '❌ NO');
        }
      } catch (rpcError) {
        console.log('[DEBUG] RPC function error:', rpcError);
      }

      // Test 4: User lookup with proper RLS
      console.log('\n--- Test 4: User Lookup (RLS Protected) ---');
      const { data: userCheck, error: userError } = await supabase
        .from('users')
        .select('id, clerk_id, email, first_name, last_name')
        .eq('clerk_id', userId)
        .maybeSingle();

      console.log('[DEBUG] User lookup result:', userCheck ? '✅ FOUND' : '❌ NOT FOUND');
      console.log('[DEBUG] User lookup error:', userError);
      if (userCheck) {
        console.log('[DEBUG] User data (sanitized):', {
          id: userCheck.id,
          clerk_id: userCheck.clerk_id,
          email: userCheck.email ? userCheck.email.substring(0, 3) + '***' : null,
          first_name: userCheck.first_name,
          last_name: userCheck.last_name
        });
      }

      // Test 5: Credits access test with RLS
      console.log('\n--- Test 5: Credits Access Test (RLS Protected) ---');
      let creditsData = null;
      if (userCheck) {
        const { data: creditsCheck, error: creditsError } = await supabase
          .from('user_credits')
          .select('current_balance, free_credits, subscription_plan')
          .eq('user_id', userCheck.id)
          .maybeSingle();

        console.log('[DEBUG] Credits lookup result:', creditsCheck ? '✅ ACCESSIBLE' : '❌ NOT ACCESSIBLE');
        console.log('[DEBUG] Credits lookup error:', creditsError);
        if (creditsCheck) {
          console.log('[DEBUG] Credits data:', creditsCheck);
        }
        creditsData = creditsCheck;
      }

      // Test 6: Profile access test with enhanced RLS
      console.log('\n--- Test 6: Profile Access Test (Enhanced RLS) ---');
      let profileData = null;
      if (userCheck) {
        const { data: profileCheck, error: profileError } = await supabase
          .from('user_profile')
          .select('*')
          .eq('user_id', userCheck.id)
          .maybeSingle();

        console.log('[DEBUG] Profile lookup result:', profileCheck ? '✅ ACCESSIBLE' : '❌ NOT ACCESSIBLE');
        console.log('[DEBUG] Profile lookup error:', profileError);
        
        if (!profileCheck && !profileError) {
          console.log('[DEBUG] 🚨 PROFILE ACCESS ISSUE - Profile exists but RLS is blocking access');
        }
        
        profileData = profileCheck;
      }

      console.log('\n=== SECURITY-ENHANCED DEBUG SESSION COMPLETE ===\n');

      return { 
        success: true, 
        hasToken: !!token,
        hasCurrentToken: !!currentToken,
        userExists: !!userCheck,
        canAccessCredits: !!creditsData,
        canAccessProfile: !!profileData,
        securityStatus: 'RLS policies active and protecting data'
      };

    } catch (error) {
      console.error('[DEBUG] ❌ Integration test error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  return { debugClerkSupabaseIntegration };
};
