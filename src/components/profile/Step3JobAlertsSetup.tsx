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
          description: "Your Bot ID has been copied to clipboard"
        });
      } catch (err) {
        toast({
          title: "Copy failed",
          description: "Please manually copy the Bot ID",
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
  return <div className="space-y-6">
      {/* Step Header */}
      <div className="flex items-start gap-4 mb-4">
        <div className="relative p-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg flex-shrink-0">
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center">
            <span className="text-sm font-bold text-gray-700">3</span>
          </div>
          <div className="text-white">
            <Bell className="w-6 h-6" />
          </div>
        </div>
        <div className="flex-1">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">
            Set Up Job Alerts
          </h2>
          <p className="text-gray-600 text-sm md:text-base leading-relaxed">
            Get personalized job opportunities delivered straight to Telegram
          </p>
        </div>
      </div>

      {/* Profile Completion Status */}
      {!isComplete && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-800 font-medium text-sm">Complete your profile first</p>
            <p className="text-amber-700 text-sm">Upload your resume and write your bio to get the most relevant job alerts.</p>
          </div>
        </div>
      )}

      {isComplete && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-green-800 font-medium text-sm">Profile complete! 🎉</p>
            <p className="text-green-700 text-sm">You're ready to receive highly personalized job alerts.</p>
          </div>
        </div>
      )}

      {/* Job Alerts Content */}
      <div className="space-y-4">
        {/* Value Proposition */}
        <div className="space-y-3">
          <p className="text-gray-700 text-sm font-medium">
            Get personalized job alerts with everything you need:
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span>Instant resume generation</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span>Custom cover letters</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span>Visa sponsorship info</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span>Job fit analysis</span>
            </div>
          </div>
        </div>

        {/* Preview Image */}
        <div className="flex justify-center">
          <div className="relative w-full max-w-xs">
            <img 
              src="/lovable-uploads/011bb020-d0c1-4c09-b4ea-82b329e1afaa.png" 
              alt="Telegram job alert example" 
              className="w-full h-auto rounded-lg shadow-md border border-gray-200" 
              loading="lazy" 
              onLoad={() => setImageLoaded(true)} 
              onError={e => {
                e.currentTarget.style.display = 'none';
                setImageLoaded(true);
              }} 
            />
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>
        </div>

        {/* Bot ID Section */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-gray-700 mb-3 text-sm font-medium">
            When the bot asks for your 'Activation Key', use this ID:
          </p>
          {userProfile?.id ? (
            <div className="flex items-center gap-2 bg-white rounded-lg p-3 border border-gray-200">
              <code className="text-gray-800 font-mono text-sm flex-1 break-all">
                {userProfile.id}
              </code>
              <Button 
                onClick={copyUserProfileId} 
                variant="outline" 
                size="sm" 
                className="hover:bg-blue-50"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-white rounded-lg p-3 border border-gray-200">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span className="text-gray-600 text-sm">Loading your Bot ID...</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button 
            onClick={handleActivateBot} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Activate Telegram Bot
          </Button>
          
          <Button 
            onClick={handleCreateJobAlerts} 
            variant="outline" 
            className="w-full border-blue-300 text-blue-600 hover:bg-blue-50"
          >
            <Bell className="w-4 h-4 mr-2" />
            Create Job Alerts
          </Button>
        </div>
      </div>

      {/* Complete Setup Button */}
      <div className="text-center pt-4">
        <Button 
          onClick={handleCompleteProfile} 
          className="bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white font-semibold px-8"
        >
          Complete Profile Setup 🎉
        </Button>
      </div>
    </div>;
};