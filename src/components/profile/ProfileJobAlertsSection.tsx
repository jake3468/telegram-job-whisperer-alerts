import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormTokenKeepAlive } from '@/hooks/useFormTokenKeepAlive';
import { useCachedUserCompletionStatus } from '@/hooks/useCachedUserCompletionStatus';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Bell, Copy, ExternalLink, AlertCircle } from 'lucide-react';

export const ProfileJobAlertsSection = () => {
  const navigate = useNavigate();
  const {
    updateActivity
  } = useFormTokenKeepAlive(true);
  const {
    isComplete
  } = useCachedUserCompletionStatus();
  const {
    userProfile,
    updateUserProfile
  } = useUserProfile();
  const {
    toast
  } = useToast();
  const [imageLoaded, setImageLoaded] = useState(false);

  const copyUserProfileId = async () => {
    updateActivity();
    if (userProfile?.id) {
      try {
        await navigator.clipboard.writeText(userProfile.id);
        toast({
          title: "Copied!",
          description: "Your Activation Key has been copied to clipboard"
        });
      } catch (err) {
        toast({
          title: "Copy failed",
          description: "Please manually copy the Activation Key",
          variant: "destructive"
        });
      }
    }
  };

  const detectAndStoreLocation = async () => {
    if (userProfile?.user_location) return;
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      const isInIndia = data.country_code === 'IN';
      const location = isInIndia ? 'india' : 'global';
      await updateUserProfile({
        user_location: location
      });
    } catch (error) {
      await updateUserProfile({
        user_location: 'global'
      });
    }
  };

  const handleActivateBot = useCallback(async () => {
    updateActivity();
    await detectAndStoreLocation();
    window.open('https://t.me/Job_AI_update_bot', '_blank');
  }, [updateActivity]);

  const handleCreateJobAlerts = useCallback(() => {
    updateActivity();
    navigate('/job-alerts');
  }, [navigate, updateActivity]);

  return (
    <div className="space-y-2 sm:space-y-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-2 mb-2">
        <div className="relative flex-shrink-0">
          <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl border border-blue-400/30 backdrop-blur-sm">
            <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">3</span>
          </div>
        </div>
        <div className="flex-1">
          <h2 className="text-base sm:text-xl font-bold text-white mb-1">
            Set Up Job Alerts
          </h2>
          <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
            Set up your personalized job alerts now 🔥 and get the latest opportunities from the last 24 hours delivered straight to Telegram - faster and more relevant than LinkedIn or Indeed.
          </p>
        </div>
      </div>

      {/* Profile Completion Status */}
      {!isComplete && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="text-amber-800 font-medium text-xs">Complete your profile first</p>
            <p className="text-amber-700 text-xs break-words">Upload your resume and bio for relevant alerts.</p>
          </div>
        </div>
      )}

      {/* Job Alerts Content */}
      <div className="space-y-3">
        {/* Value Proposition */}
        <div className="space-y-2">
          <p className="text-white text-xs font-medium">
            Click the below "Activate Telegram Bot" button and paste the activation key provided below.
          </p>
          <p className="text-white text-xs font-medium">
            Each job alert will look like below example👇 and will include all tools in one click: resume, cover letter, visa info, job fit, and more.
          </p>
        </div>

        {/* Preview Image */}
        <div className="w-full overflow-hidden">
          <div className="relative w-full max-w-[240px] mx-auto">
            <img 
              src="/lovable-uploads/011bb020-d0c1-4c09-b4ea-82b329e1afaa.png" 
              alt="Telegram job alert example" 
              className="w-full h-auto rounded-lg shadow-sm border border-gray-200 max-w-full" 
              loading="lazy" 
              onLoad={() => setImageLoaded(true)} 
              onError={e => {
                e.currentTarget.style.display = 'none';
                setImageLoaded(true);
              }} 
            />
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>
        </div>

        {/* Bot ID Section */}
        <div className="max-w-md mx-auto">
          <div className="p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-gray-700 mb-3 text-xs sm:text-sm font-medium">
              When the bot asks for your 'Activation Key', use this ID:
            </p>
            {userProfile?.id ? (
              <div className="flex items-center gap-2 bg-white rounded-lg p-2 sm:p-3 border border-gray-200">
                <code className="text-gray-800 font-mono text-xs sm:text-sm flex-1 break-all min-w-0">
                  {userProfile.id}
                </code>
                <Button 
                  onClick={copyUserProfileId} 
                  variant="outline" 
                  size="sm" 
                  className="hover:bg-blue-50 flex-shrink-0"
                >
                  <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-white rounded-lg p-2 sm:p-3 border border-gray-200">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span className="text-gray-600 text-xs sm:text-sm">Loading your Bot ID...</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="max-w-md mx-auto space-y-2">
          <Button 
            onClick={handleActivateBot} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 h-auto min-h-[40px]"
          >
            <ExternalLink className="w-3 h-3 mr-2 flex-shrink-0" />
            <span className="text-xs leading-tight break-words">Activate Telegram Bot</span>
          </Button>
          
          <Button 
            onClick={handleCreateJobAlerts} 
            variant="outline"
            className="w-full py-2 px-3 h-auto min-h-[40px]"
          >
            <span className="text-xs leading-tight">Create Alerts</span>
          </Button>
        </div>
      </div>
    </div>
  );
};