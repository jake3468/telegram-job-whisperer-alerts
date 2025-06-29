
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
      console.log(`Credits already deducted for post ${postId}, skipping atomic check`);
      return true;
    }

    // Mark as in progress (atomic operation)
    deductionInProgress.current.add(postId);

    try {
      const success = await creditCheck.checkAndDeductCredits(
        `LinkedIn post generation completed for post ${postId}`
      );
      
      if (success) {
        console.log(`Successfully deducted 3 credits for LinkedIn post generation (atomic)`);
        setDeductedPosts(prev => new Set(prev).add(postId));
      }
      
      return success;
    } finally {
      // Remove from in progress (atomic cleanup)
      deductionInProgress.current.delete(postId);
    }
  };

  return {
    ...creditCheck,
    checkCreditsBeforeGeneration,
    deductCreditsAfterResults
  };
}
