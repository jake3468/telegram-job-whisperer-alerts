
import { useCreditWarnings } from "./useCreditWarnings";

// Updated hook that only shows warnings, no redirects
export function useFeatureCreditCheck(requiredCredits: number) {
  // This now just triggers the warning system without redirecting
  const creditWarnings = useCreditWarnings();
  
  // Return the credit status for components that need it
  return {
    hasCredits: creditWarnings.hasCredits,
    creditBalance: creditWarnings.creditBalance,
    isLoading: creditWarnings.isLoading
  };
}
