import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useCachedUserCompletionStatus } from '@/hooks/useCachedUserCompletionStatus';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Bell, FileText, User, ArrowRight, Home } from 'lucide-react';

export const ProfileWizardComplete = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { hasResume, hasBio, isComplete } = useCachedUserCompletionStatus();

  // Auto-scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const getCompletionMessage = () => {
    if (isComplete) {
      return {
        title: "🎉 Profile Setup Complete!",
        subtitle: "You're all set to receive personalized job alerts",
        variant: "success" as const
      };
    } else if (hasResume || hasBio) {
      return {
        title: "✅ Great Progress!",
        subtitle: "You've made good progress on your profile setup",
        variant: "partial" as const
      };
    } else {
      return {
        title: "👋 Thanks for Getting Started!",
        subtitle: "You can complete your profile anytime",
        variant: "minimal" as const
      };
    }
  };

  const message = getCompletionMessage();

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Main Completion Card */}
      <Card className={`text-center ${
        message.variant === 'success' 
          ? 'bg-gradient-to-br from-emerald-900/20 to-blue-900/20 border-emerald-400/30' 
          : message.variant === 'partial'
            ? 'bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-400/30'
            : 'bg-gradient-to-br from-gray-900/20 to-slate-900/20 border-gray-400/30'
      }`}>
        <CardHeader className="pb-4">
          <div className="flex justify-center mb-4">
            <div className={`p-4 rounded-full ${
              message.variant === 'success' 
                ? 'bg-emerald-500/20' 
                : message.variant === 'partial'
                  ? 'bg-blue-500/20'
                  : 'bg-gray-500/20'
            }`}>
              <CheckCircle className={`w-12 h-12 ${
                message.variant === 'success' 
                  ? 'text-emerald-400' 
                  : message.variant === 'partial'
                    ? 'text-blue-400'
                    : 'text-gray-400'
              }`} />
            </div>
          </div>
          <CardTitle className="text-3xl font-orbitron font-bold mb-2">
            <span className={`${
              message.variant === 'success' 
                ? 'text-emerald-400' 
                : message.variant === 'partial'
                  ? 'text-blue-400'
                  : 'text-gray-400'
            }`}>
              {message.title}
            </span>
          </CardTitle>
          <p className="text-gray-300 text-lg">
            {message.subtitle}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Status Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg border ${
              hasResume 
                ? 'bg-emerald-900/20 border-emerald-400/30' 
                : 'bg-gray-900/20 border-gray-400/30'
            }`}>
              <div className="flex items-center justify-center mb-2">
                <FileText className={`w-6 h-6 ${hasResume ? 'text-emerald-400' : 'text-gray-400'}`} />
              </div>
              <h3 className={`font-semibold text-sm ${hasResume ? 'text-emerald-300' : 'text-gray-400'}`}>
                Resume
              </h3>
              <p className={`text-xs ${hasResume ? 'text-emerald-200' : 'text-gray-500'}`}>
                {hasResume ? 'Uploaded ✓' : 'Not uploaded'}
              </p>
            </div>

            <div className={`p-4 rounded-lg border ${
              hasBio 
                ? 'bg-emerald-900/20 border-emerald-400/30' 
                : 'bg-gray-900/20 border-gray-400/30'
            }`}>
              <div className="flex items-center justify-center mb-2">
                <User className={`w-6 h-6 ${hasBio ? 'text-emerald-400' : 'text-gray-400'}`} />
              </div>
              <h3 className={`font-semibold text-sm ${hasBio ? 'text-emerald-300' : 'text-gray-400'}`}>
                Bio
              </h3>
              <p className={`text-xs ${hasBio ? 'text-emerald-200' : 'text-gray-500'}`}>
                {hasBio ? 'Written ✓' : 'Not written'}
              </p>
            </div>

            <div className={`p-4 rounded-lg border ${
              isComplete 
                ? 'bg-emerald-900/20 border-emerald-400/30' 
                : 'bg-gray-900/20 border-gray-400/30'
            }`}>
              <div className="flex items-center justify-center mb-2">
                <Bell className={`w-6 h-6 ${isComplete ? 'text-emerald-400' : 'text-gray-400'}`} />
              </div>
              <h3 className={`font-semibold text-sm ${isComplete ? 'text-emerald-300' : 'text-gray-400'}`}>
                Job Alerts
              </h3>
              <p className={`text-xs ${isComplete ? 'text-emerald-200' : 'text-gray-500'}`}>
                {isComplete ? 'Ready to setup' : 'Complete profile first'}
              </p>
            </div>
          </div>

          {/* Next Steps */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-200">What's next?</h3>
            <div className="grid gap-3">
              {!isComplete && (
                <Button
                  onClick={() => navigate('/profile/step/1')}
                  variant="outline"
                  className="flex items-center justify-between p-4 h-auto border-blue-400/30 hover:bg-blue-900/20"
                >
                  <div className="text-left">
                    <div className="font-medium text-blue-300">Complete Your Profile</div>
                    <div className="text-sm text-gray-400">Upload resume and write bio for better job matching</div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-blue-400" />
                </Button>
              )}
              
              <Button
                onClick={() => navigate('/job-alerts')}
                variant="outline"
                className="flex items-center justify-between p-4 h-auto border-amber-400/30 hover:bg-amber-900/20"
              >
                <div className="text-left">
                  <div className="font-medium text-amber-300">Create Job Alerts</div>
                  <div className="text-sm text-gray-400">Set up personalized job notifications</div>
                </div>
                <ArrowRight className="w-5 h-5 text-amber-400" />
              </Button>

              <Button
                onClick={() => navigate('/job-board')}
                variant="outline"
                className="flex items-center justify-between p-4 h-auto border-green-400/30 hover:bg-green-900/20"
              >
                <div className="text-left">
                  <div className="font-medium text-green-300">Browse Job Board</div>
                  <div className="text-sm text-gray-400">Explore available opportunities</div>
                </div>
                <ArrowRight className="w-5 h-5 text-green-400" />
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              onClick={() => navigate('/')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Back to Dashboard
            </Button>
            
            <Button 
              onClick={() => navigate('/profile')}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              View Full Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Achievement Message */}
      {isComplete && (
        <div className="mt-8 text-center">
          <div className="bg-gradient-to-r from-emerald-900/20 to-blue-900/20 rounded-xl p-6 border border-emerald-400/30">
            <h3 className="text-xl font-semibold text-emerald-300 mb-3">
              🚀 You're Ready to Get Hired!
            </h3>
            <p className="text-emerald-200 text-sm">
              With your complete profile, you'll receive highly targeted job alerts that match your skills and experience. 
              The AI can now generate personalized cover letters and provide detailed job fit analysis for every opportunity.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};