
import { useUser } from '@clerk/clerk-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthHeader from '@/components/AuthHeader';
import ResumeSection from '@/components/dashboard/ResumeSection';
import BioSection from '@/components/dashboard/BioSection';
import { Layout } from '@/components/Layout';

const Profile = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoaded && !user) {
      navigate('/');
    }
  }, [user, isLoaded, navigate]);

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-black">
        <AuthHeader />
        
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-semibold text-white mb-4 font-inter">
              Welcome back, <span className="bg-gradient-to-r from-pastel-blue to-pastel-mint bg-clip-text text-transparent">{user.firstName || 'User'}</span>
            </h1>
            <p className="text-xl text-gray-300 font-inter font-light">
              Manage your profile information and resume
            </p>
          </div>

          <div className="space-y-8">
            <ResumeSection />
            <BioSection />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
