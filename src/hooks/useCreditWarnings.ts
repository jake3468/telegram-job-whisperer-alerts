
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
      description: (
        <div className="space-y-2">
          <p>You can purchase credit packs or subscribe to a monthly plan.</p>
          <button
            onClick={() => navigate('/get-more-credits')}
            className="text-blue-400 underline hover:text-blue-300"
          >
            Visit Get More Credits page
          </button>
        </div>
      ),
      duration: 8000,
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
        description: (
          <div className="space-y-2">
            <p>You have {balance} credits remaining.</p>
            <p>Your next 15 free credits will reset on {resetDate}.</p>
            <p>Need more credits now?</p>
            <button
              onClick={() => navigate('/get-more-credits')}
              className="text-blue-400 underline hover:text-blue-300"
            >
              Get More Credits
            </button>
          </div>
        ),
        duration: 10000,
      });
      
      updateWarningState({ hasShownLowCreditWarning: true });
    }

    // Show zero credit warning (when = 0)
    if (balance === 0 && !warningState.hasShownZeroCreditWarning) {
      const resetDate = formatResetDate(credits.next_reset_date);
      
      toast({
        title: "No Credits Remaining",
        description: (
          <div className="space-y-2">
            <p>You have no credits left. Features are temporarily unavailable.</p>
            <p>Your next 15 free credits will reset on {resetDate}.</p>
            <button
              onClick={() => navigate('/get-more-credits')}
              className="text-blue-400 underline hover:text-blue-300"
            >
              Get More Credits Now
            </button>
          </div>
        ),
        duration: 12000,
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
