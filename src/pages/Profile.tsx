
import { useUser } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

const Profile = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const { runComprehensiveJWTTest } = useJWTDebug();
  const [showJWTSetupGuide, setShowJWTSetupGuide] = useState(false);
  const { showPopup, hidePopup, dontShowAgain } = useOnboardingPopup();
  
  // Keep tokens fresh while user is on profile page
  const { updateActivity } = useFormTokenKeepAlive(true);

  useEffect(() => {
    if (isLoaded && !user) {
      navigate('/');
    }
  }, [user, isLoaded, navigate]);

  // Only check JWT setup in development to avoid production delays
  useEffect(() => {
    if (isLoaded && user && Environment.isDevelopment()) {
      const checkJWTSetup = async () => {
        const testResult = await runComprehensiveJWTTest();
        
        // Show setup guide if JWT is not properly configured
        if (!testResult.jwtRecognized || !testResult.hasRequiredClaims) {
          setShowJWTSetupGuide(true);
        }
      };
      
      // Reduced delay for faster loading
      setTimeout(checkJWTSetup, 500);
    }
  }, [isLoaded, user, runComprehensiveJWTTest]);

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pastel-peach via-pastel-blue to-pastel-mint flex items-center justify-center">
        <div className="text-fuchsia-900 text-xs">Loading...</div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="text-center mb-8">
        <h1 className="font-extrabold text-3xl md:text-4xl font-orbitron bg-gradient-to-r from-sky-400 via-fuchsia-400 to-pastel-lavender bg-clip-text text-transparent drop-shadow mb-2">
          Welcome, <span className="italic bg-gradient-to-r from-pastel-peach to-pastel-mint bg-clip-text text-transparent">{user.firstName || 'User'}</span>
        </h1>
        <p className="text-lg text-gray-100 font-inter font-light">
          Manage your <span className="italic text-pastel-blue">profile</span> information and resume
        </p>
      </div>

      {/* Show JWT Setup Guide if needed (development only) */}
      {showJWTSetupGuide && Environment.isDevelopment() && (
        <div className="mb-8 flex justify-center">
          <ClerkJWTSetupGuide />
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-8 px-4" onClick={updateActivity} onKeyDown={updateActivity}>
        <ResumeSection />
        <BioSection />
      </div>
      
      {/* JWT Debug Panel - only in development */}
      {Environment.isDevelopment() && (
        <JWTDebugPanel />
      )}

      {/* Onboarding Popup */}
      <OnboardingPopup
        isOpen={showPopup}
        onClose={hidePopup}
        onDontShowAgain={dontShowAgain}
        userName={user.firstName || undefined}
      />
    </Layout>
  );
};

export default Profile;
