import { useUser } from '@clerk/clerk-react';
import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthHeader from '@/components/AuthHeader';
import JobAlertsSection from '@/components/dashboard/JobAlertsSection';
import { Layout } from '@/components/Layout';
import { useCreditWarnings } from '@/hooks/useCreditWarnings';
import { useClerkSupabaseSync } from '@/hooks/useClerkSupabaseSync';
import { ProfileCompletionWarning } from '@/components/ProfileCompletionWarning';
const JobAlerts = () => {
  const {
    user,
    isLoaded
  } = useUser();
  const navigate = useNavigate();

  // CRITICAL: Ensure Clerk-Supabase sync runs on this page
  useClerkSupabaseSync();

  // Replace useFeatureCreditCheck with the new system
  useCreditWarnings(); // This shows the warning popups

  // Memoize timezone to prevent unnecessary re-renders and ensure IANA format
  const userTimezone = useMemo(() => {
    try {
      // Get IANA timezone using Intl.DateTimeFormat
      const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Map legacy timezone names to modern IANA standard
      const timezoneMapping: {
        [key: string]: string;
      } = {
        'Asia/Calcutta': 'Asia/Kolkata'
        // Add other legacy mappings if needed in the future
      };

      // Check if we have a mapping for the detected timezone
      const modernTimezone = timezoneMapping[detectedTimezone] || detectedTimezone;

      // Validate that it's a proper IANA timezone format
      if (modernTimezone && modernTimezone.includes('/')) {
        return modernTimezone;
      }

      // Fallback to UTC if detection fails
      return 'UTC';
    } catch (error) {
      console.warn('Timezone detection failed, using UTC as fallback:', error);
      return 'UTC';
    }
  }, []);
  useEffect(() => {
    if (isLoaded && !user) {
      navigate('/');
    }
  }, [user, isLoaded, navigate]);
  if (!isLoaded || !user) {
    return <div className="min-h-screen bg-gradient-to-br from-pastel-mint via-pastel-lavender to-pastel-peach flex items-center justify-center">
        <div className="text-fuchsia-900 text-xs">Loading...</div>
      </div>;
  }
  return <Layout>
      <div className="text-center mb-8">
        <h1 className="text-4xl font-orbitron font-extrabold mb-2 drop-shadow tracking-tight flex items-center justify-center gap-2">
          <span>⏰</span>
          <span style={{
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent'
        }} className="bg-gradient-to-r from-orange-400 via-yellow-400 to-pink-500 bg-clip-text text-amber-400 text-left">
            Telegram <span className="italic">Job</span> Alerts
          </span>
        </h1>
        
        <p className="text-md text-orange-100 font-inter font-light mb-4">
          Manage your personalized <span className="italic text-pastel-peach">job alerts</span> and preferences
        </p>

        {/* Usage Cost Badge */}
        <div className="flex justify-center mb-4">
          <div className="inline-flex items-center px-4 py-2 bg-green-500 text-black text-sm font-semibold rounded-full shadow-md">
            <span className="mr-2 text-sm">💰</span>
            Usage Cost: Free
          </div>
        </div>
      </div>

      {/* Profile Completion Warning */}
      <ProfileCompletionWarning />

      <div className="space-y-8">
        <JobAlertsSection userTimezone={userTimezone} />
      </div>
    </Layout>;
};
export default JobAlerts;