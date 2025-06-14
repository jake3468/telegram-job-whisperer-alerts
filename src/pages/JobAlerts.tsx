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
      <div className="min-h-screen w-full bg-gradient-to-br from-pastel-blue/50 via-pastel-mint/60 to-pastel-peach/80 flex flex-col">
        <div className="max-w-4xl mx-auto w-full px-3 py-8 sm:px-6 sm:py-12 backdrop-blur-2xl rounded-3xl bg-black/85 shadow-2xl shadow-orange-200/20 mt-4">
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
