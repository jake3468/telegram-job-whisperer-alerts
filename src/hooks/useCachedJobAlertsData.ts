
import { useState, useEffect, useCallback } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { logger } from '@/utils/logger';
import { useEnterpriseAuth } from '@/hooks/useEnterpriseAuth';
import { makeAuthenticatedRequest } from '@/integrations/supabase/client';

interface JobAlert {
  id: string;
  country: string;
  country_name?: string;
  location: string;
  job_title: string;
  job_type: 'full-time' | 'part-time' | 'contract' | 'intern';
  alert_frequency: string;
  preferred_time: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

interface CachedJobAlertsData {
  alerts: JobAlert[];
  isActivated: boolean;
  userProfileId: string;
  timestamp: number;
  version: string; // Add version field
}

const CACHE_KEY = 'aspirely_job_alerts_cache';
const CACHE_VERSION = 'v2'; // Updated version to invalidate old cache
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes for fresh data
const BACKGROUND_REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes - professional standard
let isRefreshing = false; // Request deduplication flag

export const useCachedJobAlertsData = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { isAuthReady, executeWithRetry } = useEnterpriseAuth();
  const [alerts, setAlerts] = useState<JobAlert[]>([]);
  const [isActivated, setIsActivated] = useState<boolean>(false);
  const [userProfileId, setUserProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionIssue, setConnectionIssue] = useState(false);

  // Load cached data immediately on mount with version check
  useEffect(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsedCache: CachedJobAlertsData = JSON.parse(cached);
        const now = Date.now();
        
        // Check cache version - invalidate old versions
        if (parsedCache.version !== CACHE_VERSION) {
          localStorage.removeItem(CACHE_KEY);
          return;
        }
        
        // Use cached data if it's less than cache duration old
        if (now - parsedCache.timestamp < CACHE_DURATION) {
          setAlerts(parsedCache.alerts);
          setIsActivated(parsedCache.isActivated);
          setUserProfileId(parsedCache.userProfileId);
          setLoading(false);
          logger.debug('Loaded cached job alerts data:', parsedCache);
        } else {
          localStorage.removeItem(CACHE_KEY);
        }
      }
    } catch (error) {
      logger.warn('Failed to load cached job alerts data:', error);
      localStorage.removeItem(CACHE_KEY);
    }
  }, []);

  // Professional token refresh every 25 minutes (not 5 minutes!)
  useEffect(() => {
    if (!user || !isAuthReady) return;

    const tokenRefreshInterval = setInterval(async () => {
      try {
        // Only refresh if user is active and no pending operations
        if (document.visibilityState === 'visible') {
          await getToken({ skipCache: true });
          logger.debug('Scheduled token refresh completed');
        }
      } catch (error) {
        logger.warn('Scheduled token refresh failed:', error);
      }
    }, 25 * 60 * 1000); // 25 minutes - professional standard

    return () => clearInterval(tokenRefreshInterval);
  }, [user?.id, isAuthReady, getToken]);

  // Fetch fresh data when user changes or auth becomes ready
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    // Don't fetch if we already have fresh cached data
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const parsedCache: CachedJobAlertsData = JSON.parse(cached);
        const now = Date.now();
        // Check cache version before using
        if (parsedCache.version !== CACHE_VERSION) {
          localStorage.removeItem(CACHE_KEY);
        } else if (now - parsedCache.timestamp < CACHE_DURATION) {
          setLoading(false);
          return;
        }
      } catch {
        // Invalid cache, continue to fetch
      }
    }
    
    if (isAuthReady) {
      fetchJobAlertsData();
    }
  }, [user?.id, isAuthReady]);

  // Background auto-refresh like professional sites (Google, Amazon)
  useEffect(() => {
    if (!user || !isAuthReady) return;

    const backgroundRefreshInterval = setInterval(() => {
      // Silent background refresh
      fetchJobAlertsData(true);
    }, BACKGROUND_REFRESH_INTERVAL);

    return () => clearInterval(backgroundRefreshInterval);
  }, [user?.id, isAuthReady]);

  // Fallback timeout for loading state
  useEffect(() => {
    if (loading && user) {
      const timeout = setTimeout(() => {
        if (loading && alerts.length === 0 && !userProfileId) {
          logger.warn('Loading timeout reached, showing empty state');
          setLoading(false);
          setError('Loading took too long. Please try refreshing the page.');
        }
      }, 8000); // 8 second timeout

      return () => clearTimeout(timeout);
    }
  }, [loading, user, alerts.length, userProfileId]);

  const fetchJobAlertsData = useCallback(async (silent = false) => {
    if (!user) return;
    
    if (!isAuthReady) {
      return;
    }
    
    // Request deduplication - prevent multiple simultaneous requests
    if (isRefreshing) {
      return;
    }
    
    isRefreshing = true;
    
    try {
      if (!silent) {
        setError(null);
        setConnectionIssue(false);
      }
      
      const result = await executeWithRetry(
        async () => {
          return await makeAuthenticatedRequest(async () => {
            const { supabase } = await import('@/integrations/supabase/client');
            
            // Simplified approach - let RLS policies handle user filtering
            // The RLS policies will automatically filter based on JWT token
            
            // First get user profile (needed for profile ID and bot status)
            const { data: profileData, error: profileError } = await supabase
              .from('user_profile')
              .select('id, bot_activated')
              .single();
              
            if (profileError) {
              logger.error('Profile fetch error:', profileError);
              throw profileError;
            }

            // Fetch job alerts - RLS will automatically filter for current user
            const { data: alertsData, error: alertsError } = await supabase
              .from('job_alerts')
              .select('*')
              .order('created_at', { ascending: false });

            if (alertsError) {
              logger.error('Alerts fetch error:', alertsError);
              throw alertsError;
            }

            return {
              alerts: alertsData || [],
              botActivated: profileData.bot_activated || false,
              userProfileId: profileData.id
            };
          });
        },
        5, // 5 retry attempts with exponential backoff
        'Fetching job alerts data'
      );

      // Update state
      setAlerts(result.alerts);
      setIsActivated(result.botActivated);
      setUserProfileId(result.userProfileId);

      // Cache the data
      try {
        const cacheData: CachedJobAlertsData = {
          alerts: result.alerts,
          isActivated: result.botActivated,
          userProfileId: result.userProfileId,
          timestamp: Date.now(),
          version: CACHE_VERSION
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        logger.debug('Cached fresh job alerts data:', cacheData);
      } catch (cacheError) {
        logger.warn('Failed to cache job alerts data:', cacheError);
      }

    } catch (error) {
      logger.error('Error fetching job alerts data:', error);
      
      if (!silent) {
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
        
        // Only show connection issue if we have no cached data
        if (alerts.length === 0) {
          setConnectionIssue(true);
        }
      }
    } finally {
      isRefreshing = false; // Reset deduplication flag
      if (!silent) {
        setLoading(false);
      }
    }
  }, [user, isAuthReady, executeWithRetry, alerts.length]);

  const invalidateCache = () => {
    localStorage.removeItem(CACHE_KEY);
    setConnectionIssue(false);
    fetchJobAlertsData();
  };

  const optimisticAdd = (newAlert: JobAlert) => {
    setAlerts(prev => [newAlert, ...prev]);
  };

  const forceRefresh = async () => {
    setConnectionIssue(false);
    setError(null);
    setLoading(true);
    await fetchJobAlertsData();
  };

  // Enhanced delete function with retry logic using authenticated requests
  const deleteJobAlert = async (alertId: string) => {
    if (!isAuthReady) {
      throw new Error('Authentication not ready, please wait...');
    }

    return await executeWithRetry(
      async () => {
        return await makeAuthenticatedRequest(async () => {
          const { supabase } = await import('@/integrations/supabase/client');
          const { error } = await supabase
            .from('job_alerts')
            .delete()
            .eq('id', alertId);
          
          if (error) throw error;
          
          // Optimistically remove from local state
          setAlerts(prev => prev.filter(alert => alert.id !== alertId));
          
          return true;
        });
      },
      3,
      `Deleting job alert ${alertId}`
    );
  };

  return {
    alerts,
    isActivated,
    userProfileId,
    loading,
    error,
    connectionIssue,
    isAuthReady,
    refetch: fetchJobAlertsData,
    optimisticAdd,
    invalidateCache,
    forceRefresh,
    deleteJobAlert,
    executeWithRetry
  };
};
