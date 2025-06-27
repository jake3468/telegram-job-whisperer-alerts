
import { useFeatureCreditCheck } from './useFeatureCreditCheck';

export function useLinkedInImageCreditCheck() {
  const creditCheck = useFeatureCreditCheck({
    feature: 'LINKEDIN_IMAGE',
    onInsufficientCredits: () => {
      console.log('Insufficient credits for LinkedIn image generation');
    }
  });

  const checkAndDeductForImage = async (postId: string, variationNumber: number) => {
    const success = await creditCheck.checkAndDeductCredits(
      `LinkedIn image generation for post ${postId}, variation ${variationNumber}`
    );
    
    if (success) {
      console.log(`Successfully deducted 1.5 credits for LinkedIn image generation`);
    }
    
    return success;
  };

  return {
    ...creditCheck,
    checkAndDeductForImage
  };
}
