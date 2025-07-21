
import { useUser, useAuth } from '@clerk/clerk-react';
import { useEffect, useRef, useState } from 'react';
import { setClerkToken, setTokenRefreshFunction } from '@/integrations/supabase/client';
import { Environment, debugEnvironment } from '@/utils/environment';

export const useClerkSupabaseSync = () => {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const syncedRef = useRef(false);
  const tokenSetRef = useRef(false);

  useEffect(() => {
    const setupTokenRefresh = async () => {
      if (!user || !isLoaded || syncedRef.current) return;

      console.log('Setting up Clerk-Supabase sync for user:', user.id);

      try {
        // Set up the token refresh function
        const refreshFunction = async () => {
          try {
            const token = await getToken({ template: 'supabase' });
            console.log('Token refreshed:', token ? 'Success' : 'Failed');
            return token;
          } catch (error) {
            console.error('Failed to get token from Clerk:', error);
            return null;
          }
        };

        // Set the refresh function
        setTokenRefreshFunction(refreshFunction);

        // Get initial token
        const token = await getToken({ template: 'supabase' });
        
        if (token) {
          const success = await setClerkToken(token);
          console.log('Initial token set:', success);
          if (success) {
            syncedRef.current = true;
            tokenSetRef.current = true;
          }
        }
      } catch (error) {
        console.error('Error in token setup:', error);
        // Don't block the UI even if sync fails
        syncedRef.current = true;
      }
    };

    if (isLoaded && user && !syncedRef.current) {
      // Setup sync but don't block the UI
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
