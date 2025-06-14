
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
      <div className="min-h-screen bg-gradient-to-br from-sky-900 via-black to-fuchsia-950 flex items-center justify-center">
        <div className="text-fuchsia-200 text-xs">Loading...</div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen w-full bg-gradient-to-br from-sky-950 via-black to-fuchsia-950 pt-0 lg:pt-0 flex flex-col">
        {/* Glassy Content Wrapper */}
        <div className="max-w-4xl mx-auto w-full px-3 py-8 sm:px-6 sm:py-12 backdrop-blur-lg rounded-3xl bg-black/70 shadow-2xl shadow-fuchsia-300/10 mt-4">
          <div className="text-center mb-8">
            <h1 className="sm:text-xl font-extrabold text-white mb-2 font-orbitron text-3xl md:text-4xl bg-gradient-to-r from-sky-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent drop-shadow">
              Welcome back, <span className="italic not-italic:hover bg-gradient-to-r from-pastel-blue to-pastel-mint bg-clip-text text-transparent">{user.firstName || 'User'}</span>
            </h1>
            <p className="text-sm text-gray-300 font-inter font-light">
              Manage your <span className="italic text-fuchsia-300">profile</span> information and resume
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
