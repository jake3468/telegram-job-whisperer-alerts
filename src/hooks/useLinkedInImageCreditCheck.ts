
import { useFeatureCreditCheck } from './useFeatureCreditCheck';

export function useLinkedInImageCreditCheck() {
  const creditCheck = useFeatureCreditCheck({
    feature: 'LINKEDIN_IMAGE',
    onInsufficientCredits: () => {
      console.log('Insufficient credits for LinkedIn image generation');
    }
  });

  // FIXED: Simplified direct credit deduction when image is displayed
  const deductImageCredits = async (postId: string, variationNumber: number): Promise<boolean> => {
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
    deductImageCredits
  };
}
