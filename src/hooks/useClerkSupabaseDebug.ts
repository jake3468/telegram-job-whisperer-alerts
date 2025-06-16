
import { useAuth } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';

export const useClerkSupabaseDebug = () => {
  const { getToken, isSignedIn, userId } = useAuth();

  const debugClerkSupabaseIntegration = async () => {
    console.log('[DEBUG] Starting Clerk-Supabase integration test');
    console.log('[DEBUG] Clerk isSignedIn:', isSignedIn);
    console.log('[DEBUG] Clerk userId:', userId);

    if (!isSignedIn || !getToken) {
      console.log('[DEBUG] User not signed in or getToken not available');
      return;
    }

    try {
      // Test 1: Get Clerk JWT token
      const token = await getToken({ template: 'supabase' });
      console.log('[DEBUG] Clerk JWT token obtained:', token ? 'YES' : 'NO');
      
      if (token) {
        const maskedToken = token.substring(0, 20) + '...';
        console.log('[DEBUG] Token (masked):', maskedToken);
      }

      // Test 2: Check if we can query users table
      const { data: userCheck, error: userError } = await supabase
        .from('users')
        .select('id, clerk_id')
        .eq('clerk_id', userId)
        .maybeSingle();

      console.log('[DEBUG] User lookup result:', userCheck);
      console.log('[DEBUG] User lookup error:', userError);

      // Test 3: Try to query user_credits with RLS
      if (userCheck) {
        const { data: creditsCheck, error: creditsError } = await supabase
          .from('user_credits')
          .select('*')
          .eq('user_id', userCheck.id)
          .maybeSingle();

        console.log('[DEBUG] Credits lookup result:', creditsCheck);
        console.log('[DEBUG] Credits lookup error:', creditsError);
      }

      // Test 4: Check what JWT claims are available
      try {
        const response = await supabase.rpc('get_current_user_id_from_clerk');
        console.log('[DEBUG] get_current_user_id_from_clerk result:', response);
      } catch (rpcError) {
        console.log('[DEBUG] RPC function error:', rpcError);
      }

    } catch (error) {
      console.error('[DEBUG] Integration test error:', error);
    }
  };

  return { debugClerkSupabaseIntegration };
};
