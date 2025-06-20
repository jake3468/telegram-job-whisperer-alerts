
import { useUser } from '@clerk/clerk-react';
import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthHeader from '@/components/AuthHeader';
import JobAlertsSection from '@/components/dashboard/JobAlertsSection';
import { Layout } from '@/components/Layout';
import { useCreditWarnings } from '@/hooks/useCreditWarnings';
import { useClerkSupabaseSync } from '@/hooks/useClerkSupabaseSync';

const JobAlerts = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();

  // CRITICAL: Ensure Clerk-Supabase sync runs on this page
  useClerkSupabaseSync();
  console.log('[JobAlerts] Page loaded, useClerkSupabaseSync called');

  // Replace useFeatureCreditCheck with the new system
  useCreditWarnings(); // This shows the warning popups

  // Memoize timezone to prevent unnecessary re-renders and ensure IANA format
  const userTimezone = useMemo(() => {
    try {
      // Get IANA timezone using Intl.DateTimeFormat
      const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      // Map legacy timezone names to modern IANA standard
      const timezoneMapping: { [key: string]: string } = {
        'Asia/Calcutta': 'Asia/Kolkata',
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
    console.log('[JobAlerts] Auth state - isLoaded:', isLoaded, 'user:', user ? 'present' : 'null');
    if (isLoaded && !user) {
      console.log('[JobAlerts] No user found, redirecting to home');
      navigate('/');
    }
  }, [user, isLoaded, navigate]);

  if (!isLoaded || !user) {
    console.log('[JobAlerts] Loading or no user, showing loading state');
    return (
      <div className="min-h-screen bg-gradient-to-br from-pastel-mint via-pastel-lavender to-pastel-peach flex items-center justify-center">
        <div className="text-fuchsia-900 text-xs">Loading...</div>
      </div>
    );
  }

  console.log('[JobAlerts] Rendering main content for user:', user.id);

  return (
    <Layout>
      <div className="text-center mb-8">
        <h1
          className="
                text-4xl
                font-orbitron
                font-extrabold
                bg-gradient-to-r
                from-orange-400
                via-yellow-400
                to-pink-500
                bg-clip-text
                text-transparent
                mb-2
                drop-shadow
                tracking-tight
              "
          style={{
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent'
          }}
        >
          Telegram <span className="italic">Job</span> Alerts
        </h1>
        <p className="text-md text-orange-100 font-inter font-light">
          Manage your personalized <span className="italic text-pastel-peach">job alerts</span> and preferences
        </p>
      </div>
      <div className="space-y-8">
        <JobAlertsSection userTimezone={userTimezone} />
      </div>
    </Layout>
  );
};

export default JobAlerts;
