
import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [debugInfo, setDebugInfo] = useState<any>({});
  
  // Refs for tracking state
  const isRequestInProgressRef = useRef(false);
  const lastValidTokenRef = useRef<string | null>(null);
  const lastSuccessfulFetchRef = useRef<number>(0);

  // Enhanced cache loading with token awareness
  useEffect(() => {
    const loadCachedData = () => {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) return false;

        const parsedCache: CachedJobAlertsData = JSON.parse(cached);
        const now = Date.now();
        
        // Enhanced cache validation
        const isCacheValid = parsedCache.version === CACHE_VERSION && 
                           (now - parsedCache.timestamp < CACHE_DURATION);
        
        if (!isCacheValid) {
          localStorage.removeItem(CACHE_KEY);
          setDebugInfo(prev => ({ ...prev, cacheInvalidated: 'version_or_expired', timestamp: now }));
          return false;
        }
        
        // Additional validation: ensure we have valid token when using cache
        if (isReady && !isTokenValid()) {
          setDebugInfo(prev => ({ ...prev, cacheSkipped: 'invalid_token', timestamp: now }));
          return false;
        }
        
        // Load valid cached data
        setAlerts(parsedCache.alerts);
        setIsActivated(parsedCache.isActivated);
        setUserProfileId(parsedCache.userProfileId);
        setLoading(false);
        lastSuccessfulFetchRef.current = parsedCache.timestamp;
        
        setDebugInfo(prev => ({ 
          ...prev, 
          cacheLoaded: true, 
          cacheAge: now - parsedCache.timestamp,
          alertCount: parsedCache.alerts.length,
          timestamp: now 
        }));
        
        return true;
      } catch (error) {
        logger.warn('[JobAlerts] Cache loading failed:', error);
        localStorage.removeItem(CACHE_KEY);
        setDebugInfo(prev => ({ ...prev, cacheError: error.message, timestamp: Date.now() }));
        return false;
      }
    };

    loadCachedData();
  }, [isReady, isTokenValid]);


  // Enhanced fetch trigger with token state tracking
  useEffect(() => {
    if (!user || !isReady) {
      setLoading(false);
      setDebugInfo(prev => ({ ...prev, skipReason: 'no_user_or_not_ready', timestamp: Date.now() }));
      return;
    }

    const currentToken = 'current_session'; // Use session indicator instead
    const tokenChanged = isReady && !isTokenValid();
    
    // Smart fetch decision based on cache freshness and token state
    const shouldFetchFresh = () => {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return true;
      
      try {
        const parsedCache: CachedJobAlertsData = JSON.parse(cached);
        const now = Date.now();
        const isCacheExpired = (now - parsedCache.timestamp) >= CACHE_DURATION;
        const hasValidToken = isTokenValid();
        
        setDebugInfo(prev => ({ 
          ...prev, 
          shouldFetch: { isCacheExpired, hasValidToken, tokenChanged, cacheAge: now - parsedCache.timestamp },
          timestamp: now 
        }));
        
        // Fetch if cache expired, token changed, or token invalid
        return isCacheExpired || tokenChanged || !hasValidToken;
      } catch {
        return true; // Fetch if cache parsing fails
      }
    };

    if (shouldFetchFresh()) {
      lastValidTokenRef.current = currentToken;
      fetchJobAlertsData();
    } else {
      setLoading(false);
      setDebugInfo(prev => ({ ...prev, fetchSkipped: 'cache_fresh_and_token_valid', timestamp: Date.now() }));
    }
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
      setDebugInfo(prev => ({ ...prev, fetchAborted: 'no_user', timestamp: Date.now() }));
      return;
    }
    
    // Enhanced request deduplication with debugging
    if (isRequestInProgressRef.current) {
      setDebugInfo(prev => ({ ...prev, fetchDeduplicated: true, timestamp: Date.now() }));
      return;
    }
    
    isRequestInProgressRef.current = true;
    const startTime = Date.now();
    
    try {
      if (!silent) {
        setError(null);
        setConnectionIssue(false);
        setLoading(true);
      }
      
      // Enhanced pre-flight checks with retry logic
      let tokenRefreshAttempts = 0;
      const maxTokenRefreshAttempts = 3;
      
      while (tokenRefreshAttempts < maxTokenRefreshAttempts) {
        if (!isTokenValid()) {
          
          
          const newToken = await refreshToken(true);
          if (!newToken) {
            if (tokenRefreshAttempts === maxTokenRefreshAttempts - 1) {
              throw new Error('Authentication failed after multiple attempts. Please sign out and back in.');
            }
            tokenRefreshAttempts++;
            await new Promise(resolve => setTimeout(resolve, 1000 * tokenRefreshAttempts)); // Exponential backoff
            continue;
          }
          
          lastValidTokenRef.current = newToken;
          // Small delay to ensure token propagation
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        break;
      }
      
      // Enhanced authenticated request with detailed error handling
      let profileData, alertsData;
      
      await makeAuthenticatedRequest(async () => {
        // Get user profile with enhanced error context
        const { data: profile, error: profileError } = await supabase
          .from('user_profile')
          .select('id, bot_activated')
          .maybeSingle();
          
        if (profileError) {
          logger.error('[JobAlerts] Profile fetch error:', profileError);
          
          // Provide specific error context
          if (profileError.code === 'PGRST301') {
            throw new Error('Authentication expired. Please refresh the page.');
          }
          throw new Error(`Unable to load your profile: ${profileError.message}`);
        }
        
        if (!profile) {
          throw new Error('Your profile was not found. Please ensure you are properly signed in.');
        }
        
        profileData = profile;

        // Fetch job alerts with retry on auth failure
        const { data: alerts, error: alertsError } = await supabase
          .from('job_alerts')
          .select('*')
          .order('created_at', { ascending: false });

        if (alertsError) {
          logger.error('[JobAlerts] Alerts fetch error:', alertsError);
          
          if (alertsError.code === 'PGRST301') {
            throw new Error('Authentication expired while loading alerts. Please refresh the page.');
          }
          throw new Error(`Unable to load job alerts: ${alertsError.message}`);
        }
        
        alertsData = alerts || [];
      }, { 
        maxRetries: 3, 
        silentRetry: false
      });

      const endTime = Date.now();
      const fetchDuration = endTime - startTime;
      
      const result = {
        alerts: alertsData || [],
        botActivated: profileData.bot_activated || false,
        userProfileId: profileData.id
      };

      // Update state with optimized re-rendering
      const stateUpdates = [];
      if (JSON.stringify(alerts) !== JSON.stringify(result.alerts)) {
        setAlerts(result.alerts);
        stateUpdates.push('alerts');
      }
      if (isActivated !== result.botActivated) {
        setIsActivated(result.botActivated);
        stateUpdates.push('activation');
      }
      if (userProfileId !== result.userProfileId) {
        setUserProfileId(result.userProfileId);
        stateUpdates.push('profileId');
      }

      // Enhanced caching with token association
      try {
        const cacheData: CachedJobAlertsData = {
          alerts: result.alerts,
          isActivated: result.botActivated,
          userProfileId: result.userProfileId,
          timestamp: endTime,
          version: CACHE_VERSION
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        lastSuccessfulFetchRef.current = endTime;
        
        setDebugInfo(prev => ({ 
          ...prev, 
          lastSuccessfulFetch: endTime,
          fetchDuration,
          stateUpdates,
          resultSummary: {
            alertCount: result.alerts.length,
            isActivated: result.botActivated,
            profileId: result.userProfileId
          }
        }));
        
      } catch (cacheError) {
        logger.warn('[JobAlerts] Cache write failed:', cacheError);
      }

    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      
      setDebugInfo(prev => ({ 
        ...prev, 
        lastError: { message: errorMessage, timestamp: Date.now(), code: error?.code },
        errorContext: {
          silent,
          hasExistingData: alerts.length > 0,
          tokenValid: isTokenValid(),
          userPresent: !!user
        }
      }));
      
      logger.error('[JobAlerts] Fetch failed:', { error: errorMessage, context: { silent, alertCount: alerts.length } });
      
      if (!silent) {
        // Enhanced error differentiation
        if (errorMessage.includes('Authentication') || errorMessage.includes('expired')) {
          setError('Please refresh the page to continue');
        } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
          setError('Connection issue. Please check your internet and try again.');
        } else {
          setError(errorMessage);
        }
        
        // Only show connection issue for network errors and when no data exists
        if (alerts.length === 0 && (errorMessage.includes('network') || errorMessage.includes('fetch'))) {
          setConnectionIssue(true);
        }
      }
    } finally {
      isRequestInProgressRef.current = false;
      if (!silent) {
        setLoading(false);
      }
    }
  }, [user, alerts, isActivated, userProfileId, isTokenValid, refreshToken, makeAuthenticatedRequest]);

  // Enhanced cache management with token awareness
  const invalidateCache = useCallback(() => {
    localStorage.removeItem(CACHE_KEY);
    lastSuccessfulFetchRef.current = 0;
    lastValidTokenRef.current = null;
    setConnectionIssue(false);
    setError(null);
    setDebugInfo(prev => ({ ...prev, cacheInvalidated: 'manual', timestamp: Date.now() }));
    
    // Force fresh fetch
    fetchJobAlertsData();
  }, [fetchJobAlertsData]);

  // Enhanced optimistic updates with proper re-render triggering
  const optimisticAdd = useCallback((newAlert: JobAlert) => {
    setAlerts(prev => {
      const updated = [newAlert, ...prev];
      setDebugInfo(prevDebug => ({ 
        ...prevDebug, 
        optimisticAdd: { alertId: newAlert.id, timestamp: Date.now(), newCount: updated.length }
      }));
      
      // Invalidate cache since we have new data
      try {
        localStorage.removeItem(CACHE_KEY);
      } catch (e) {
        logger.warn('[JobAlerts] Failed to clear cache after optimistic add:', e);
      }
      
      return updated;
    });
  }, []);

  // Enhanced force refresh with debug tracking
  const forceRefresh = useCallback(async () => {
    setConnectionIssue(false);
    setError(null);
    setLoading(true);
    lastValidTokenRef.current = null; // Force token validation
    
    setDebugInfo(prev => ({ ...prev, forceRefreshTriggered: Date.now() }));
    
    // Clear cache to ensure fresh data
    localStorage.removeItem(CACHE_KEY);
    
    await fetchJobAlertsData();
  }, [fetchJobAlertsData]);

  // Enhanced delete function with optimistic updates and error recovery
  const deleteJobAlert = useCallback(async (alertId: string) => {
    const originalAlerts = [...alerts];
    
    try {
      // Optimistically remove from local state first for immediate UI feedback
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
      
      // Perform the actual deletion
      await makeAuthenticatedRequest(async () => {
        const { error } = await supabase
          .from('job_alerts')
          .delete()
          .eq('id', alertId);
        
        if (error) throw error;
      }, { 
        maxRetries: 3 
      });
      
      // Update cache after successful deletion
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsedCache: CachedJobAlertsData = JSON.parse(cached);
          parsedCache.alerts = parsedCache.alerts.filter(alert => alert.id !== alertId);
          parsedCache.timestamp = Date.now();
          localStorage.setItem(CACHE_KEY, JSON.stringify(parsedCache));
        }
      } catch (cacheError) {
        logger.warn('[JobAlerts] Failed to update cache after deletion:', cacheError);
      }
      
      setDebugInfo(prev => ({ 
        ...prev, 
        lastDeletion: { alertId, timestamp: Date.now(), success: true }
      }));
      
      return true;
    } catch (error) {
      // Revert optimistic update on failure
      setAlerts(originalAlerts);
      
      setDebugInfo(prev => ({ 
        ...prev, 
        lastDeletion: { alertId, timestamp: Date.now(), success: false, error: error.message }
      }));
      
      throw error;
    }
  }, [alerts, makeAuthenticatedRequest]);

  return {
    alerts,
    isActivated,
    userProfileId,
    loading,
    error,
    connectionIssue,
    debugInfo, // Add debug info for troubleshooting
    refetch: fetchJobAlertsData,
    optimisticAdd,
    invalidateCache,
    forceRefresh,
    deleteJobAlert
  };
};
