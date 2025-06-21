
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/useUserProfile';

export function useDeferredCreditDeduction() {
  const [isDeducting, setIsDeducting] = useState(false);
  const { toast } = useToast();
  const { userProfile } = useUserProfile();

  const deductCredits = async (amount: number, featureName: string, description: string) => {
    if (!userProfile?.user_id) {
      console.error('No user profile available for credit deduction');
      return false;
    }

    setIsDeducting(true);
    try {
      console.log(`Deducting ${amount} credits for ${featureName}`);
      
      const { data: result, error } = await supabase.rpc('deduct_credits', {
        p_user_id: userProfile.user_id,
        p_amount: amount,
        p_feature_used: featureName,
        p_description: description
      });

      if (error) {
        console.error('Credit deduction error:', error);
        toast({
          title: "Credit Deduction Failed",
          description: "Unable to deduct credits. Please try again.",
          variant: "destructive"
        });
        return false;
      }

      if (!result) {
        console.error('Credit deduction failed - insufficient credits or other error');
        toast({
          title: "Credit Deduction Failed",
          description: "Insufficient credits or deduction error.",
          variant: "destructive"
        });
        return false;
      }

      console.log(`Successfully deducted ${amount} credits for ${featureName}`);
      return true;

    } catch (error) {
      console.error('Exception during credit deduction:', error);
      toast({
        title: "Credit Deduction Error",
        description: "An unexpected error occurred during credit deduction.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsDeducting(false);
    }
  };

  return {
    deductCredits,
    isDeducting
  };
}
