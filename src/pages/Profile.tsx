import { useUser } from '@clerk/clerk-react';
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEnterpriseAuth } from '@/hooks/useEnterpriseAuth';
import AuthHeader from '@/components/AuthHeader';
import ResumeSection from '@/components/dashboard/ResumeSection';
import ProfessionalBioSection from '@/components/dashboard/ProfessionalBioSection';
import JWTDebugPanel from '@/components/JWTDebugPanel';
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
    userProfile
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
            <h1 className="font-extrabold text-3xl md:text-4xl font-orbitron bg-gradient-to-r from-sky-400 via-fuchsia-400 to-pastel-lavender bg-clip-text text-transparent drop-shadow mb-2">
              Welcome, <span className="italic bg-gradient-to-r from-pastel-peach to-pastel-mint bg-clip-text text-transparent">{user.firstName || 'User'}</span>
            </h1>
            <p className="text-gray-100 font-inter font-light text-left text-base">
              Complete 3 quick steps to apply faster, transform your job search, and stand out as a top applicant. Add your <span className="italic text-green-300">resume</span> and <span className="italic text-pastel-blue">bio</span>, then set up personalized <span className="italic text-amber-200">job alerts</span>.
            </p>
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
          {/* Step 1: Resume Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-sky-700 to-fuchsia-700 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-lg">
                1
              </div>
              <h2 className="text-xl font-orbitron font-bold bg-gradient-to-r from-sky-400 to-fuchsia-400 bg-clip-text text-transparent">Add Current Resume</h2>
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

          {/* Step 2: Bio Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-teal-700 to-emerald-700 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-lg">
                2
              </div>
              <h2 className="text-xl font-orbitron font-bold bg-gradient-to-r from-pastel-lavender to-pastel-mint bg-clip-text text-transparent">
                Add Your Bio
              </h2>
            </div>
            <ProfessionalBioSection />
          </div>

          {/* Step 3: Job Alerts */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-400 rounded-full flex items-center justify-center font-bold text-black text-sm shadow-lg border-2 border-amber-300">
                3
              </div>
              <h2 className="text-xl font-orbitron font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                Create Job Alerts
              </h2>
            </div>
            <div className="rounded-3xl border-2 border-amber-400/50 bg-gradient-to-br from-amber-900/20 via-orange-900/10 to-yellow-900/20 p-6">
              <div className="text-amber-100 font-inter mb-4 text-base space-y-2">
                <p className="text-sm">Set up personalized job alerts and get updates from the last 24 hours 🔥 delivered straight to your Telegram everyday just for you, based on your preferences.</p>
                
                <p className="text-sm">Each job alert will look like below example👇 and will include all tools in one click: resume, cover letter, visa info, job fit, and more.</p>
                
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
                <p className="text-sm">Click the button below to activate the Telegram Job Alert Bot and create your personalized job alerts.</p>
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
              
              <Button onClick={() => {
            updateActivity();
            window.open('https://t.me/Job_AI_update_bot', '_blank');
          }} className="bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-black font-semibold font-inter text-sm">Activate the Bot</Button>
            </div>
          </div>

          {/* Create Job Alerts Link Section */}
          <div className="text-center space-y-3 mt-6">
            <p className="text-gray-300 font-inter text-sm">
              If you've completed the above 3 steps and activated your Telegram Job Alerts Bot, click below to go to the Create Job Alerts page:
            </p>
            <Button onClick={() => {
          updateActivity();
          navigate('/job-alerts');
        }} variant="outline" className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-400/30 font-semibold text-zinc-950 bg-sky-400 hover:bg-sky-300">
              🔗 Create Job Alerts
            </Button>
          </div>
        </div>}
      
      {/* JWT Debug Panel - only in development */}
      {Environment.isDevelopment() && <JWTDebugPanel />}

      {/* Onboarding Popup */}
      <OnboardingPopup isOpen={showPopup} onClose={hidePopup} onDontShowAgain={dontShowAgain} userName={user.firstName || undefined} />
      
      {/* Resume Help Popup */}
      <ResumeHelpPopup isOpen={showResumeHelp} onClose={() => setShowResumeHelp(false)} userProfileId={userProfile?.id} />
    </Layout>;
};
export default Profile;