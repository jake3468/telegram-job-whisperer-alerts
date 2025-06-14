
import { useUser } from '@clerk/clerk-react';
import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthHeader from '@/components/AuthHeader';
import JobAlertsSection from '@/components/dashboard/JobAlertsSection';
import { Layout } from '@/components/Layout';

const JobAlerts = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();

  // Memoize timezone to prevent unnecessary re-renders
  const userTimezone = useMemo(() => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }, []);
  useEffect(() => {
    if (isLoaded && !user) {
      navigate('/');
    }
  }, [user, isLoaded, navigate]);
  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pastel-mint via-pastel-lavender to-pastel-peach flex items-center justify-center">
        <div className="text-fuchsia-900 text-xs">Loading...</div>
      </div>
    );
  }
  return (
    <Layout>
      {/* Only flex-column and w-full. Do NOT add min-h-screen here */}
      <div className="flex flex-col w-full bg-transparent">
        <div>
          <div className="text-center mb-8">
            <h1 className="text-4xl font-orbitron font-extrabold bg-gradient-to-r from-orange-400 via-pastel-mint to-fuchsia-400 bg-clip-text text-transparent mb-2 drop-shadow">
              Telegram <span className="italic">Job</span> Alerts
            </h1>
            <p className="text-md text-orange-100 font-inter font-light">
              Manage your personalized <span className="italic text-pastel-peach">job alerts</span> and preferences
            </p>
          </div>
          <div className="space-y-8">
            <JobAlertsSection userTimezone={userTimezone} />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default JobAlerts;
