
import { useUser, useAuth } from '@clerk/clerk-react';
import { useEffect, useRef, useState } from 'react';
import { setClerkToken, setTokenRefreshFunction } from '@/integrations/supabase/client';

export const useClerkSupabaseSync = () => {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const syncedRef = useRef(false);
  const tokenSetRef = useRef(false);

  useEffect(() => {
    const setupTokenRefresh = async () => {
      if (!user || !isLoaded || syncedRef.current) return;

      try {
        // Set up the token refresh function
        const refreshFunction = async () => {
          try {
            const token = await getToken({ template: 'supabase' });
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
    }
  }, [user, isLoaded, getToken]);

  return { 
    isLoaded: isLoaded, 
    user, 
    isSynced: syncedRef.current 
  };
};
