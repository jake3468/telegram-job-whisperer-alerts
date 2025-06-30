
import { useFeatureCreditCheck } from './useFeatureCreditCheck';

export function useLinkedInPostCreditCheck() {
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

  // Simplified credit deduction after results are ready
  const deductCreditsAfterResults = async (postId: string) => {
    console.log(`Deducting credits for LinkedIn post ${postId}`);

    const success = await creditCheck.checkAndDeductCredits(
      `LinkedIn post generation completed for post ${postId}`
    );
    
    if (success) {
      console.log(`Successfully deducted 3 credits for LinkedIn post generation - post ${postId}`);
      return true;
    } else {
      console.log(`Failed to deduct credits for post ${postId}`);
      return false;
    }
  };

  return {
    ...creditCheck,
    checkCreditsBeforeGeneration,
    deductCreditsAfterResults
  };
}
