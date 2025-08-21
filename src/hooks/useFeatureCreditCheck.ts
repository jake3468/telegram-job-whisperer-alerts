
import { useCreditCheck } from './useCreditCheck';
import { Analytics, FEATURE_EVENTS } from '@/utils/analytics';

// Credit costs for each feature based on the new pricing structure
export const FEATURE_CREDITS = {
  JOB_ANALYSIS: 1.0,
  COMPANY_ROLE_ANALYSIS: 3.0,
  INTERVIEW_PREP: 6.0,
  COVER_LETTER: 1.5,
  LINKEDIN_POST: 3.0,
  LINKEDIN_IMAGE: 1.5,
  JOB_ALERT: 0.1, // Changed from 1.5 to 0.1 to reflect actual cost per execution
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

  // For JOB_ANALYSIS, COMPANY_ROLE_ANALYSIS, and JOB_ALERT, we only check credits but don't deduct (N8N handles deduction)
  const checkCreditsOnly = async (): Promise<boolean> => {
    if (!hasCredits) {
      showInsufficientCreditsPopup();
      Analytics.trackUpgradePromptShown('insufficient_credits');
      onInsufficientCredits?.();
      return false;
    }

    // Track feature usage for analytics
    const featureEventMapping: Partial<Record<FeatureType, keyof typeof FEATURE_EVENTS>> = {
      JOB_ANALYSIS: 'JOB_ANALYSIS',
      COMPANY_ROLE_ANALYSIS: 'COMPANY_ANALYSIS', 
      INTERVIEW_PREP: 'INTERVIEW_PREP',
      COVER_LETTER: 'COVER_LETTER',
      LINKEDIN_POST: 'LINKEDIN_POST',
      LINKEDIN_IMAGE: 'LINKEDIN_IMAGE',
      JOB_ALERT: 'JOB_ALERT',
      RESUME_PDF: 'RESUME_PDF'
    };
    
    const eventName = featureEventMapping[feature];
    if (eventName) {
      Analytics.trackFeatureUsage(eventName, requiredCredits);
    }

    // For job analysis, company analysis, and job alerts, just check credits but don't deduct
    if (feature === 'JOB_ANALYSIS' || feature === 'COMPANY_ROLE_ANALYSIS' || feature === 'JOB_ALERT') {
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
    isDeducting: false, // No longer deducting in frontend for job analysis, company analysis, and job alerts
    checkAndDeductCredits: checkCreditsOnly,
    showInsufficientCreditsPopup
  };
}
