
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
      <div className="min-h-screen bg-gradient-to-br from-sky-900 via-black to-fuchsia-950 flex items-center justify-center">
        <div className="text-fuchsia-200 text-xs">Loading...</div>
      </div>
    );
  }
  return (
    <Layout>
      <div className="min-h-screen w-full bg-gradient-to-br from-orange-900/60 via-black to-pink-900/80 pt-0 lg:pt-0 flex flex-col">
        <div className="max-w-4xl mx-auto w-full px-3 py-8 sm:px-6 sm:py-12 backdrop-blur-lg rounded-3xl bg-black/70 shadow-2xl shadow-orange-200/15 mt-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-orbitron font-extrabold bg-gradient-to-r from-orange-500 via-pink-500 to-fuchsia-400 bg-clip-text text-transparent mb-2 drop-shadow">
              Telegram <span className="italic">Job</span> Alerts
            </h1>
            <p className="text-sm text-orange-100 font-inter font-light">
              Manage your personalized <span className="italic text-pink-400">job alerts</span> and preferences
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
