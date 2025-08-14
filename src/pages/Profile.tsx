import { useUser } from '@clerk/clerk-react';
import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEnterpriseAuth } from '@/hooks/useEnterpriseAuth';
import { Layout } from '@/components/Layout';
import { useJWTDebug } from '@/hooks/useJWTDebug';
import { Environment } from '@/utils/environment';
import { OnboardingPopup } from '@/components/OnboardingPopup';
import { useOnboardingPopup } from '@/hooks/useOnboardingPopup';
import { ResumeHelpPopup } from '@/components/ResumeHelpPopup';
import { ProfileWizard } from '@/components/profile/ProfileWizard';
import { ProfileWizardComplete } from '@/components/profile/ProfileWizardComplete';
import ClerkJWTSetupGuide from '@/components/ClerkJWTSetupGuide';
import { Button } from '@/components/ui/button';
import { RefreshCw, FileText, User, Bell } from 'lucide-react';
import { useFormTokenKeepAlive } from '@/hooks/useFormTokenKeepAlive';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useToast } from '@/hooks/use-toast';
import ResumeSection from '@/components/dashboard/ResumeSection';
import ProfessionalBioSection from '@/components/dashboard/ProfessionalBioSection';
import JobAlertsSection from '@/components/dashboard/JobAlertsSection';
const Profile = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const { step } = useParams();
  const { isAuthReady, executeWithRetry } = useEnterpriseAuth();
  const { runComprehensiveJWTTest } = useJWTDebug();
  const [showJWTSetupGuide, setShowJWTSetupGuide] = useState(false);
  const { showPopup, hidePopup, dontShowAgain } = useOnboardingPopup();
  const { updateActivity } = useFormTokenKeepAlive(true);
  const { userProfile, updateUserProfile } = useUserProfile();
  const { toast } = useToast();

  // Check if we should show wizard or full profile
  const shouldShowWizard = userProfile && !userProfile.profile_setup_completed;

  // Connection and error state management
  const [connectionIssue, setConnectionIssue] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastJWTTestResult, setLastJWTTestResult] = useState<any>(null);
  const [profileDataLoaded, setProfileDataLoaded] = useState(false);
  const [showResumeHelp, setShowResumeHelp] = useState(false);

  // Check if we're in wizard mode
  const isWizardMode = step || window.location.pathname.includes('/step/') || window.location.pathname.includes('/complete');

  // No longer redirecting to step URLs
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

  // Show wizard if profile setup not completed
  if (shouldShowWizard) {
    return (
      <Layout>
        <ProfileWizard />
        {/* Onboarding Popup */}
        {showPopup && (
          <OnboardingPopup isOpen={showPopup} onClose={hidePopup} onDontShowAgain={dontShowAgain} />
        )}
        {/* Resume Help Popup */}
        {showResumeHelp && (
          <ResumeHelpPopup isOpen={showResumeHelp} onClose={() => setShowResumeHelp(false)} />
        )}
        {/* JWT Setup Guide */}
        {showJWTSetupGuide && Environment.isDevelopment() && !connectionIssue && (
          <div className="mb-8 flex justify-center">
            <ClerkJWTSetupGuide />
          </div>
        )}
      </Layout>
    );
  }

  // Show completed profile content when setup is done
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center mb-8" onClick={updateActivity}>
          <h1 className="font-extrabold text-3xl md:text-4xl font-orbitron drop-shadow mb-2">
            <span className="mr-2">🎉</span>
            <span className="bg-gradient-to-r from-sky-400 via-fuchsia-400 to-pastel-lavender bg-clip-text text-transparent">Welcome, </span>
            <span className="italic bg-gradient-to-r from-pastel-peach to-pastel-mint bg-clip-text text-transparent">{user.firstName || 'User'}</span>
          </h1>
          <p className="text-gray-300 text-lg">Your profile is complete! Manage your information below.</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/20 border border-red-400/30 rounded-lg p-3 mb-4">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* JWT Setup Guide */}
        {showJWTSetupGuide && Environment.isDevelopment() && !connectionIssue && (
          <div className="mb-8 flex justify-center">
            <ClerkJWTSetupGuide />
          </div>
        )}

        {/* Profile Sections */}
        <div className="space-y-8">
          {/* Resume Section */}
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Resume</h2>
                <p className="text-muted-foreground text-sm">Manage your resume file</p>
              </div>
            </div>
            <ResumeSection updateActivity={updateActivity} />
          </div>

          {/* Bio Section */}
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <User className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Professional Bio</h2>
                <p className="text-muted-foreground text-sm">Your professional summary</p>
              </div>
            </div>
            <ProfessionalBioSection />
          </div>

          {/* Job Alerts Section */}
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Bell className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Job Alerts</h2>
                <p className="text-muted-foreground text-sm">Create and manage your job alerts</p>
              </div>
            </div>
            <JobAlertsSection userTimezone={Intl.DateTimeFormat().resolvedOptions().timeZone} />
          </div>
        </div>
      </div>

      {/* Onboarding Popup */}
      {showPopup && (
        <OnboardingPopup isOpen={showPopup} onClose={hidePopup} onDontShowAgain={dontShowAgain} />
      )}
      
      {/* Resume Help Popup */}
      {showResumeHelp && (
        <ResumeHelpPopup isOpen={showResumeHelp} onClose={() => setShowResumeHelp(false)} />
      )}
    </Layout>
  );
};
export default Profile;