
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseLinkedInPostTimeoutFallbackProps {
  currentPostId: string | null;
  userProfileId: string | null;
  isGenerating: boolean;
  creditsDeducted: boolean;
  onCreditsDeducted: () => void;
  onPostsReady: (data: any) => void;
}

export const useLinkedInPostTimeoutFallback = ({
  currentPostId,
  userProfileId,
  isGenerating,
  creditsDeducted,
  onCreditsDeducted,
  onPostsReady
}: UseLinkedInPostTimeoutFallbackProps) => {
  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!currentPostId || !userProfileId || !isGenerating) {
      return;
    }

    console.log('⏰ Starting timeout fallback for post:', currentPostId);

    // Set up a timeout to check for completion after 3 minutes
    timeoutRef.current = setTimeout(async () => {
      console.log('⏰ Timeout reached, checking post completion manually');

      try {
        const { data, error } = await supabase
          .from('job_linkedin')
          .select('*')
          .eq('id', currentPostId)
          .single();

        if (error) {
          console.error('❌ Error in timeout fallback:', error);
          return;
        }

        if (data) {
          const hasAllPosts = Boolean(
            data.post_heading_1 && 
            data.post_content_1 && 
            data.post_heading_2 && 
            data.post_content_2 && 
            data.post_heading_3 && 
            data.post_content_3
          );

          console.log('⏰ Timeout fallback check result:', {
            hasAllPosts,
            postId: currentPostId
          });

          if (hasAllPosts) {
            console.log('⏰ Posts completed, triggering fallback completion');
            onPostsReady(data);
            // Toast will be handled by the onPostsReady callback in LinkedInPosts
          }
        }
      } catch (error) {
        console.error('❌ Exception in timeout fallback:', error);
      }
    }, 180000); // 3 minutes

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentPostId, userProfileId, isGenerating, onPostsReady, toast]);

  // Cleanup timeout when no longer generating
  useEffect(() => {
    if (!isGenerating && timeoutRef.current) {
      console.log('⏰ Generation completed, clearing timeout fallback');
      clearTimeout(timeoutRef.current);
    }
  }, [isGenerating]);
};
