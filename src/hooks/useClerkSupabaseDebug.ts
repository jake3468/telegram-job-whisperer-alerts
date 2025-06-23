
import { useAuth } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';

export const useClerkSupabaseDebug = () => {
  const { getToken, isSignedIn, userId } = useAuth();

  const debugClerkSupabaseIntegration = async () => {
    console.log('\n=== ENHANCED CLERK-SUPABASE DEBUG SESSION V3 ===');
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

      // Test 2: Check current Supabase session
      console.log('\n--- Test 2: Current Supabase Session ---');
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        console.log('[DEBUG] Supabase session exists:', session ? '✅ YES' : '❌ NO');
        console.log('[DEBUG] Session error:', sessionError);
        
        if (session) {
          console.log('[DEBUG] Session user:', session.user ? '✅ FOUND' : '❌ NOT FOUND');
          console.log('[DEBUG] Session access token present:', session.access_token ? '✅ YES' : '❌ NO');
          console.log('[DEBUG] Session expires at:', new Date(session.expires_at * 1000).toISOString());
        }
      } catch (e) {
        console.log('[DEBUG] Supabase session error:', e);
      }

      // Test 3: Check Supabase auth user
      console.log('\n--- Test 3: Supabase Auth User ---');
      try {
        const { data: authUser, error: authError } = await supabase.auth.getUser();
        console.log('[DEBUG] Supabase auth user:', authUser.user ? '✅ FOUND' : '❌ NOT FOUND');
        console.log('[DEBUG] Auth error:', authError);
        if (authUser.user) {
          console.log('[DEBUG] Auth user role:', authUser.user.role || 'no_role');
          console.log('[DEBUG] Auth user aud:', authUser.user.aud || 'no_aud');
        }
      } catch (e) {
        console.log('[DEBUG] Supabase auth user error:', e);
      }

      // Test 4: Enhanced JWT debugging function
      console.log('\n--- Test 4: Enhanced JWT Debug Function ---');
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

      // Test 5: User lookup
      console.log('\n--- Test 5: User Lookup ---');
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

      // Test 6: Profile access test with enhanced debugging
      console.log('\n--- Test 6: Profile Access Test (MAIN ISSUE) ---');
      let profileData = null;
      if (userCheck) {
        // First try with current RLS
        const { data: profileCheck, error: profileError } = await supabase
          .from('user_profile')
          .select('*')
          .eq('user_id', userCheck.id)
          .maybeSingle();

        console.log('[DEBUG] Profile lookup result:', profileCheck ? '✅ ACCESSIBLE' : '❌ NOT ACCESSIBLE');
        console.log('[DEBUG] Profile lookup error:', profileError);
        
        profileData = profileCheck;
      }

      // Test 7: Direct auth state check
      console.log('\n--- Test 7: Direct Auth State Check ---');
      try {
        const { data: authStateData, error: authStateError } = await supabase.rpc('debug_user_auth');
        console.log('[DEBUG] Current auth state for profile access:', authStateData);
        console.log('[DEBUG] Auth state error:', authStateError);
      } catch (e) {
        console.log('[DEBUG] Auth state check error:', e);
      }

      console.log('\n=== ENHANCED DEBUG SESSION V3 COMPLETE ===\n');

      return { 
        success: true, 
        hasToken: !!token,
        userExists: !!userCheck,
        canAccessProfile: !!profileData
      };

    } catch (error) {
      console.error('[DEBUG] ❌ Integration test error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  return { debugClerkSupabaseIntegration };
};
