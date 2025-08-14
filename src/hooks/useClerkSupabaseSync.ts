
import { useUser, useAuth } from '@clerk/clerk-react';
import { useEffect, useRef, useState } from 'react';
import { setClerkToken, setTokenRefreshFunction } from '@/integrations/supabase/client';
import { Environment, debugEnvironment } from '@/utils/environment';

export const useClerkSupabaseSync = () => {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const syncedRef = useRef(false);
  const tokenSetRef = useRef(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout>();

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
            console.error('Failed to get token from Clerk:', error);
            return null;
          }
        };

        // Set the refresh function
        setTokenRefreshFunction(refreshFunction);

        // Get initial token
        const token = await getToken({ template: 'supabase' });
        
        if (token) {
          console.debug('🔄 Initial Clerk token sync, length:', token.length);
          const success = await setClerkToken(token);
          if (success) {
            syncedRef.current = true;
            tokenSetRef.current = true;
            console.debug('✅ Clerk token successfully synced to Supabase');
          }
        } else {
          console.warn('⚠️ No Clerk token available for initial sync');
        }
      } catch (error) {
        console.error('Error in token setup:', error);
        // Don't block the UI even if sync fails
        syncedRef.current = true;
      }
    };

    if (isLoaded && user && !syncedRef.current) {
      // Debounce the sync setup to prevent race conditions during OAuth
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      syncTimeoutRef.current = setTimeout(() => {
        setupTokenRefresh();
      }, 100); // Small delay to debounce rapid calls during OAuth
    } else if (isLoaded && !user && tokenSetRef.current) {
      // User logged out, clear the token
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
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
