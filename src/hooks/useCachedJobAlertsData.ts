
import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { logger } from '@/utils/logger';
import { supabase } from '@/integrations/supabase/client';
import { useEnterpriseAPIClient } from './useEnterpriseAPIClient';
import { useEnhancedTokenManager } from './useEnhancedTokenManager';

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
const CACHE_VERSION = 'v5'; // Fixed RLS policies
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes for fresh data
const BACKGROUND_REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes - professional standard
let isRefreshing = false; // Request deduplication flag

export const useCachedJobAlertsData = () => {
  const { user } = useUser();
  const { makeAuthenticatedRequest } = useEnterpriseAPIClient();
  const { refreshToken, isTokenValid, isReady } = useEnhancedTokenManager();
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


  // Fetch fresh data when user changes and token is ready
  useEffect(() => {
    if (!user || !isReady) {
      setLoading(false);
      return;
    }
    
    // Don't fetch if we already have fresh cached data AND token is valid
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached && isTokenValid()) {
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
    
    fetchJobAlertsData();
  }, [user?.id, isReady, isTokenValid]);

  // Background auto-refresh
  useEffect(() => {
    if (!user) return;

    const backgroundRefreshInterval = setInterval(() => {
      fetchJobAlertsData(true);
    }, BACKGROUND_REFRESH_INTERVAL);

    return () => clearInterval(backgroundRefreshInterval);
  }, [user?.id]);

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
    if (!user) {
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
      
      // Pre-flight token validation - ensure token is valid before making requests
      if (!isTokenValid()) {
        logger.debug('Token invalid, refreshing before data fetch');
        const newToken = await refreshToken(true);
        if (!newToken) {
          throw new Error('Authentication failed. Please try signing out and back in.');
        }
      }
      
      // Use enterprise session management for authenticated requests
      let profileData, alertsData;
      
      await makeAuthenticatedRequest(async () => {
        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('user_profile')
          .select('id, bot_activated')
          .maybeSingle();
          
        if (profileError) {
          throw new Error(`Profile fetch failed: ${profileError.message}`);
        }
        
        if (!profile) {
          throw new Error('User profile not found. Please try signing out and back in.');
        }
        
        profileData = profile;

        // Fetch job alerts
        const { data: alerts, error: alertsError } = await supabase
          .from('job_alerts')
          .select('*')
          .order('created_at', { ascending: false });

        if (alertsError) {
          throw alertsError;
        }
        
        alertsData = alerts;
      });

      const result = {
        alerts: alertsData || [],
        botActivated: profileData.bot_activated || false,
        userProfileId: profileData.id
      };

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
      } catch (cacheError) {
        logger.warn('Failed to cache job alerts data:', cacheError);
      }

    } catch (error) {
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
  }, [user, alerts.length, isTokenValid, refreshToken, makeAuthenticatedRequest]);

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

  // Simple delete function using enterprise session management
  const deleteJobAlert = async (alertId: string) => {
    await makeAuthenticatedRequest(async () => {
      const { error } = await supabase
        .from('job_alerts')
        .delete()
        .eq('id', alertId);
      
      if (error) throw error;
    });
    
    // Optimistically remove from local state
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    
    return true;
  };

  return {
    alerts,
    isActivated,
    userProfileId,
    loading,
    error,
    connectionIssue,
    refetch: fetchJobAlertsData,
    optimisticAdd,
    invalidateCache,
    forceRefresh,
    deleteJobAlert
  };
};
