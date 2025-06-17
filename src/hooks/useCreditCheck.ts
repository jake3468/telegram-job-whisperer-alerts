
import { useUserCredits } from './useUserCredits';
import { useToast } from './use-toast';
import { useNavigate } from 'react-router-dom';

export function useCreditCheck(requiredCredits: number = 1.5) {
  const { data: credits, isLoading } = useUserCredits();
  const { toast } = useToast();
  const navigate = useNavigate();

  const hasCredits = credits && Number(credits.current_balance) >= requiredCredits;
  const creditBalance = credits ? Number(credits.current_balance) : 0;

  const showInsufficientCreditsPopup = () => {
    const resetDate = credits?.next_reset_date 
      ? new Date(credits.next_reset_date).toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric',
          year: 'numeric'
        })
      : 'soon';

    toast({
      title: "Insufficient Credits",
      description: (
        <div className="space-y-2">
          <p>You need {requiredCredits} credits to use this feature.</p>
          <p>You currently have {creditBalance} credits.</p>
          <p>Your next 15 free credits will reset on {resetDate}.</p>
          <button
            onClick={() => navigate('/get-more-credits')}
            className="text-blue-400 underline hover:text-blue-300"
          >
            Get More Credits
          </button>
        </div>
      ),
      duration: 8000,
    });
  };

  return {
    hasCredits,
    creditBalance,
    isLoading,
    showInsufficientCreditsPopup,
    requiredCredits
  };
}
