
import { useAuth } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';

export const useClerkSupabaseDebug = () => {
  const { getToken, isSignedIn, userId } = useAuth();

  const debugClerkSupabaseIntegration = async () => {
    console.log('\n=== ENHANCED CLERK-SUPABASE DEBUG SESSION ===');
    console.log('[DEBUG] Clerk isSignedIn:', isSignedIn);
    console.log('[DEBUG] Clerk userId:', userId);

    if (!isSignedIn || !getToken) {
      console.log('[DEBUG] ❌ User not signed in or getToken not available');
      return { success: false, error: 'Not signed in' };
    }

    try {
      // Test 1: Get Clerk JWT token with supabase template
      console.log('\n--- Test 1: Clerk JWT Token ---');
      const token = await getToken({ template: 'supabase' });
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
            role: payload.role || 'not_set'
          });
        } catch (e) {
          console.log('[DEBUG] Could not decode token payload:', e);
        }
      }

      // Test 2: Check Supabase connection
      console.log('\n--- Test 2: Supabase Connection ---');
      try {
        const { data: authUser } = await supabase.auth.getUser();
        console.log('[DEBUG] Supabase auth user:', authUser.user ? '✅ FOUND' : '❌ NOT FOUND');
        if (authUser.user) {
          console.log('[DEBUG] Supabase user role:', authUser.user.role || 'no_role');
        }
      } catch (e) {
        console.log('[DEBUG] Supabase auth error:', e);
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
      if (userCheck) {
        const { data: creditsCheck, error: creditsError } = await supabase
          .from('user_credits')
          .select('*')
          .eq('user_id', userCheck.id)
          .maybeSingle();

        console.log('[DEBUG] Credits lookup result:', creditsCheck ? '✅ ACCESSIBLE' : '❌ NOT ACCESSIBLE');
        console.log('[DEBUG] Credits lookup error:', creditsError);
        if (creditsCheck) {
          console.log('[DEBUG] Credits data:', {
            current_balance: creditsCheck.current_balance,
            free_credits: creditsCheck.free_credits,
            subscription_plan: creditsCheck.subscription_plan
          });
        }
      }

      // Test 6: Profile access test (the main issue)
      console.log('\n--- Test 6: Profile Access Test (MAIN ISSUE) ---');
      if (userCheck) {
        const { data: profileCheck, error: profileError } = await supabase
          .from('user_profile')
          .select('*')
          .eq('user_id', userCheck.id)
          .maybeSingle();

        console.log('[DEBUG] Profile lookup result:', profileCheck ? '✅ ACCESSIBLE' : '❌ NOT ACCESSIBLE');
        console.log('[DEBUG] Profile lookup error:', profileError);
        if (profileCheck) {
          console.log('[DEBUG] Profile data:', {
            id: profileCheck.id,
            user_id: profileCheck.user_id,
            bio: profileCheck.bio ? 'has_bio' : 'no_bio'
          });
        } else {
          console.log('[DEBUG] 🚨 PROFILE ACCESS ISSUE - This is likely the root cause!');
        }
      }

      // Test 7: Direct profile query with user_id
      console.log('\n--- Test 7: Direct Profile Query ---');
      if (userCheck) {
        try {
          const { data: directProfile, error: directError } = await supabase
            .from('user_profile')
            .select('id, user_id, bio, created_at')
            .eq('user_id', userCheck.id);
          
          console.log('[DEBUG] Direct profile query result:', directProfile);
          console.log('[DEBUG] Direct profile query error:', directError);
        } catch (directErr) {
          console.log('[DEBUG] Direct profile query exception:', directErr);
        }
      }

      console.log('\n=== ENHANCED DEBUG SESSION COMPLETE ===\n');

      return { 
        success: true, 
        hasToken: !!token,
        userExists: !!userCheck,
        canAccessCredits: !!userCheck && !userError,
        canAccessProfile: !!profileCheck
      };

    } catch (error) {
      console.error('[DEBUG] ❌ Integration test error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  return { debugClerkSupabaseIntegration };
};
