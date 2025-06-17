
import { useEffect, useState } from 'react';
import { useUserCredits } from './useUserCredits';
import { useToast } from './use-toast';
import { useNavigate } from 'react-router-dom';

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
      action: {
        label: "Get More Credits",
        onClick: () => navigate('/get-more-credits')
      }
    });
  };

  useEffect(() => {
    if (isLoading || !credits) return;

    const balance = Number(credits.current_balance);

    // Show low credit warning (when < 3 but > 0)
    if (balance > 0 && balance < 3 && !warningState.hasShownLowCreditWarning) {
      const resetDate = formatResetDate(credits.next_reset_date);
      
      toast({
        title: "Low Credits Warning",
        description: `You have ${balance} credits remaining. Your next 15 free credits will reset on ${resetDate}. Need more credits now? Click here to get more credits.`,
        duration: 10000,
        action: {
          label: "Get More Credits",
          onClick: () => navigate('/get-more-credits')
        }
      });
      
      updateWarningState({ hasShownLowCreditWarning: true });
    }

    // Show zero credit warning (when = 0)
    if (balance === 0 && !warningState.hasShownZeroCreditWarning) {
      const resetDate = formatResetDate(credits.next_reset_date);
      
      toast({
        title: "No Credits Remaining",
        description: `You have no credits left. Features are temporarily unavailable. Your next 15 free credits will reset on ${resetDate}. Click here to get more credits now.`,
        duration: 12000,
        action: {
          label: "Get More Credits",
          onClick: () => navigate('/get-more-credits')
        }
      });
      
      updateWarningState({ hasShownZeroCreditWarning: true });
    }
  }, [credits, isLoading, warningState, toast, navigate]);

  return {
    credits,
    isLoading,
    showGetMoreCreditsToast,
    hasCredits: credits ? Number(credits.current_balance) > 0 : false,
    creditBalance: credits ? Number(credits.current_balance) : 0
  };
}
