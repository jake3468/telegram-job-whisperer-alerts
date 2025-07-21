import { useState, useEffect } from 'react';
import { useUserProfile } from './useUserProfile';
import { logger } from '@/utils/logger';
import { UserProfile, UserProfileUpdateData } from '@/types/userProfile';

interface CachedProfileData {
  profile: UserProfile;
  resumeExists: boolean;
  timestamp: number;
}

const CACHE_KEY = 'aspirely_user_profile_cache';
const RESUME_CACHE_KEY = 'aspirely_resume_status_cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export const useCachedUserProfile = () => {
  const { userProfile: freshProfile, loading, error, updateUserProfile: originalUpdate, refetch } = useUserProfile();
  const [cachedData, setCachedData] = useState<CachedProfileData | null>(null);
  const [displayProfile, setDisplayProfile] = useState<UserProfile | null>(null);
  const [resumeExists, setResumeExists] = useState<boolean>(false);
  const [connectionIssue, setConnectionIssue] = useState(false);

  // Load cached data immediately on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      const resumeCache = localStorage.getItem(RESUME_CACHE_KEY);
      
      if (cached) {
        const parsedCache = JSON.parse(cached);
        const now = Date.now();
        
        // Use cached data if it's less than cache duration old
        if (now - parsedCache.timestamp < CACHE_DURATION) {
          setCachedData(parsedCache);
          setDisplayProfile(parsedCache.profile);
          logger.debug('Loaded cached profile data:', parsedCache.profile);
        } else {
          // Remove expired cache
          localStorage.removeItem(CACHE_KEY);
        }
      }

      if (resumeCache) {
        const parsedResumeCache = JSON.parse(resumeCache);
        const now = Date.now();
        
        if (now - parsedResumeCache.timestamp < CACHE_DURATION) {
          setResumeExists(parsedResumeCache.exists);
          logger.debug('Loaded cached resume status:', parsedResumeCache.exists);
        } else {
          localStorage.removeItem(RESUME_CACHE_KEY);
        }
      }
    } catch (error) {
      logger.warn('Failed to load cached profile data:', error);
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(RESUME_CACHE_KEY);
    }
  }, []);

  // Update displayed data when fresh data is available
  useEffect(() => {
    if (freshProfile) {
      setConnectionIssue(false);
      // Only log once every 5 minutes to prevent spam
      const lastLogTime = localStorage.getItem('profile_last_log');
      const now = Date.now();
      if (!lastLogTime || now - parseInt(lastLogTime) > 5 * 60 * 1000) {
        logger.debug('Fresh profile data received:', freshProfile.id);
        localStorage.setItem('profile_last_log', now.toString());
      }
      
      const resumeStatus = !!freshProfile.resume;
      const profileNow = Date.now();
      
      // Update cached data
      const newCachedData = {
        profile: freshProfile,
        resumeExists: resumeStatus,
        timestamp: profileNow
      };
      
      setCachedData(newCachedData);
      setDisplayProfile(freshProfile);
      setResumeExists(resumeStatus);
      
      // Save to localStorage
      localStorage.setItem(CACHE_KEY, JSON.stringify(newCachedData));
      localStorage.setItem(RESUME_CACHE_KEY, JSON.stringify({
        exists: resumeStatus,
        timestamp: profileNow
      }));
    } else if (error && !loading) {
      // Handle error case - show connection issue if no cached data
      if (!cachedData) {
        setConnectionIssue(true);
      }
      logger.error('Error loading profile:', error);
    }
  }, [freshProfile, error, loading, cachedData]);


  // Enhanced update function that invalidates cache
  const updateUserProfile = async (updates: UserProfileUpdateData) => {
    const result = await originalUpdate(updates);
    
    if (!result.error && displayProfile) {
      // Update display profile immediately
      const updatedProfile = { ...displayProfile, ...updates };
      setDisplayProfile(updatedProfile);
      
      // Update cache
      const cacheData: CachedProfileData = {
        profile: updatedProfile,
        resumeExists,
        timestamp: Date.now()
      };
      
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        setCachedData(cacheData);
        logger.debug('Updated cached profile after edit:', cacheData);
      } catch (error) {
        logger.warn('Failed to update cached profile:', error);
      }
    }
    
    return result;
  };

  // Function to update resume status cache
  const updateResumeStatus = (exists: boolean) => {
    setResumeExists(exists);
    
    try {
      const resumeCache = {
        exists,
        timestamp: Date.now()
      };
      localStorage.setItem(RESUME_CACHE_KEY, JSON.stringify(resumeCache));
      logger.debug('Updated resume status cache:', exists);
    } catch (error) {
      logger.warn('Failed to cache resume status:', error);
    }
  };

  // Determine if we're showing cached data
  const isShowingCachedData = loading && !!cachedData;

  return {
    userProfile: displayProfile!,
    loading: loading && !cachedData, // Don't show loading if we have cached data
    error,
    updateUserProfile,
    refetch,
    resumeExists,
    updateResumeStatus,
    connectionIssue,
    isShowingCachedData
  };
};