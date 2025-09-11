import { useUser } from '@clerk/clerk-react';
import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthHeader from '@/components/AuthHeader';
import JobAlertsSection from '@/components/dashboard/JobAlertsSection';
import { Layout } from '@/components/Layout';
import { useCreditWarnings } from '@/hooks/useCreditWarnings';
import { useClerkSupabaseSync } from '@/hooks/useClerkSupabaseSync';
import { useEnhancedTokenManagerIntegration } from '@/hooks/useEnhancedTokenManagerIntegration';
import { useFormTokenKeepAlive } from '@/hooks/useFormTokenKeepAlive';
import { JobAlertsOnboardingPopup } from '@/components/JobAlertsOnboardingPopup';
import { Badge } from '@/components/ui/badge';
const JobAlerts = () => {
  const {
    user,
    isLoaded
  } = useUser();
  const navigate = useNavigate();

  // CRITICAL: Ensure Clerk-Supabase sync runs on this page
  useClerkSupabaseSync();

  // Enterprise session management for Job Alerts page
  const sessionManager = useEnhancedTokenManagerIntegration({
    enabled: true
  });

  // Proactive token refresh to prevent expiration
  const {
    updateActivity
  } = useFormTokenKeepAlive(true);

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
        <div className="text-fuchsia-900 text-xs">Loading user...</div>
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
            Create Job <span className="italic">Alerts</span>
          </span>
        </h1>
        
        <p className="text-md text-orange-100 font-inter font-light mb-4 text-left max-w-2xl mx-auto">
          Set your personalized job alerts here and our Telegram &quot;Job Alerts&quot; AI Agent will send you the latest 24-hour postings straight to your Telegram everyday. They will also appear under &apos;Posted Today&apos; on your Job Board page.
        </p>

        {/* Usage Cost Badge */}
        <Badge variant="outline" className="bg-orange-900/30 border-orange-600/50 text-orange-300 font-semibold">
          Usage Fee: 0.1 credits per alert message
        </Badge>
      </div>

      {/* Job Alerts Onboarding Popup */}
      <JobAlertsOnboardingPopup />

      <div className="space-y-8">
        <JobAlertsSection userTimezone={userTimezone} sessionManager={sessionManager} />
      </div>
    </Layout>;
};
export default JobAlerts;