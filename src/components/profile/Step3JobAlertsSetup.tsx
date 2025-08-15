import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormTokenKeepAlive } from '@/hooks/useFormTokenKeepAlive';
import { useCachedUserCompletionStatus } from '@/hooks/useCachedUserCompletionStatus';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Bell, Copy, ExternalLink, CheckCircle, AlertCircle, Zap } from 'lucide-react';
interface Step3JobAlertsSetupProps {
  onComplete: () => void;
}
export const Step3JobAlertsSetup = ({
  onComplete
}: Step3JobAlertsSetupProps) => {
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
  const handleCompleteProfile = () => {
    onComplete();
  };
  return <div className="space-y-4 max-w-2xl mx-auto">
      {/* Step Header */}
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
          <div className="text-white text-xs font-medium space-y-1">
            <p className="mb-2 text-center">With each job alert, you'll get one-click access to everything you need:</p>
            <div className="text-left space-y-1">
              <p>✅ Job-tailored Resume</p>
              <p>✅ Cover Letter</p>
              <p>✅ Interview Preparation Kit</p>
              <p>✅ Company Insights</p>
              <p>✅ Job Match % (how well you fit this role)</p>
              <p>✅ Visa Sponsorship Details (for foreign job seekers)</p>
              <p>✅ LinkedIn HR Contact List</p>
              <p>✅ Personalized Message to HR</p>
            </div>
          </div>
        </div>


        {/* Bot ID Section */}
        <div>
          <div className="p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-gray-700 mb-3 text-xs sm:text-sm font-medium">
              After you click the below 'Activate Telegram Bot' button, the bot will ask for your activation key. At that time, you need to copy and paste the below:
            </p>
            {userProfile?.id ? (
              <div className="flex items-center gap-2 bg-black rounded-lg p-2 sm:p-3 border border-gray-600">
                <code className="text-white font-mono text-xs sm:text-sm flex-1 break-all min-w-0">
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
        <div className="space-y-3">
          <Button 
            onClick={handleActivateBot} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 h-auto min-h-[40px]"
          >
            <ExternalLink className="w-3 h-3 mr-2 flex-shrink-0" />
            <span className="text-xs leading-tight break-words">Activate Telegram Bot</span>
          </Button>
          
          <p className="text-gray-400 text-xs text-center leading-relaxed">
            Make sure you complete the bot activation by following the above steps. Once the bot is activated successfully, click the "Create Alerts" button below to start setting your alerts.
          </p>
        </div>
      </div>
    </div>;
};