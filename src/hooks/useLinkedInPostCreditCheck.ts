
import { useCreditCheck } from './useCreditCheck';

export function useLinkedInPostCreditCheck() {
  const requiredCredits = 3.0; // LinkedIn posts require 3 credits
  const { hasCredits, isLoading, showInsufficientCreditsPopup, creditBalance, refetch } = useCreditCheck(requiredCredits);
  
  // Refresh credits by re-fetching data without page reload
  const refreshCredits = async () => {
    if (refetch) {
      await refetch();
    }
  };

  return {
    hasCredits,
    creditBalance,
    isLoading,
    showInsufficientCreditsPopup,
    requiredCredits,
    refreshCredits
  };
}
