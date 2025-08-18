
import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormTokenKeepAlive } from '@/hooks/useFormTokenKeepAlive';
import { useCachedUserProfile } from '@/hooks/useCachedUserProfile';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

export const ProfileJobAlertsSection = () => {
  const navigate = useNavigate();
  const { updateActivity } = useFormTokenKeepAlive(true);
  const { userProfile, refetch } = useCachedUserProfile();
  const [isCompleting, setIsCompleting] = useState(false);
  
  // Lottie animation states
  const [LottieComponent, setLottieComponent] = useState<any>(null);
  const [animationData, setAnimationData] = useState(null);
  const [isAnimationLoading, setIsAnimationLoading] = useState(true);
  const [hasAnimationError, setHasAnimationError] = useState(false);

  const handleHireAgents = useCallback(async () => {
    if (!userProfile?.id) return;
    
    updateActivity();
    setIsCompleting(true);
    
    try {
      // Update profile setup completion status
      const { error } = await supabase
        .from('user_profile')
        .update({ profile_setup_completed: true })
        .eq('id', userProfile.id);

      if (error) throw error;

      toast.success('Profile setup completed! 🎉 Your AI agents are ready to work for you.');
      await refetch();
      
      // Redirect to AI agents page
      navigate('/ai-agents');
      
      // Scroll to top of the page
      window.scrollTo(0, 0);
    } catch (error) {
      console.error('Error completing setup:', error);
      toast.error('Failed to complete setup');
    } finally {
      setIsCompleting(false);
    }
  }, [navigate, updateActivity, userProfile?.id, refetch]);

  // Load Lottie component dynamically
  useEffect(() => {
    const loadLottieComponent = async () => {
      try {
        const lottieModule = await import('lottie-react');
        setLottieComponent(() => lottieModule.default);
      } catch (error) {
        logger.error('Failed to load Lottie component:', error);
        setHasAnimationError(true);
      }
    };

    loadLottieComponent();
  }, []);

  // Load animation data from Supabase storage
  useEffect(() => {
    const loadAnimationData = async () => {
      try {
        setIsAnimationLoading(true);
        
        const response = await fetch('https://fnzloyyhzhrqsvslhhri.supabase.co/storage/v1/object/public/animations/AI%20Agent%20profile%20wizard.json');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch animation: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        setAnimationData(data);
        logger.debug('Animation data loaded successfully');
      } catch (error) {
        logger.error('Failed to load animation data:', error);
        setHasAnimationError(true);
      } finally {
        setIsAnimationLoading(false);
      }
    };

    loadAnimationData();
  }, []);

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <Card className="bg-gray-800 border border-gray-600 shadow-lg">
        <CardContent className="p-4 sm:p-6 space-y-4">
          {/* Step Header */}
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="relative flex-shrink-0">
                <div className="p-2 sm:p-3 bg-blue-600 rounded-xl border border-blue-700 shadow-lg">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-blue-800 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white text-xs font-bold">3</span>
                </div>
              </div>
              <h2 className="text-base sm:text-xl font-bold text-gray-100">
                Hire Your Job Hunt Agents
              </h2>
            </div>
            <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
              Now comes the crucial part. You're about to hire 3 personal AI agents who will work for you, day and night, to make your job hunt effortless.
            </p>
          </div>

          {/* Lottie Animation */}
          <div className="flex justify-center my-6">
            <div className="w-full max-w-xs sm:max-w-sm md:max-w-md">
              {isAnimationLoading && !hasAnimationError && (
                <div className="flex items-center justify-center h-48 bg-gray-700/30 rounded-lg">
                  <div className="animate-pulse text-gray-400 text-sm">Loading animation...</div>
                </div>
              )}
              
              {hasAnimationError && (
                <div className="flex items-center justify-center h-48 bg-gray-700/30 rounded-lg">
                  <div className="text-gray-500 text-sm">Animation not available</div>
                </div>
              )}
              
              {LottieComponent && animationData && !isAnimationLoading && !hasAnimationError && (
                <LottieComponent
                  animationData={animationData}
                  loop={true}
                  autoplay={true}
                  className="w-full h-auto"
                />
              )}
            </div>
          </div>

          {/* Call to Action Content */}
          <div className="space-y-4">
            <div className="text-center space-y-3">
              <p className="text-gray-200 text-sm font-medium">
                Do you want to bring them on board?
              </p>
              <p className="text-gray-300 text-xs">
                Click the button below to Activate your AI Agents 👇
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button 
        onClick={handleHireAgents}
        disabled={isCompleting}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
      >
        {isCompleting ? 'Setting up your agents...' : 'Yes, I Want Them!'}
      </Button>
    </div>
  );
};
