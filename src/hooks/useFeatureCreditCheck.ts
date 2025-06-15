
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserCredits } from "./useUserCredits";

// Custom hook to check for sufficient credits before using a feature
export function useFeatureCreditCheck(requiredCredits: number) {
  const navigate = useNavigate();
  const { data, isLoading } = useUserCredits();

  useEffect(() => {
    if (!isLoading && data && Number(data.current_balance) < requiredCredits) {
      // Redirect to upgrade page if not enough credits
      navigate('/upgrade');
    }
  }, [isLoading, data, requiredCredits, navigate]);
}
