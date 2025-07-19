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
import { Button } from '@/components/ui/button';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';
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
            <p className="text-lg text-gray-100 font-inter font-light">
              Add your <span className="italic text-amber-200">current resume</span> and <span className="italic text-pastel-blue">bio details</span> on this page. Once you're done, go to the <span className="italic text-pastel-blue">'Create Job Alerts'</span> page to set up personalized job alerts.
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
          {/* Profile sections - show even during connection issues for better UX */}
          <ResumeSection />
          <BioSection />
        </div>}
      
      {/* JWT Debug Panel - only in development */}
      {Environment.isDevelopment() && <JWTDebugPanel />}

      {/* Onboarding Popup */}
      <OnboardingPopup isOpen={showPopup} onClose={hidePopup} onDontShowAgain={dontShowAgain} userName={user.firstName || undefined} />
    </Layout>;
};
export default Profile;