
import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { useEnterpriseAuth } from '@/hooks/useEnterpriseAuth';

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
}

const CACHE_KEY = 'aspirely_job_alerts_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes for fresh data
const BACKGROUND_REFRESH_INTERVAL = 3 * 60 * 1000; // 3 minutes like professional sites

export const useCachedJobAlertsData = () => {
  const { user } = useUser();
  const { isAuthReady, executeWithRetry } = useEnterpriseAuth();
  const [alerts, setAlerts] = useState<JobAlert[]>([]);
  const [isActivated, setIsActivated] = useState<boolean>(false);
  const [userProfileId, setUserProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionIssue, setConnectionIssue] = useState(false);

  // Load cached data immediately on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsedCache: CachedJobAlertsData = JSON.parse(cached);
        const now = Date.now();
        
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

  // Professional token refresh every 5 minutes
  useEffect(() => {
    if (!user || !isAuthReady) return;

    const tokenRefreshInterval = setInterval(async () => {
      try {
        // Trigger a silent token refresh
        await user.getToken({ skipCache: true });
        logger.debug('Token refreshed silently');
      } catch (error) {
        logger.warn('Token refresh failed:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(tokenRefreshInterval);
  }, [user, isAuthReady]);

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
        if (now - parsedCache.timestamp < CACHE_DURATION) {
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
      logger.debug('[JobAlertsData] Authentication not ready, waiting...');
      return;
    }
    
    try {
      if (!silent) {
        setError(null);
        setConnectionIssue(false);
      }
      
      const result = await executeWithRetry(
        async () => {
          // Get fresh token
          const token = await user.getToken({ skipCache: true });
          if (!token) {
            throw new Error('Authentication token not available');
          }

          // Get user's database ID
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('clerk_id', user.id)
            .maybeSingle();
            
          if (userError) {
            logger.error('User fetch error:', userError);
            throw new Error('Failed to fetch user data');
          }
          
          if (!userData) {
            throw new Error('User not found in database');
          }

          // Get user profile
          const { data: profileData, error: profileError } = await supabase
            .from('user_profile')
            .select('id, bot_activated')
            .eq('user_id', userData.id)
            .maybeSingle();
            
          if (profileError) {
            logger.error('Profile fetch error:', profileError);
            throw new Error('Failed to fetch profile data');
          }
          
          if (!profileData) {
            throw new Error('User profile not found');
          }

          // Fetch job alerts
          const { data: alertsData, error: alertsError } = await supabase
            .from('job_alerts')
            .select('*')
            .eq('user_id', profileData.id)
            .order('created_at', { ascending: false });

          if (alertsError) {
            logger.error('Alerts fetch error:', alertsError);
            throw new Error('Failed to fetch job alerts');
          }

          return {
            alerts: alertsData || [],
            botActivated: profileData.bot_activated || false,
            userProfileId: profileData.id
          };
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
          timestamp: Date.now()
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

  // Enhanced delete function with retry logic
  const deleteJobAlert = async (alertId: string) => {
    if (!isAuthReady) {
      throw new Error('Authentication not ready, please wait...');
    }

    return await executeWithRetry(
      async () => {
        const { error } = await supabase
          .from('job_alerts')
          .delete()
          .eq('id', alertId);
        
        if (error) throw error;
        
        // Optimistically remove from local state
        setAlerts(prev => prev.filter(alert => alert.id !== alertId));
        
        return true;
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
