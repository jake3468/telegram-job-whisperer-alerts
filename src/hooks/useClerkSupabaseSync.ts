
import { useUser, useAuth } from '@clerk/clerk-react';
import { useEffect, useRef, useState } from 'react';
import { setClerkToken, setTokenRefreshFunction } from '@/integrations/supabase/client';

export const useClerkSupabaseSync = () => {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const syncedRef = useRef(false);
  const tokenSetRef = useRef(false);
  const [syncLoaded, setSyncLoaded] = useState(false);

  useEffect(() => {
    const setupTokenRefresh = async () => {
      if (!user || !isLoaded) return;

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
        
        setSyncLoaded(true);
      } catch (error) {
        console.error('[useClerkSupabaseSync] ❌ Error in token setup:', error);
        setSyncLoaded(true); // Set loaded even on error to prevent infinite loading
      }
    };

    if (isLoaded && user && !syncedRef.current) {
      setupTokenRefresh();
    } else if (isLoaded && !user) {
      // User logged out or not authenticated, clear the token
      if (tokenSetRef.current) {
        setClerkToken(null);
        tokenSetRef.current = false;
        syncedRef.current = false;
      }
      setSyncLoaded(true);
    } else if (isLoaded) {
      // Authentication is loaded but no user changes needed
      setSyncLoaded(true);
    }
  }, [user, isLoaded, getToken]);

  return { 
    isLoaded: isLoaded && syncLoaded, 
    user, 
    isSynced: syncedRef.current 
  };
};
