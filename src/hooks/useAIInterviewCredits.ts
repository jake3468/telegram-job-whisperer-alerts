import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@clerk/clerk-react';
import { logger } from '@/utils/logger';
import { useCachedUserProfile } from '@/hooks/useCachedUserProfile';

interface AIInterviewCredits {
  id: string;
  total_credits: number;
  used_credits: number;
  remaining_credits: number;
  created_at: string;
  updated_at: string;
}

export const useAIInterviewCredits = () => {
  const { user } = useUser();
  const { userProfile } = useCachedUserProfile();
  const [credits, setCredits] = useState<AIInterviewCredits | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchCredits = async (isRetry = false) => {
    if (!user || !userProfile?.user_id) {
      
      setIsLoading(false);
      return;
    }

    try {
      if (!isRetry) {
        setIsLoading(true);
      }
      setError(null);

      

      const { data, error: fetchError } = await supabase
        .from('ai_interview_credits')
        .select('*')
        .eq('user_id', userProfile.user_id)
        .maybeSingle();

      if (fetchError) {
        // Handle specific error cases
        if (fetchError.code === 'PGRST116') {
          // No records found, need to initialize
          logger.info('No AI interview credits found for user, initializing...');
        } else if (fetchError.message?.includes('JWT') && retryCount < 2) {
          // Handle JWT expiration by silently retrying once
          logger.info('JWT issue detected, retrying...');
          setRetryCount(prev => prev + 1);
          setTimeout(() => fetchCredits(true), 1000);
          return;
        } else {
          logger.error('Error fetching AI interview credits:', fetchError);
          setError(`Failed to load call data: ${fetchError.message}`);
          return;
        }
      }

      if (!data) {
        // Initialize credits for this user
        logger.info('Initializing AI interview credits for user:', userProfile.user_id);
        
        const { data: initResult, error: initError } = await supabase.rpc('initialize_ai_interview_credits', {
          p_user_id: userProfile.user_id
        });

        if (initError) {
          logger.error('Error initializing AI interview credits:', initError);
          setError(`Failed to initialize calls: ${initError.message}`);
          return;
        }

        // Fetch the newly created record
        const { data: newData, error: refetchError } = await supabase
          .from('ai_interview_credits')
          .select('*')
          .eq('user_id', userProfile.user_id)
          .maybeSingle();

        if (refetchError) {
          logger.error('Error fetching newly created AI interview credits:', refetchError);
          setError(`Failed to load new call data: ${refetchError.message}`);
          return;
        }

        setCredits(newData);
        logger.info('Successfully initialized and loaded AI interview credits:', newData);
      } else {
        setCredits(data);
        logger.debug('Successfully loaded existing AI interview credits:', data);
      }
      
      // Reset retry count on success
      setRetryCount(0);
      
    } catch (err) {
      logger.error('Unexpected error fetching AI interview credits:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to load call data: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const useCredit = async (description?: string) => {
    if (!user || !credits || !userProfile?.user_id) {
      throw new Error('User not authenticated or credits not loaded');
    }

    if (credits.remaining_credits < 1) {
      throw new Error('Insufficient AI interview calls');
    }

    try {
      const { data: success, error: useError } = await supabase.rpc('use_ai_interview_credit', {
        p_user_id: userProfile.user_id,
        p_description: description || 'AI mock interview call used'
      });

      if (useError) {
        logger.error('Error using AI interview credit:', useError);
        throw new Error(useError.message);
      }

      if (!success) {
        throw new Error('Failed to use AI interview credit');
      }

      // Refresh credits after successful usage
      await fetchCredits();
      
      return true;
    } catch (err) {
      logger.error('Error using AI interview credit:', err);
      throw err;
    }
  };

  useEffect(() => {
    if (user && userProfile?.user_id) {
      fetchCredits();
    }
  }, [user, userProfile?.user_id]);

  return {
    credits,
    isLoading,
    error,
    refetch: fetchCredits,
    useCredit,
    hasCredits: credits ? credits.remaining_credits > 0 : false,
    remainingCredits: credits?.remaining_credits || 0
  };
};