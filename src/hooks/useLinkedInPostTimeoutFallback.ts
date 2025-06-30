
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
    if (!currentPostId || !userProfileId || !isGenerating || creditsDeducted) {
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
            console.log('⏰ Posts completed, triggering fallback completion (NO credit deduction here)');
            
            // REMOVED: Credit deduction from timeout fallback to prevent double deduction
            // The main component will handle credit deduction via real-time updates
            
            onPostsReady(data);
            toast({
              title: "LinkedIn Posts Generated!",
              description: "Your 3 LinkedIn post variations have been created successfully."
            });
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
  }, [currentPostId, userProfileId, isGenerating, creditsDeducted, onCreditsDeducted, onPostsReady, toast]);

  // Cleanup timeout when credits are deducted
  useEffect(() => {
    if (creditsDeducted && timeoutRef.current) {
      console.log('⏰ Credits deducted, clearing timeout fallback');
      clearTimeout(timeoutRef.current);
    }
  }, [creditsDeducted]);
};
