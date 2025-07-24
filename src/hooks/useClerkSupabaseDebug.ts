
import { useAuth } from '@clerk/clerk-react';
import { supabase, getCurrentJWTToken } from '@/integrations/supabase/client';
import { Environment } from '@/utils/environment';

export const useClerkSupabaseDebug = () => {
  const { getToken, isSignedIn, userId } = useAuth();

  const debugClerkSupabaseIntegration = async () => {
    // Disable debug functionality in production
    if (Environment.isProduction()) {
      return { success: true, securityStatus: 'Debug disabled in production' };
    }

    if (!isSignedIn || !getToken) {
      return { success: false, error: 'Not signed in' };
    }

    try {
      // Development-only debug functionality
      const token = await getToken({ template: 'supabase', skipCache: true });
      const currentToken = getCurrentJWTToken();
      
      const { data: userCheck } = await supabase
        .from('users')
        .select('id, clerk_id')
        .eq('clerk_id', userId)
        .maybeSingle();

      return { 
        success: true, 
        hasToken: !!token,
        hasCurrentToken: !!currentToken,
        userExists: !!userCheck,
        securityStatus: 'Development debug active'
      };

    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  return { debugClerkSupabaseIntegration };
};
