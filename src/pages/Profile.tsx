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
      <div className="min-h-screen bg-gradient-to-br from-pastel-peach via-pastel-blue to-pastel-mint flex items-center justify-center">
        <div className="text-fuchsia-900 text-xs">Loading...</div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen w-full bg-gradient-to-br from-pastel-lavender via-pastel-peach/70 to-pastel-mint/70 flex flex-col">
        <div className="max-w-4xl mx-auto w-full px-3 py-8 sm:px-6 sm:py-12 backdrop-blur-xl rounded-3xl bg-black/80 shadow-2xl shadow-fuchsia-400/15 mt-4">
          <div className="text-center mb-8">
            <h1 className="font-extrabold text-3xl md:text-4xl font-orbitron bg-gradient-to-r from-sky-400 via-fuchsia-400 to-pastel-lavender bg-clip-text text-transparent drop-shadow mb-2">
              Welcome back, <span className="italic bg-gradient-to-r from-pastel-peach to-pastel-mint bg-clip-text text-transparent">{user.firstName || 'User'}</span>
            </h1>
            <p className="text-lg text-gray-100 font-inter font-light">
              Manage your <span className="italic text-pastel-blue">profile</span> information and resume
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
