import { useUser } from '@clerk/clerk-react';
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEnterpriseAuth } from '@/hooks/useEnterpriseAuth';
import AuthHeader from '@/components/AuthHeader';
import ResumeSection from '@/components/dashboard/ResumeSection';
import BioSection from '@/components/dashboard/BioSection';
import JWTDebugPanel from '@/components/JWTDebugPanel';
import ClerkJWTSetupGuide from '@/components/ClerkJWTSetupGuide';
import { Layout } from '@/components/Layout';
import { useJWTDebug } from '@/hooks/useJWTDebug';
import { Environment } from '@/utils/environment';
import { OnboardingPopup } from '@/components/OnboardingPopup';
import { useOnboardingPopup } from '@/hooks/useOnboardingPopup';
import { useFormTokenKeepAlive } from '@/hooks/useFormTokenKeepAlive';
import { ResumeHelpPopup } from '@/components/ResumeHelpPopup';
import { Button } from '@/components/ui/button';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
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
  const {
    showPopup,
    hidePopup,
    dontShowAgain
  } = useOnboardingPopup();

  // Keep tokens fresh while user is on profile page
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

  // Enhanced JWT setup check with enterprise auth retry logic
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

      // Keep last successful data visible
      if (!lastJWTTestResult) {
        setProfileDataLoaded(true); // Allow graceful degradation
      }
    }
  }, [isLoaded, user, isAuthReady, runComprehensiveJWTTest, lastJWTTestResult, executeWithRetry]);

  // Initial setup check with auth readiness
  useEffect(() => {
    if (isLoaded && user && isAuthReady) {
      // Reduced delay for faster loading
      setTimeout(checkJWTSetup, 500);
    }
  }, [isLoaded, user, isAuthReady, checkJWTSetup]);

  // Manual refresh function - instant refresh for better UX
  const handleManualRefresh = useCallback(() => {
    try {
      // For connection issues, immediately force page refresh
      if (connectionIssue) {
        window.location.reload();
        return;
      }

      // Otherwise try refreshing data first and fall back if needed
      checkJWTSetup();

      // Short timeout for fallback
      setTimeout(() => {
        if (connectionIssue) {
          window.location.reload();
        }
      }, 1000);
    } catch (err) {
      console.error('Manual refresh failed:', err);
      // Force page refresh if all else fails
      window.location.reload();
    }
  }, [connectionIssue, checkJWTSetup]);
  if (!isLoaded || !user) {
    return <div className="min-h-screen bg-gradient-to-br from-pastel-peach via-pastel-blue to-pastel-mint flex items-center justify-center">
        <div className="text-fuchsia-900 text-xs">Loading user...</div>
      </div>;
  }
  return <Layout>
      <div className="text-center mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <h1 className="font-extrabold text-3xl md:text-4xl font-orbitron bg-gradient-to-r from-sky-400 via-fuchsia-400 to-pastel-lavender bg-clip-text text-transparent drop-shadow mb-2">
              Welcome, <span className="italic bg-gradient-to-r from-pastel-peach to-pastel-mint bg-clip-text text-transparent">{user.firstName || 'User'}</span>
            </h1>
            <p className="text-gray-100 font-inter font-light text-left text-base">
              Complete the below 3 simple steps to get started with your job search. Add your <span className="italic text-yellow-200">resume</span> and <span className="italic text-pastel-blue">bio</span>, then set up personalized <span className="italic text-amber-200">job alerts</span>.
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
            <p className="text-gray-300 text-sm">Preparing authentication...</p>
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
            <ResumeSection />
            <div className="mt-4 mb-6">
              <Button onClick={() => setShowResumeHelp(true)} variant="outline" size="sm" className="border-sky-200 hover:border-sky-300 text-white bg-black">Need help fixing your resume ?</Button>
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
            <BioSection />
          </div>

          {/* Step 3: Job Alerts */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-400 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-lg">
                3
              </div>
              <h2 className="text-xl font-orbitron font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                Create Job Alerts
              </h2>
            </div>
            <div className="rounded-3xl border-2 border-amber-400/50 bg-gradient-to-br from-amber-900/20 via-orange-900/10 to-yellow-900/20 p-6">
              <p className="text-amber-100 font-inter mb-4 text-base">Set up personalized job alerts and get updates from the last 24 hours 🔥 delivered straight to your Telegram everyday just for you, based on your preferences.


No outdated listings, no clutter. Only fresh, relevant jobs posted in the past 24 hours — something no other platform offers. Click the button below to create your alert, or use the 'Create Job Alerts' option in the sidebar menu at the top left.</p>
              <Button onClick={() => navigate('/job-alerts')} className="bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-black font-semibold font-inter">
                Go to Create Job Alerts
              </Button>
            </div>
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