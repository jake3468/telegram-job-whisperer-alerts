
import { useEffect, useState } from 'react';
import { useUserCredits } from './useUserCredits';
import { useToast } from './use-toast';
import { useNavigate } from 'react-router-dom';
import { ToastAction } from '@/components/ui/toast';

interface CreditWarningState {
  hasShownLowCreditWarning: boolean;
  hasShownZeroCreditWarning: boolean;
}

const SESSION_STORAGE_KEY = 'credit_warnings_shown';

export function useCreditWarnings() {
  const { data: credits, isLoading } = useUserCredits();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [warningState, setWarningState] = useState<CreditWarningState>(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {
        hasShownLowCreditWarning: false,
        hasShownZeroCreditWarning: false
      };
    } catch {
      return {
        hasShownLowCreditWarning: false,
        hasShownZeroCreditWarning: false
      };
    }
  });

  const updateWarningState = (updates: Partial<CreditWarningState>) => {
    const newState = { ...warningState, ...updates };
    setWarningState(newState);
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newState));
  };

  const formatResetDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'soon';
    }
  };

  const showGetMoreCreditsToast = () => {
    toast({
      title: "Get More Credits",
      description: "You can purchase credit packs or subscribe to a monthly plan. Click here to visit the Get More Credits page.",
      duration: 8000,
      action: (
        <ToastAction altText="Get More Credits" onClick={() => navigate('/get-more-credits')}>
          Get More Credits
        </ToastAction>
      )
    });
  };

  // Credit warnings disabled per user request
  // useEffect(() => {
  //   ... warnings logic removed ...
  // }, [credits, isLoading, warningState, toast, navigate]);

  return {
    credits,
    isLoading,
    showGetMoreCreditsToast,
    hasCredits: credits ? Number(credits.current_balance) > 0 : false,
    creditBalance: credits ? Number(credits.current_balance) : 0
  };
}
