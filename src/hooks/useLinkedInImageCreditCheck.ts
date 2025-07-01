
import { useFeatureCreditCheck } from './useFeatureCreditCheck';

export function useLinkedInImageCreditCheck() {
  const creditCheck = useFeatureCreditCheck({
    feature: 'LINKEDIN_IMAGE',
    onInsufficientCredits: () => {
      console.log('Insufficient credits for LinkedIn image generation');
    }
  });

  // REMOVED: Credit deduction is now handled by N8N webhook calling the edge function
  // The frontend only checks if credits are available before generation
  
  return {
    ...creditCheck,
    // Removed deductImageCredits method since credits are deducted server-side
  };
}
