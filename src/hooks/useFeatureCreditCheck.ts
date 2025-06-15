
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserCredits } from "./useUserCredits";

// Custom hook to check for sufficient credits before using a feature
export function useFeatureCreditCheck(requiredCredits: number) {
  const navigate = useNavigate();
  const { data: credits, isLoading } = useUserCredits();

  useEffect(() => {
    // Guard: only check balance if credits exist, no error.
    if (
      !isLoading &&
      credits &&
      !("__error" in credits) &&
      Number(credits.current_balance) < requiredCredits
    ) {
      // Redirect to upgrade page if not enough credits
      navigate('/upgrade');
    }
  }, [isLoading, credits, requiredCredits, navigate]);
}
