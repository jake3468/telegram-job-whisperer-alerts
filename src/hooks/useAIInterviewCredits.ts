import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@clerk/clerk-react';
import { logger } from '@/utils/logger';

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
  const [credits, setCredits] = useState<AIInterviewCredits | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCredits = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('ai_interview_credits')
        .select('*')
        .maybeSingle();

      if (fetchError) {
        logger.error('Error fetching AI interview credits:', fetchError);
        setError(fetchError.message);
        return;
      }

      if (!data) {
        // If no credits record exists, try to initialize it
        logger.info('No AI interview credits found, attempting to initialize...');
        const { data: userProfileData, error: profileError } = await supabase
          .from('user_profile')
          .select('id, user_id')
          .maybeSingle();

        if (profileError) {
          logger.error('Error fetching user profile:', profileError);
          setError('Unable to fetch user profile');
          return;
        }

        if (userProfileData?.user_id) {
          // Call the initialization function
          const { error: initError } = await supabase.rpc('initialize_ai_interview_credits', {
            p_user_id: userProfileData.user_id
          });

          if (initError) {
            logger.error('Error initializing AI interview credits:', initError);
            setError(initError.message);
            return;
          }

          // Fetch again after initialization
          const { data: newData, error: refetchError } = await supabase
            .from('ai_interview_credits')
            .select('*')
            .maybeSingle();

          if (refetchError) {
            logger.error('Error refetching AI interview credits:', refetchError);
            setError(refetchError.message);
            return;
          }

          setCredits(newData);
        } else {
          logger.error('No user profile found for credit initialization');
          setError('User profile not found');
          return;
        }
      } else {
        setCredits(data);
      }
    } catch (err) {
      logger.error('Unexpected error fetching AI interview credits:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const useCredit = async (description?: string) => {
    if (!user || !credits) {
      throw new Error('User not authenticated or credits not loaded');
    }

    if (credits.remaining_credits < 1) {
      throw new Error('Insufficient AI interview credits');
    }

    try {
      const { data: userProfileData } = await supabase
        .from('user_profile')
        .select('user_id')
        .maybeSingle();

      if (!userProfileData?.user_id) {
        throw new Error('User profile not found');
      }

      const { data: success, error: useError } = await supabase.rpc('use_ai_interview_credit', {
        p_user_id: userProfileData.user_id,
        p_description: description || 'AI mock interview credit used'
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
    if (user) {
      fetchCredits();
    }
  }, [user]);

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