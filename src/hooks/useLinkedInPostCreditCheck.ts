
import { useState, useRef } from 'react';
import { useFeatureCreditCheck } from './useFeatureCreditCheck';

export function useLinkedInPostCreditCheck() {
  const [deductedPosts, setDeductedPosts] = useState<Set<string>>(new Set());
  const deductionInProgress = useRef<Set<string>>(new Set());
  const creditDeductionProcessed = useRef<Set<string>>(new Set()); // Additional safeguard
  
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
    // Triple-layer protection against duplicate deductions
    if (deductedPosts.has(postId) || 
        deductionInProgress.current.has(postId) || 
        creditDeductionProcessed.current.has(postId)) {
      console.log(`Credits already processed for post ${postId}, skipping deduction`);
      return true;
    }

    // Mark as processed immediately in all tracking systems
    deductionInProgress.current.add(postId);
    creditDeductionProcessed.current.add(postId);
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
        return true;
      } else {
        console.log(`Failed to deduct credits for post ${postId}`);
        // Remove from tracking on failure
        deductionInProgress.current.delete(postId);
        creditDeductionProcessed.current.delete(postId);
        return false;
      }
    } catch (error) {
      console.error(`Error during credit deduction for post ${postId}:`, error);
      // Remove from tracking on error
      deductionInProgress.current.delete(postId);
      creditDeductionProcessed.current.delete(postId);
      return false;
    }
  };

  return {
    ...creditCheck,
    checkCreditsBeforeGeneration,
    deductCreditsAfterResults
  };
}
