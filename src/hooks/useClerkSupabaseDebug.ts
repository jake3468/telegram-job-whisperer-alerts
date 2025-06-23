
import { useAuth } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';

export const useClerkSupabaseDebug = () => {
  const { getToken, isSignedIn, userId } = useAuth();

  const debugClerkSupabaseIntegration = async () => {
    console.log('\n=== CLERK-SUPABASE DEBUG SESSION ===');
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
        
        // Decode token payload for debugging (first part only)
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          console.log('[DEBUG] Token payload:', {
            iss: payload.iss,
            sub: payload.sub,
            aud: payload.aud,
            exp: payload.exp,
            iat: payload.iat
          });
        } catch (e) {
          console.log('[DEBUG] Could not decode token payload');
        }
      }

      // Test 2: Check Supabase connection
      console.log('\n--- Test 2: Supabase Connection ---');
      try {
        const { data: authUser } = await supabase.auth.getUser();
        console.log('[DEBUG] Supabase auth user:', authUser.user ? '✅ FOUND' : '❌ NOT FOUND');
      } catch (e) {
        console.log('[DEBUG] Supabase auth error:', e);
      }

      // Test 3: Check JWT debugging function
      console.log('\n--- Test 3: JWT Debug Function ---');
      try {
        const { data: debugData, error: debugError } = await supabase.rpc('debug_user_auth');
        console.log('[DEBUG] debug_user_auth result:', debugData);
        console.log('[DEBUG] debug_user_auth error:', debugError);
      } catch (rpcError) {
        console.log('[DEBUG] RPC function error:', rpcError);
      }

      // Test 4: Check if user exists in users table
      console.log('\n--- Test 4: User Lookup ---');
      const { data: userCheck, error: userError } = await supabase
        .from('users')
        .select('id, clerk_id, email')
        .eq('clerk_id', userId)
        .maybeSingle();

      console.log('[DEBUG] User lookup result:', userCheck ? '✅ FOUND' : '❌ NOT FOUND');
      console.log('[DEBUG] User lookup error:', userError);
      console.log('[DEBUG] User data:', userCheck);

      // Test 5: Try to query user_credits with current auth
      console.log('\n--- Test 5: Credits Access Test ---');
      if (userCheck) {
        const { data: creditsCheck, error: creditsError } = await supabase
          .from('user_credits')
          .select('*')
          .eq('user_id', userCheck.id)
          .maybeSingle();

        console.log('[DEBUG] Credits lookup result:', creditsCheck ? '✅ ACCESSIBLE' : '❌ NOT ACCESSIBLE');
        console.log('[DEBUG] Credits lookup error:', creditsError);
        console.log('[DEBUG] Credits data:', creditsCheck);
      }

      // Test 6: Try to query user_profile
      console.log('\n--- Test 6: Profile Access Test ---');
      if (userCheck) {
        const { data: profileCheck, error: profileError } = await supabase
          .from('user_profile')
          .select('*')
          .eq('user_id', userCheck.id)
          .maybeSingle();

        console.log('[DEBUG] Profile lookup result:', profileCheck ? '✅ ACCESSIBLE' : '❌ NOT ACCESSIBLE');
        console.log('[DEBUG] Profile lookup error:', profileError);
        console.log('[DEBUG] Profile data:', profileCheck);
      }

      console.log('\n=== DEBUG SESSION COMPLETE ===\n');

      return { 
        success: true, 
        hasToken: !!token,
        userExists: !!userCheck,
        canAccessData: !!userCheck && !userError
      };

    } catch (error) {
      console.error('[DEBUG] ❌ Integration test error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  return { debugClerkSupabaseIntegration };
};
