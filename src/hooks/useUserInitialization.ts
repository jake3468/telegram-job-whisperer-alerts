
import { useState, useCallback, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';
import { debugLogger } from '@/utils/debugUtils';

// Cache to prevent duplicate initialization requests
const initializationCache = new Map<string, Promise<any>>();
const initializedUsers = new Set<string>();

export const useUserInitialization = () => {
  const { user } = useUser();
  const [isInitializing, setIsInitializing] = useState(false);
  const requestRef = useRef<AbortController | null>(null);

  const initializeUser = useCallback(async () => {
    if (!user) {
      debugLogger.log('No user found, skipping initialization');
      return { success: false, error: 'No user found' };
    }

    // Check if user is already initialized
    if (initializedUsers.has(user.id)) {
      debugLogger.log('User already initialized, skipping');
      return { success: true, message: 'User already initialized' };
    }

    // Check if initialization is already in progress
    if (initializationCache.has(user.id)) {
      debugLogger.log('Initialization already in progress, waiting...');
      return await initializationCache.get(user.id);
    }

    // Cancel any previous request
    if (requestRef.current) {
      requestRef.current.abort();
    }

    setIsInitializing(true);

    // Create new abort controller
    requestRef.current = new AbortController();

    const initializationPromise = (async () => {
      try {
        debugLogger.log('Initializing user:', user.id);
        
        const { data, error } = await supabase.functions.invoke('user-management', {
          body: {
            clerk_id: user.id,
            email: user.emailAddresses?.[0]?.emailAddress || user.primaryEmailAddress?.emailAddress,
            first_name: user.firstName,
            last_name: user.lastName
          }
        });

        if (error) {
          debugLogger.error('Error initializing user:', error);
          return { success: false, error: error.message };
        }

        // Mark user as initialized
        initializedUsers.add(user.id);
        debugLogger.log('User initialization successful');
        return { success: true, data };

      } catch (error) {
        // Don't log if request was aborted
        if (error instanceof Error && error.name === 'AbortError') {
          return { success: false, error: 'Request aborted' };
        }
        
        debugLogger.error('Error in initializeUser:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to initialize user' };
      } finally {
        setIsInitializing(false);
        // Clean up cache after request completes
        initializationCache.delete(user.id);
      }
    })();

    // Store promise in cache
    initializationCache.set(user.id, initializationPromise);

    return await initializationPromise;
  }, [user]);

  return {
    initializeUser,
    isInitializing
  };
};
