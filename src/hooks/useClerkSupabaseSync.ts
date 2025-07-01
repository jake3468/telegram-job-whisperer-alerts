
import { useUser, useAuth } from '@clerk/clerk-react';
import { useEffect, useRef } from 'react';
import { setClerkToken, setTokenRefreshFunction } from '@/integrations/supabase/client';

export const useClerkSupabaseSync = () => {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const syncedRef = useRef(false);
  const tokenSetRef = useRef(false);

  useEffect(() => {
    const setupTokenRefresh = async () => {
      if (!user || !isLoaded) return;

      try {
        // Set up the token refresh function
        const refreshFunction = async () => {
          try {
            console.log('[useClerkSupabaseSync] 🔄 Token refresh function called');
            const token = await getToken({ template: 'supabase' });
            console.log('[useClerkSupabaseSync] ✅ New token obtained from Clerk');
            return token;
          } catch (error) {
            console.error('[useClerkSupabaseSync] ❌ Failed to get token from Clerk:', error);
            return null;
          }
        };

        // Set the refresh function
        setTokenRefreshFunction(refreshFunction);

        // Get initial token
        const token = await getToken({ template: 'supabase' });
        
        if (token) {
          const success = await setClerkToken(token);
          if (success) {
            console.log('[useClerkSupabaseSync] ✅ Initial Clerk-Supabase sync completed');
            syncedRef.current = true;
            tokenSetRef.current = true;
          }
        }
      } catch (error) {
        console.error('[useClerkSupabaseSync] ❌ Error in token setup:', error);
      }
    };

    if (isLoaded && user && !syncedRef.current) {
      setupTokenRefresh();
    } else if (isLoaded && !user && tokenSetRef.current) {
      // User logged out, clear the token
      setClerkToken(null);
      tokenSetRef.current = false;
      syncedRef.current = false;
      console.log('[useClerkSupabaseSync] 🔄 User logged out, tokens cleared');
    }
  }, [user, isLoaded, getToken]);

  return { isLoaded, user, isSynced: syncedRef.current };
};
