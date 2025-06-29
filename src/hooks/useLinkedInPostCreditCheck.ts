
import { useState, useRef } from 'react';
import { useFeatureCreditCheck } from './useFeatureCreditCheck';

export function useLinkedInPostCreditCheck() {
  const [deductedPosts, setDeductedPosts] = useState<Set<string>>(new Set());
  const deductionInProgress = useRef<Set<string>>(new Set());
  
  const creditCheck = useFeatureCreditCheck({
    feature: 'LINKEDIN_POST',
    onInsufficientCredits: () => {
      console.log('Insufficient credits for LinkedIn post generation');
    }
  });

  const checkCreditsBeforeGeneration = async (): Promise<boolean> => {
    // Only check if user has credits, don't deduct yet
    if (!creditCheck.hasCredits) {
      creditCheck.showInsufficientCreditsPopup();
      return false;
    }
    return true;
  };

  const deductCreditsAfterResults = async (postId: string) => {
    // Prevent double deduction for the same post (atomic check)
    if (deductedPosts.has(postId) || deductionInProgress.current.has(postId)) {
      console.log(`Credits already deducted for post ${postId}, skipping deduction`);
      return true;
    }

    // Mark as in progress (atomic operation)
    deductionInProgress.current.add(postId);
    console.log(`Starting credit deduction for post ${postId}`);

    try {
      const success = await creditCheck.checkAndDeductCredits(
        `LinkedIn post generation completed for post ${postId}`
      );
      
      if (success) {
        console.log(`Successfully deducted 3 credits for LinkedIn post generation - post ${postId}`);
        setDeductedPosts(prev => {
          const newSet = new Set(prev);
          newSet.add(postId);
          return newSet;
        });
        // Remove from in progress after successful deduction
        deductionInProgress.current.delete(postId);
        return true;
      } else {
        console.log(`Failed to deduct credits for post ${postId}`);
        // Remove from in progress on failure
        deductionInProgress.current.delete(postId);
        return false;
      }
    } catch (error) {
      console.error(`Error during credit deduction for post ${postId}:`, error);
      // Remove from in progress on error
      deductionInProgress.current.delete(postId);
      return false;
    }
  };

  return {
    ...creditCheck,
    checkCreditsBeforeGeneration,
    deductCreditsAfterResults
  };
}
