
import { useAuth } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';

export const useClerkSupabaseDebug = () => {
  const { getToken, isSignedIn, userId } = useAuth();

  const debugClerkSupabaseIntegration = async () => {
    console.log('\n=== ENHANCED CLERK-SUPABASE DEBUG SESSION V4 ===');
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
        
        // Decode token payload for debugging
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          console.log('[DEBUG] Token payload details:', {
            iss: payload.iss,
            sub: payload.sub,
            aud: payload.aud,
            exp: payload.exp,
            iat: payload.iat,
            role: payload.role || 'not_set',
            azp: payload.azp || 'not_set'
          });
        } catch (e) {
          console.log('[DEBUG] Could not decode token payload:', e);
        }
      }

      // Test 2: Check authorization header
      console.log('\n--- Test 2: Authorization Header Check ---');
      const authHeader = supabase.rest.headers['Authorization'];
      console.log('[DEBUG] Authorization header set:', authHeader ? '✅ YES' : '❌ NO');
      if (authHeader) {
        console.log('[DEBUG] Auth header preview:', authHeader.substring(0, 50) + '...');
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
          console.log('  - Current setting claims:', result.current_setting_claims || '❌ NOT FOUND');
        }
      } catch (rpcError) {
        console.log('[DEBUG] RPC function error:', rpcError);
      }

      // Test 4: User lookup
      console.log('\n--- Test 4: User Lookup ---');
      const { data: userCheck, error: userError } = await supabase
        .from('users')
        .select('id, clerk_id, email')
        .eq('clerk_id', userId)
        .maybeSingle();

      console.log('[DEBUG] User lookup result:', userCheck ? '✅ FOUND' : '❌ NOT FOUND');
      console.log('[DEBUG] User lookup error:', userError);
      if (userCheck) {
        console.log('[DEBUG] User data:', userCheck);
      }

      // Test 5: Credits access test
      console.log('\n--- Test 5: Credits Access Test ---');
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

      // Test 6: Profile access test (MAIN ISSUE)
      console.log('\n--- Test 6: Profile Access Test (MAIN ISSUE) ---');
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

      // Test 7: Direct profile query (bypass user lookup)
      console.log('\n--- Test 7: Direct Profile Query ---');
      const { data: directProfile, error: directError } = await supabase
        .from('user_profile')
        .select('*')
        .limit(5);

      console.log('[DEBUG] Direct profile query result:', directProfile || []);
      console.log('[DEBUG] Direct profile query error:', directError);

      console.log('\n=== ENHANCED DEBUG SESSION V4 COMPLETE ===\n');

      return { 
        success: true, 
        hasToken: !!token,
        hasAuthHeader: !!authHeader,
        userExists: !!userCheck,
        canAccessCredits: !!creditsData,
        canAccessProfile: !!profileData
      };

    } catch (error) {
      console.error('[DEBUG] ❌ Integration test error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  return { debugClerkSupabaseIntegration };
};
