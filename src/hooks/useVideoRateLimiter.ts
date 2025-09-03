import { supabase } from '@/integrations/supabase/client';
import { useCallback } from 'react';

interface RateLimiterResponse {
  allowed: boolean;
  reason?: string;
  retryAfter?: number;
  requestCount?: number;
  remainingRequests?: number;
}

export const useVideoRateLimiter = () => {
  const checkRateLimit = useCallback(async (
    videoPath: string,
    userAgent: string = navigator.userAgent,
    sessionId: string
  ): Promise<RateLimiterResponse> => {
    try {
      const { data, error } = await supabase.functions.invoke('video-rate-limiter', {
        body: {
          videoPath,
          userAgent,
          sessionId
        }
      });

      if (error) {
        console.error('Rate limiter error:', error);
        return { allowed: false, reason: 'Rate limiter unavailable' };
      }

      return data as RateLimiterResponse;
    } catch (error) {
      console.error('Rate limiter request failed:', error);
      return { allowed: false, reason: 'Network error' };
    }
  }, []);

  return { checkRateLimit };
};