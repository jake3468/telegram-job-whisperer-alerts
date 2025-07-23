
import { useState, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';

// Global cache for user initialization to prevent duplicate calls
const initializationCache = new Map<string, Promise<{ success: boolean; error?: string; data?: any }>>();
const lastInitializationTime = new Map<string, number>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useUserInitialization = () => {
  const { user } = useUser();
  const [isInitializing, setIsInitializing] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const initializeUser = async () => {
    if (!user) {
      return { success: false, error: 'No user found' };
    }

    const userId = user.id;
    const now = Date.now();
    
    // Check if we have a recent successful initialization
    const lastTime = lastInitializationTime.get(userId);
    if (lastTime && (now - lastTime) < CACHE_DURATION) {
      console.log('[UserInit] Using recent initialization cache for:', userId);
      return { success: true, data: null };
    }

    // Check if initialization is already in progress
    const existingPromise = initializationCache.get(userId);
    if (existingPromise) {
      console.log('[UserInit] Joining existing initialization for:', userId);
      setIsInitializing(true);
      try {
        const result = await existingPromise;
        return result;
      } finally {
        setIsInitializing(false);
      }
    }

    // Start new initialization
    console.log('[UserInit] Starting new initialization for:', userId);
    setIsInitializing(true);

    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();

    const initPromise = (async () => {
      try {
        // Call the edge function to create/verify user
        const { data, error } = await supabase.functions.invoke('user-management', {
          body: {
            clerk_id: user.id,
            email: user.emailAddresses?.[0]?.emailAddress || user.primaryEmailAddress?.emailAddress,
            first_name: user.firstName,
            last_name: user.lastName
          }
        });

        if (error) {
          console.error('[UserInit] Error:', error);
          return { success: false, error: error.message };
        }

        // Cache successful initialization
        lastInitializationTime.set(userId, now);
        console.log('[UserInit] Successfully initialized user:', userId);
        return { success: true, data };

      } catch (error) {
        console.error('[UserInit] Exception:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to initialize user' };
      }
    })();

    // Cache the promise
    initializationCache.set(userId, initPromise);

    try {
      const result = await initPromise;
      return result;
    } finally {
      setIsInitializing(false);
      // Clean up cache after completion
      setTimeout(() => {
        initializationCache.delete(userId);
      }, 1000);
    }
  };

  return {
    initializeUser,
    isInitializing
  };
};
