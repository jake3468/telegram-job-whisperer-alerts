import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';

export function useJobAlertsOnboardingPopup() {
  const { user, isLoaded } = useUser();
  const { userProfile, refetch: refetchProfile } = useUserProfile();
  const [showPopup, setShowPopup] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (isLoaded && user && userProfile?.show_job_alerts_onboarding_popup) {
      setShowPopup(true);
    }
  }, [isLoaded, user, userProfile?.show_job_alerts_onboarding_popup]);

  const hidePopup = () => {
    setShowPopup(false);
  };

  const dontShowAgain = async () => {
    if (!userProfile?.id || isUpdating) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('user_profile')
        .update({ show_job_alerts_onboarding_popup: false })
        .eq('id', userProfile.id);

      if (error) {
        console.error('Error updating job alerts onboarding preference:', error);
        return;
      }

      setShowPopup(false);
      // Refetch profile to update local state
      refetchProfile();
    } catch (error) {
      console.error('Error updating job alerts onboarding preference:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    showPopup,
    hidePopup,
    dontShowAgain,
    isUpdating
  };
}