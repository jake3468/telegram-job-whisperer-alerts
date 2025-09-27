
import { useUserCredits } from './useUserCredits';
import { useToast } from './use-toast';
import { useNavigate } from 'react-router-dom';
import { ToastAction } from '@/components/ui/toast';

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

    // Special message for LinkedIn image generation (1.5 credits)
    if (requiredCredits === 1.5) {
      toast({
        title: "Insufficient Credits",
        description: `You need ${requiredCredits} credits to generate an image. You currently have ${creditBalance} credits. Purchase credit packs or subscribe to a monthly plan for unlimited access. Otherwise, wait for your next credit reset on ${resetDate}.`,
        duration: 10000,
        action: (
          <ToastAction altText="Get More Credits" onClick={() => navigate('/get-more-credits')}>
            Get More Credits
          </ToastAction>
        )
      });
    } else {
      // Default message for other features
      toast({
        title: "Insufficient Credits",
        description: `You need ${requiredCredits} credits to use this feature. You currently have ${creditBalance} credits. Your next 10 free credits will reset on ${resetDate}. Click here to get more credits.`,
        duration: 8000,
        action: (
          <ToastAction altText="Get More Credits" onClick={() => navigate('/get-more-credits')}>
            Get More Credits
          </ToastAction>
        )
      });
    }
  };

  return {
    hasCredits,
    creditBalance,
    isLoading,
    showInsufficientCreditsPopup,
    requiredCredits
  };
}
