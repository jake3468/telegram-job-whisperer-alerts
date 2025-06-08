import { useUser } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthHeader from '@/components/AuthHeader';
import JobAlertsSection from '@/components/dashboard/JobAlertsSection';
import { Layout } from '@/components/Layout';
const JobAlerts = () => {
  const {
    user,
    isLoaded
  } = useUser();
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
    return <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xs">Loading...</div>
      </div>;
  }
  return <Layout className="text-3xl">
      <div className="min-h-screen bg-black text-3xl">
        <AuthHeader />
        
        <div className="max-w-4xl mx-auto px-3 py-8 sm:px-4 sm:py-12">
          <div className="text-center mb-8">
            <h1 className="sm:text-xl md:text-2xl font-medium text-white mb-2 font-inter text-3xl">
              Job <span className="bg-gradient-to-r from-orange-500 to-pink-600 bg-clip-text text-transparent">Alerts</span>
            </h1>
            <p className="text-sm text-gray-300 font-inter font-light">
              Manage your personalized job alerts and preferences
            </p>
          </div>

          <div className="space-y-6">
            <JobAlertsSection userTimezone={userTimezone} />
          </div>
        </div>
      </div>
    </Layout>;
};
export default JobAlerts;