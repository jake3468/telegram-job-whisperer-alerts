import { useUser } from '@clerk/clerk-react';
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEnterpriseAuth } from '@/hooks/useEnterpriseAuth';
import AuthHeader from '@/components/AuthHeader';
import ResumeSection from '@/components/dashboard/ResumeSection';
import ProfessionalBioSection from '@/components/dashboard/ProfessionalBioSection';

import ClerkJWTSetupGuide from '@/components/ClerkJWTSetupGuide';
import { Layout } from '@/components/Layout';
import { useJWTDebug } from '@/hooks/useJWTDebug';
import { Environment } from '@/utils/environment';
import { OnboardingPopup } from '@/components/OnboardingPopup';
import { useOnboardingPopup } from '@/hooks/useOnboardingPopup';
import { ResumeHelpPopup } from '@/components/ResumeHelpPopup';
import { Button } from '@/components/ui/button';
import { RefreshCw, Copy } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useToast } from '@/hooks/use-toast';
import { useFormTokenKeepAlive } from '@/hooks/useFormTokenKeepAlive';
import { useCachedUserCompletionStatus } from '@/hooks/useCachedUserCompletionStatus';
import { CheckCircle, Circle } from 'lucide-react';
const Profile = () => {
  const {
    user,
    isLoaded
  } = useUser();
  const navigate = useNavigate();
  const {
    isAuthReady,
    executeWithRetry
  } = useEnterpriseAuth();
  const {
    userProfile,
    updateUserProfile
  } = useUserProfile();
  const {
    runComprehensiveJWTTest
  } = useJWTDebug();
  const [showJWTSetupGuide, setShowJWTSetupGuide] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const {
    showPopup,
    hidePopup,
    dontShowAgain
  } = useOnboardingPopup();
  const {
    toast
  } = useToast();

  // Enhanced token management for the entire Profile page
  const {
    updateActivity
  } = useFormTokenKeepAlive(true);

  // Get completion status for gamification
  const { hasResume, hasBio, isComplete } = useCachedUserCompletionStatus();

  // Connection and error state management
  const [connectionIssue, setConnectionIssue] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastJWTTestResult, setLastJWTTestResult] = useState<any>(null);
  const [profileDataLoaded, setProfileDataLoaded] = useState(false);
  const [showResumeHelp, setShowResumeHelp] = useState(false);
  useEffect(() => {
    if (isLoaded && !user) {
      navigate('/');
    }
  }, [user, isLoaded, navigate]);

  // Enhanced JWT setup check with better error handling
  const checkJWTSetup = useCallback(async () => {
    if (!isLoaded || !user || !isAuthReady) return;
    try {
      setError(null);
      setConnectionIssue(false);
      if (Environment.isDevelopment()) {
        const testResult = await executeWithRetry(async () => {
          return await runComprehensiveJWTTest();
        }, 2, 'JWT comprehensive test');
        setLastJWTTestResult(testResult);

        // Show setup guide if JWT is not properly configured
        if (!testResult.jwtRecognized || !testResult.hasRequiredClaims) {
          setShowJWTSetupGuide(true);
        }
      }
      setProfileDataLoaded(true);
    } catch (error) {
      console.error('JWT setup check failed:', error);
      setConnectionIssue(true);
      setError('Failed to verify authentication setup');
      if (!lastJWTTestResult) {
        setProfileDataLoaded(true);
      }
    }
  }, [isLoaded, user, isAuthReady, runComprehensiveJWTTest, lastJWTTestResult, executeWithRetry]);

  // Initial setup check with enhanced readiness
  useEffect(() => {
    if (isLoaded && user && isAuthReady) {
      setTimeout(checkJWTSetup, 300);
    }
  }, [isLoaded, user, isAuthReady, checkJWTSetup]);

  // Manual refresh function - enhanced with token refresh
  const handleManualRefresh = useCallback(() => {
    updateActivity(); // Track user activity
    try {
      if (connectionIssue) {
        window.location.reload();
        return;
      }
      checkJWTSetup();
      setTimeout(() => {
        if (connectionIssue) {
          window.location.reload();
        }
      }, 1000);
    } catch (err) {
      console.error('Manual refresh failed:', err);
      window.location.reload();
    }
  }, [connectionIssue, checkJWTSetup, updateActivity]);
  const detectAndStoreLocation = async () => {
    // Only detect location if it hasn't been set yet
    if (userProfile?.user_location) {
      return;
    }
    try {
      // Use a free IP geolocation service to detect location
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();

      // Check if the user is in India based on country code
      const isInIndia = data.country_code === 'IN';
      const location = isInIndia ? 'india' : 'global';

      // Update user profile with location
      await updateUserProfile({
        user_location: location
      });
    } catch (error) {
      // Fallback to 'global' if detection fails
      await updateUserProfile({
        user_location: 'global'
      });
    }
  };

  // Copy user profile ID to clipboard
  const copyUserProfileId = async () => {
    updateActivity(); // Track user activity
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
  if (!isLoaded || !user) {
    return <div className="min-h-screen bg-gradient-to-br from-pastel-peach via-pastel-blue to-pastel-mint flex items-center justify-center">
        <div className="text-fuchsia-900 text-xs">Loading user...</div>
      </div>;
  }
  return <Layout>
      <div className="text-center mb-8" onClick={updateActivity}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <h1 className="font-extrabold text-3xl md:text-4xl font-orbitron drop-shadow mb-2">
              <span className="mr-2">🎉</span><span className="bg-gradient-to-r from-sky-400 via-fuchsia-400 to-pastel-lavender bg-clip-text text-transparent">Welcome, </span><span className="italic bg-gradient-to-r from-pastel-peach to-pastel-mint bg-clip-text text-transparent">{user.firstName || 'User'}</span>
            </h1>
            <div className="text-gray-100 font-inter font-light text-left text-sm space-y-3">
              <p>🎯 <strong>Complete your profile first</strong> to unlock personalized job alerts and get faster, more relevant job matches tailored to your background.</p>
              
              <p>⚡ <strong>Then activate job alerts</strong> to receive the hottest opportunities delivered straight to your Telegram before they hit LinkedIn or Indeed.</p>
            </div>
          </div>
          
          {/* Manual Refresh Button */}
          {connectionIssue && <Button onClick={handleManualRefresh} variant="outline" size="sm" className="text-xs bg-red-900/20 border-red-400/30 text-red-300 hover:bg-red-800/30">
              <RefreshCw className="w-3 h-3 mr-1" />
              Refresh
            </Button>}
        </div>
        
        {/* Error Message */}
        {error && <div className="bg-red-900/20 border border-red-400/30 rounded-lg p-3 mb-4">
            <p className="text-red-300 text-sm">{error}</p>
          </div>}

      </div>

      {/* Show JWT Setup Guide if needed (development only) */}
      {showJWTSetupGuide && Environment.isDevelopment() && !connectionIssue && <div className="mb-8 flex justify-center">
          <ClerkJWTSetupGuide />
        </div>}

      {!isAuthReady ? <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fuchsia-400 mx-auto"></div>
            <p className="text-gray-300 text-sm">
              Preparing authentication...
            </p>
          </div>
        </div> : <div className="max-w-4xl mx-auto space-y-8 px-4" onClick={updateActivity} onKeyDown={updateActivity}>
          {/* Progress Overview */}
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-emerald-900/20 via-blue-900/20 to-purple-900/20 rounded-2xl p-6 border border-emerald-400/30">
              <h3 className="text-lg font-orbitron font-bold text-emerald-400 mb-4">Profile Completion</h3>
              <div className="flex justify-center items-center space-x-8">
                <div className="flex items-center space-x-2">
                  {hasResume ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <Circle className="w-5 h-5 text-gray-400" />}
                  <span className={`text-sm font-medium ${hasResume ? 'text-emerald-400' : 'text-gray-400'}`}>Resume</span>
                </div>
                <div className="flex items-center space-x-2">
                  {hasBio ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <Circle className="w-5 h-5 text-gray-400" />}
                  <span className={`text-sm font-medium ${hasBio ? 'text-emerald-400' : 'text-gray-400'}`}>Bio</span>
                </div>
                <div className="flex items-center space-x-2">
                  {isComplete ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <Circle className="w-5 h-5 text-gray-400" />}
                  <span className={`text-sm font-medium ${isComplete ? 'text-emerald-400' : 'text-gray-400'}`}>Complete</span>
                </div>
              </div>
              {isComplete && (
                <p className="text-emerald-300 text-sm mt-3 font-medium">🎉 Profile complete! Now you can activate job alerts for maximum impact.</p>
              )}
            </div>
          </div>

          {/* Step Progress Indicator */}
          <div className="flex justify-center items-center space-x-8 mb-12">
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg mb-2 ${
                isComplete ? 'bg-emerald-500 text-black' : 'bg-blue-500 text-white'
              }`}>1</div>
              <span className="text-blue-400 font-semibold text-sm text-center">Profile</span>
            </div>
            <div className={`w-16 h-1 ${isComplete ? 'bg-gradient-to-r from-emerald-400 to-amber-400' : 'bg-gradient-to-r from-blue-400 to-amber-400'}`}></div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 bg-amber-500 text-black rounded-full flex items-center justify-center font-bold text-lg mb-2">2</div>
              <span className="text-amber-400 font-semibold text-sm text-center">Job Alerts</span>
            </div>
          </div>

          {/* Step 1: Your Profile */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-orbitron font-bold">
              <span className="mr-2">🪪</span>
              <span className="bg-gradient-to-r from-sky-400 via-fuchsia-400 to-pastel-lavender bg-clip-text text-blue-200">Your Profile</span>
            </h2>
            <p className="text-blue-200 text-lg font-medium mt-2">Step 1</p>
          </div>

          {/* Resume Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xl font-orbitron font-bold"><span className="mr-2">📑</span><span className="bg-gradient-to-r from-sky-400 to-fuchsia-400 bg-clip-text text-transparent">Add Current Resume</span></h2>
            </div>
            <ResumeSection updateActivity={updateActivity} />
            <div className="mt-4 mb-6 text-center">
              <Button onClick={() => {
            updateActivity();
            setShowResumeHelp(true);
          }} variant="outline" size="sm" className="border-sky-200 hover:border-sky-300 text-white bg-black">
                Need help fixing your resume ?
              </Button>
            </div>
          </div>

          {/* Bio Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xl font-orbitron font-bold">
                <span className="mr-2">✏️</span><span className="bg-gradient-to-r from-pastel-lavender to-pastel-mint bg-clip-text text-transparent">Add Your Bio</span>
              </h2>
            </div>
            <ProfessionalBioSection />
          </div>

          {/* Horizontal separator */}
          <div className="flex items-center my-12">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-400 to-transparent"></div>
          </div>

          {/* Step 2: Create Your Job Alerts Now */}
          <div className="space-y-4 text-center">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-orbitron font-bold">
                <span className="mr-2">📢</span>
                <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Create Your Job Alerts Now</span>
              </h2>
              <p className="text-amber-200 text-lg font-medium mt-2">Step 2</p>
            </div>
            
            {!isComplete && (
              <div className="bg-orange-900/20 border border-orange-400/30 rounded-lg p-4 mb-6">
                <p className="text-orange-300 text-sm">
                  📝 Complete your profile first to get the most relevant job alerts based on your background.
                </p>
              </div>
            )}
            
            <div className="rounded-3xl border-2 border-amber-400/50 bg-gradient-to-br from-amber-900/20 via-orange-900/10 to-yellow-900/20 p-6">
              <div className="text-amber-100 font-inter mb-4 text-base space-y-2">
                <p className="text-sm">Get personalized job alerts delivered to Telegram with all tools included: resume, cover letter, visa info, and job fit analysis.</p>
                
                <div className="mb-3 flex justify-center">
                  <div className="relative max-w-full max-h-64 sm:max-h-80">
                    <img src="/lovable-uploads/011bb020-d0c1-4c09-b4ea-82b329e1afaa.png" alt="Telegram job alert example" className="max-w-full h-auto rounded-lg shadow-sm max-h-64 sm:max-h-80" loading="lazy" onLoad={() => setImageLoaded(true)} onError={e => {
                  e.currentTarget.style.display = 'none';
                  setImageLoaded(true);
                }} />
                    {!imageLoaded && <div className="absolute inset-0 flex items-center justify-center bg-amber-900/20 rounded-lg">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-200"></div>
                      </div>}
                  </div>
                </div>
                <p className="text-sm">Click below to activate the bot and set up your alerts.</p>
              </div>
              
              <div className="mb-4 p-4 bg-amber-900/30 rounded-lg border border-amber-400/30">
                <p className="text-amber-100 font-inter mb-2 text-sm">When the bot asks for your 'Activation Key', copy and paste this:</p>
                {userProfile?.id ? <div className="flex items-center gap-2 bg-black/30 rounded-lg p-3">
                    <code className="text-amber-200 font-mono text-sm flex-1 break-all">
                      {userProfile.id}
                    </code>
                    <Button onClick={copyUserProfileId} variant="ghost" size="sm" className="text-amber-200 hover:text-amber-100 hover:bg-amber-900/30">
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div> : <div className="flex items-center gap-2 bg-black/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 flex-1">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-200"></div>
                      <span className="text-amber-200 text-sm">Loading your Bot ID...</span>
                    </div>
                    <Button onClick={() => {
                updateActivity();
                window.location.reload();
              }} variant="ghost" size="sm" className="text-amber-200 hover:text-amber-100 hover:bg-amber-900/30">
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>}
              </div>
              
              <div className="text-center">
                <Button onClick={async () => {
              updateActivity();
              // Detect and store location when activating the bot
              await detectAndStoreLocation();
              window.open('https://t.me/Job_AI_update_bot', '_blank');
            }} className="bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-black font-semibold font-inter text-sm">
                  <span className="mr-1">🚀</span>Activate the Bot
                </Button>
              </div>
            </div>
          </div>

          {/* Create Job Alerts Link Section */}
          <div className="text-center space-y-3 mt-6">
            <p className="text-gray-300 font-inter text-sm">After activating the bot, create your personalized job alerts:</p>
            <Button onClick={() => {
          updateActivity();
          navigate('/job-alerts');
        }} variant="outline" className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-400/30 font-semibold text-zinc-950 bg-cyan-400 hover:bg-cyan-300">
              🚀 Create Job Alerts
            </Button>
          </div>

        </div>}
      

      {/* Onboarding Popup */}
      <OnboardingPopup isOpen={showPopup} onClose={hidePopup} onDontShowAgain={dontShowAgain} userName={user.firstName || undefined} />
      
      {/* Resume Help Popup */}
      <ResumeHelpPopup isOpen={showResumeHelp} onClose={() => setShowResumeHelp(false)} userProfileId={userProfile?.id} />
    </Layout>;
};
export default Profile;