
import { useFeatureCreditCheck } from './useFeatureCreditCheck';

export function useLinkedInImageCreditCheck() {
  const creditCheck = useFeatureCreditCheck({
    feature: 'LINKEDIN_IMAGE',
    onInsufficientCredits: () => {
      console.log('Insufficient credits for LinkedIn image generation');
    }
  });

  // Simplified credit check and deduction flow
  const checkAndDeductForImage = async (postId: string, variationNumber: number, checkOnly: boolean = false) => {
    if (checkOnly) {
      // Only check if user has credits, don't deduct
      if (!creditCheck.hasCredits) {
        creditCheck.showInsufficientCreditsPopup();
        return false;
      }
      return true;
    }

    // Direct credit deduction when image is displayed
    console.log(`Deducting credits for LinkedIn image - post ${postId}, variation ${variationNumber}`);
    
    const success = await creditCheck.checkAndDeductCredits(
      `LinkedIn image generation for post ${postId}, variation ${variationNumber}`
    );
    
    if (success) {
      console.log(`Successfully deducted 1.5 credits for LinkedIn image generation`);
    } else {
      console.log(`Failed to deduct credits for LinkedIn image`);
    }
    
    return success;
  };

  return {
    ...creditCheck,
    checkAndDeductForImage
  };
}
