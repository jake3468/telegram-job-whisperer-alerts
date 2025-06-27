
import { useCreditCheck } from './useCreditCheck';
import { useDeferredCreditDeduction } from './useDeferredCreditDeduction';

// Credit costs for each feature based on the new pricing structure
export const FEATURE_CREDITS = {
  JOB_ANALYSIS: 1.0,
  COMPANY_ROLE_ANALYSIS: 3.0,
  INTERVIEW_PREP: 6.0,
  COVER_LETTER: 1.5,
  LINKEDIN_POST: 3.0,
  LINKEDIN_IMAGE: 1.5,
  JOB_ALERT: 0, // Free for users
  RESUME_PDF: 1.5
} as const;

export type FeatureType = keyof typeof FEATURE_CREDITS;

interface UseFeatureCreditCheckOptions {
  feature: FeatureType;
  onSuccess?: () => void;
  onInsufficientCredits?: () => void;
}

export function useFeatureCreditCheck({ 
  feature, 
  onSuccess, 
  onInsufficientCredits 
}: UseFeatureCreditCheckOptions) {
  const requiredCredits = FEATURE_CREDITS[feature];
  const { hasCredits, isLoading, showInsufficientCreditsPopup } = useCreditCheck(requiredCredits);
  const { deductCredits, isDeducting } = useDeferredCreditDeduction();

  const checkAndDeductCredits = async (description?: string): Promise<boolean> => {
    // If feature is free (JOB_ALERT), always allow
    if (requiredCredits === 0) {
      onSuccess?.();
      return true;
    }

    if (!hasCredits) {
      showInsufficientCreditsPopup();
      onInsufficientCredits?.();
      return false;
    }

    const featureName = feature.toLowerCase().replace('_', ' ');
    const defaultDescription = `Credits deducted for ${featureName}`;
    
    const success = await deductCredits(
      requiredCredits, 
      featureName, 
      description || defaultDescription
    );

    if (success) {
      onSuccess?.();
      return true;
    }

    return false;
  };

  return {
    hasCredits,
    requiredCredits,
    isLoading,
    isDeducting,
    checkAndDeductCredits,
    showInsufficientCreditsPopup
  };
}
