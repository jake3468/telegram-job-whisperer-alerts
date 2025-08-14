import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormTokenKeepAlive } from '@/hooks/useFormTokenKeepAlive';
import { useCachedUserCompletionStatus } from '@/hooks/useCachedUserCompletionStatus';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Copy, ExternalLink, CheckCircle, AlertCircle, Zap } from 'lucide-react';

interface Step3JobAlertsSetupProps {
  onComplete: () => void;
}

export const Step3JobAlertsSetup = ({ onComplete }: Step3JobAlertsSetupProps) => {
  const navigate = useNavigate();
  const { updateActivity } = useFormTokenKeepAlive(true);
  const { isComplete } = useCachedUserCompletionStatus();
  const { userProfile, updateUserProfile } = useUserProfile();
  const { toast } = useToast();
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

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-amber-500/20 rounded-full">
            <Bell className="w-8 h-8 text-amber-400" />
          </div>
        </div>
        <h2 className="text-2xl font-orbitron font-bold text-amber-400 mb-2">
          Activate Job Alerts
        </h2>
        <p className="text-gray-300 text-lg">
          Get personalized job opportunities delivered straight to Telegram
        </p>
      </div>

      {/* Profile Completion Status */}
      {!isComplete && (
        <div className="bg-orange-900/20 border border-orange-400/30 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-orange-400" />
          <div>
            <p className="text-orange-300 font-medium">Complete your profile first</p>
            <p className="text-orange-200 text-sm">Upload your resume and write your bio to get the most relevant job alerts.</p>
          </div>
        </div>
      )}

      {isComplete && (
        <div className="bg-emerald-900/20 border border-emerald-400/30 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <div>
            <p className="text-emerald-300 font-medium">Profile complete! 🎉</p>
            <p className="text-emerald-200 text-sm">You're ready to receive highly personalized job alerts.</p>
          </div>
        </div>
      )}

      {/* Main Job Alerts Card */}
      <Card className="bg-gradient-to-br from-amber-900/20 via-orange-900/10 to-yellow-900/20 border-amber-400/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-300">
            <Zap className="w-5 h-5" />
            Telegram Job Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Value Proposition */}
          <div className="text-amber-100 space-y-3">
            <p className="text-sm font-medium">
              Get personalized job alerts with everything you need:
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-400 rounded-full" />
                <span>Instant resume generation</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-400 rounded-full" />
                <span>Custom cover letters</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-400 rounded-full" />
                <span>Visa sponsorship info</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-400 rounded-full" />
                <span>Job fit analysis</span>
              </div>
            </div>
          </div>

          {/* Preview Image */}
          <div className="flex justify-center">
            <div className="relative max-w-full max-h-64 sm:max-h-80">
              <img 
                src="/lovable-uploads/011bb020-d0c1-4c09-b4ea-82b329e1afaa.png" 
                alt="Telegram job alert example" 
                className="max-w-full h-auto rounded-lg shadow-lg max-h-64 sm:max-h-80" 
                loading="lazy" 
                onLoad={() => setImageLoaded(true)} 
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  setImageLoaded(true);
                }} 
              />
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-amber-900/20 rounded-lg">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-200"></div>
                </div>
              )}
            </div>
          </div>

          {/* Bot ID Section */}
          <div className="p-4 bg-amber-900/30 rounded-lg border border-amber-400/30">
            <p className="text-amber-100 mb-3 text-sm font-medium">
              When the bot asks for your 'Activation Key', use this ID:
            </p>
            {userProfile?.id ? (
              <div className="flex items-center gap-2 bg-black/30 rounded-lg p-3">
                <code className="text-amber-200 font-mono text-sm flex-1 break-all">
                  {userProfile.id}
                </code>
                <Button 
                  onClick={copyUserProfileId} 
                  variant="ghost" 
                  size="sm" 
                  className="text-amber-200 hover:text-amber-100 hover:bg-amber-900/30"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-black/30 rounded-lg p-3">
                <div className="flex items-center gap-2 flex-1">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-200"></div>
                  <span className="text-amber-200 text-sm">Loading your Bot ID...</span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={handleActivateBot}
              className="w-full bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-black font-semibold"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Activate Telegram Bot
            </Button>
            
            <Button 
              onClick={handleCreateJobAlerts}
              variant="outline"
              className="w-full border-amber-400/30 text-amber-300 hover:bg-amber-900/20"
            >
              <Bell className="w-4 h-4 mr-2" />
              Create Job Alerts
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Benefits Section */}
      <div className="bg-gradient-to-r from-amber-900/10 to-orange-900/10 rounded-xl p-6 border border-amber-400/20">
        <h3 className="text-lg font-semibold text-amber-300 mb-4">Why use Telegram alerts?</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 flex-shrink-0" />
            <p className="text-gray-300 text-sm">
              <strong>Instant notifications:</strong> Get alerts faster than email or other platforms
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 flex-shrink-0" />
            <p className="text-gray-300 text-sm">
              <strong>Complete job package:</strong> Resume, cover letter, and analysis in one message
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 flex-shrink-0" />
            <p className="text-gray-300 text-sm">
              <strong>Mobile-first:</strong> Perfect for job hunting on the go
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 flex-shrink-0" />
            <p className="text-gray-300 text-sm">
              <strong>Privacy focused:</strong> Your data stays secure and private
            </p>
          </div>
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
    </div>
  );
};