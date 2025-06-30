
import { useCreditCheck } from './useCreditCheck';

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

  // For JOB_ANALYSIS, we no longer handle credit deduction here
  // The N8N webhook will call the edge function to deduct credits
  const checkCreditsOnly = async (): Promise<boolean> => {
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

    // For job analysis, just check credits but don't deduct
    if (feature === 'JOB_ANALYSIS') {
      onSuccess?.();
      return true;
    }

    // For other features, maintain existing functionality
    onSuccess?.();
    return true;
  };

  return {
    hasCredits,
    requiredCredits,
    isLoading,
    isDeducting: false, // No longer deducting in frontend for job analysis
    checkAndDeductCredits: checkCreditsOnly,
    showInsufficientCreditsPopup
  };
}
