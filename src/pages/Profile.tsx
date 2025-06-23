
import { useUser } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthHeader from '@/components/AuthHeader';
import ResumeSection from '@/components/dashboard/ResumeSection';
import BioSection from '@/components/dashboard/BioSection';
import AuthDebugPanel from '@/components/AuthDebugPanel';
import JWTDebugPanel from '@/components/JWTDebugPanel';
import ClerkJWTSetupGuide from '@/components/ClerkJWTSetupGuide';
import { Layout } from '@/components/Layout';
import { useJWTDebug } from '@/hooks/useJWTDebug';

const Profile = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const { runComprehensiveJWTTest } = useJWTDebug();
  const [showJWTSetupGuide, setShowJWTSetupGuide] = useState(false);

  useEffect(() => {
    if (isLoaded && !user) {
      navigate('/');
    }
  }, [user, isLoaded, navigate]);

  // Check JWT setup on component mount
  useEffect(() => {
    if (isLoaded && user) {
      const checkJWTSetup = async () => {
        const testResult = await runComprehensiveJWTTest();
        
        // Show setup guide if JWT is not properly configured
        if (!testResult.jwtRecognized || !testResult.hasRequiredClaims) {
          setShowJWTSetupGuide(true);
        }
      };
      
      // Run the check after a short delay to ensure sync has completed
      setTimeout(checkJWTSetup, 2000);
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
          Welcome back, <span className="italic bg-gradient-to-r from-pastel-peach to-pastel-mint bg-clip-text text-transparent">{user.firstName || 'User'}</span>
        </h1>
        <p className="text-lg text-gray-100 font-inter font-light">
          Manage your <span className="italic text-pastel-blue">profile</span> information and resume
        </p>
      </div>

      {/* Show JWT Setup Guide if needed */}
      {showJWTSetupGuide && (
        <div className="mb-8 flex justify-center">
          <ClerkJWTSetupGuide />
        </div>
      )}

      <div className="space-y-8">
        <ResumeSection />
        <BioSection />
      </div>
      
      {/* Debug Panels - only in development */}
      {import.meta.env.DEV && (
        <>
          <AuthDebugPanel />
          <JWTDebugPanel />
        </>
      )}
    </Layout>
  );
};

export default Profile;
