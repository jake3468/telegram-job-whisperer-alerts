
import { useUser } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthHeader from '@/components/AuthHeader';
import DashboardNav from '@/components/DashboardNav';
import ResumeSection from '@/components/dashboard/ResumeSection';
import BioSection from '@/components/dashboard/BioSection';
import JobAlertsSection from '@/components/dashboard/JobAlertsSection';

const Dashboard = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const [userTimezone, setUserTimezone] = useState('');

  useEffect(() => {
    if (isLoaded && !user) {
      navigate('/');
    }
  }, [user, isLoaded, navigate]);

  useEffect(() => {
    // Auto-detect user timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setUserTimezone(timezone);
  }, []);

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <AuthHeader />
      
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-semibold text-white mb-4 font-inter">
            Welcome back, <span className="bg-gradient-to-r from-pastel-blue to-pastel-mint bg-clip-text text-transparent">{user.firstName || 'User'}</span>
          </h1>
          <p className="text-xl text-gray-300 font-inter font-light">
            Manage your job preferences and get personalized alerts
          </p>
        </div>

        <DashboardNav />

        <div className="space-y-8">
          <ResumeSection />
          <BioSection />
          <JobAlertsSection userTimezone={userTimezone} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
