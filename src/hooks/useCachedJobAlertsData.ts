import { useState, useEffect } from 'react';
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
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

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
          setLoading(false); // Mark as loaded since we have cached data
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

  // Fetch fresh data only when user changes or when explicitly requested
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    // Only fetch if we don't have cached data or user has changed
    const shouldFetch = alerts.length === 0 && !error;
    if (shouldFetch) {
      fetchJobAlertsData();
    } else {
      setLoading(false);
    }
  }, [user?.id]); // Only depend on user ID, not the entire user object

  const fetchJobAlertsData = async () => {
    if (!user) return;
    
    if (!isAuthReady) {
      logger.debug('[JobAlertsData] Authentication not ready, waiting...');
      return;
    }
    
    try {
      setError(null);
      
      const result = await executeWithRetry(
        async () => {
          // Get user's database ID
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('clerk_id', user.id)
            .maybeSingle();
            
          if (userError || !userData) {
            throw new Error('Failed to fetch user data');
          }

          // Get user profile
          const { data: profileData, error: profileError } = await supabase
            .from('user_profile')
            .select('id, bot_activated')
            .eq('user_id', userData.id)
            .maybeSingle();
            
          if (profileError || !profileData) {
            throw new Error('Failed to fetch profile data');
          }

          // Fetch job alerts
          const { data: alertsData, error: alertsError } = await supabase
            .from('job_alerts')
            .select('*')
            .eq('user_id', profileData.id)
            .order('created_at', { ascending: false });

          if (alertsError) {
            throw new Error('Failed to fetch job alerts');
          }

          return {
            alerts: alertsData || [],
            botActivated: profileData.bot_activated || false,
            userProfileId: profileData.id
          };
        },
        3,
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
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      
      // If we have no cached data, show connection issue
      if (alerts.length === 0) {
        setConnectionIssue(true);
      }
    } finally {
      setLoading(false);
    }
  };

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