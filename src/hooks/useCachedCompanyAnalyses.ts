import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase, makeAuthenticatedRequest } from '@/integrations/supabase/client';
import { useUserProfile } from './useUserProfile';
import { logger } from '@/utils/logger';

interface CompanyRoleAnalysisData {
  id: string;
  company_name: string;
  location: string;
  job_title: string;
  research_date: string | null;
  local_role_market_context: string | null;
  company_news_updates: string[] | null;
  role_security_score: number | null;
  role_security_score_breakdown: string[] | null;
  role_security_outlook: string | null;
  role_security_automation_risks: string | null;
  role_security_departmental_trends: string | null;
  role_experience_score: number | null;
  role_experience_score_breakdown: string[] | null;
  role_experience_specific_insights: string | null;
  role_compensation_analysis: any | null;
  role_workplace_environment: any | null;
  career_development: any | null;
  role_specific_considerations: any | null;
  interview_and_hiring_insights: any | null;
  sources: any | null;
  created_at: string;
  updated_at: string;
}

interface CachedCompanyAnalysisData {
  data: CompanyRoleAnalysisData[];
  timestamp: number;
}

const CACHE_KEY = 'aspirely_company_analysis_cache';
const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours

export const useCachedCompanyAnalyses = () => {
  const { userProfile } = useUserProfile();
  const [cachedData, setCachedData] = useState<CompanyRoleAnalysisData[]>([]);
  const [isShowingCachedData, setIsShowingCachedData] = useState(false);
  const [connectionIssue, setConnectionIssue] = useState(false);

  // Load cached data immediately on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsedCache: CachedCompanyAnalysisData = JSON.parse(cached);
        const now = Date.now();
        
        // Use cached data if it's less than cache duration old
        if (now - parsedCache.timestamp < CACHE_DURATION) {
          setCachedData(parsedCache.data);
          setIsShowingCachedData(true);
        } else {
          // Remove expired cache
          localStorage.removeItem(CACHE_KEY);
        }
      }
    } catch (error) {
      logger.warn('Failed to load cached company analysis data:', error);
      localStorage.removeItem(CACHE_KEY);
    }
  }, []);

  // Fetch fresh data with React Query
  const {
    data: freshData,
    isLoading: isFreshLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['company_role_analyses', userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id) return [];
      
      try {
        const { data, error } = await makeAuthenticatedRequest(async () => {
          return await supabase
            .from('company_role_analyses')
            .select('*')
            .eq('user_id', userProfile.id)
            .order('created_at', { ascending: false });
        }, { operationType: 'fetch company role analyses' });

        if (error) {
          console.error('Error fetching company analysis history:', error);
          throw error;
        }

        return data as CompanyRoleAnalysisData[];
      } catch (err) {
        console.error('Exception fetching company analysis history:', err);
        throw err;
      }
    },
    enabled: !!userProfile?.id,
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: CACHE_DURATION, // Keep in cache for 2 hours
    retry: 2
  });

  // Handle connection issues
  useEffect(() => {
    if (error && !cachedData.length) {
      setConnectionIssue(true);
    } else if (freshData) {
      setConnectionIssue(false);
    }
  }, [error, freshData, cachedData.length]);

  // Update cache when fresh data arrives
  useEffect(() => {
    if (freshData && !isFreshLoading) {
      const cacheData: CachedCompanyAnalysisData = {
        data: freshData,
        timestamp: Date.now()
      };

      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        setCachedData(freshData);
        setIsShowingCachedData(false);
      } catch (error) {
        logger.warn('Failed to cache company analysis data:', error);
        // Still update state even if caching fails
        setCachedData(freshData);
        setIsShowingCachedData(false);
      }
    }
  }, [freshData, isFreshLoading]);

  // Return cached data immediately, fresh data loads in background
  const data = freshData || cachedData;
  const isLoading = isFreshLoading && !cachedData.length;

  return {
    data,
    isLoading,
    isShowingCachedData: isShowingCachedData && !freshData,
    connectionIssue,
    error,
    refetch,
    hasCache: cachedData.length > 0
  };
};