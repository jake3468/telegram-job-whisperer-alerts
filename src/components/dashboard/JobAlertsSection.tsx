
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Bell, Plus } from 'lucide-react';
import JobAlertForm from './JobAlertForm';
import JobAlertsList from './JobAlertsList';
import BotStatus from './BotStatus';

interface JobAlert {
  id: string;
  country: string;
  location: string;
  job_title: string;
  job_type: 'Remote' | 'On-site' | 'Hybrid';
  alert_frequency: string;
  preferred_time: string;
  max_alerts_per_day: number;
  timezone: string;
  created_at: string;
  updated_at: string;
}

interface JobAlertsSectionProps {
  userTimezone: string;
}

const JobAlertsSection = ({ userTimezone }: { userTimezone: string }) => {
  const { user } = useUser();
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<JobAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAlert, setEditingAlert] = useState<JobAlert | null>(null);
  const [isActivated, setIsActivated] = useState<boolean>(false);
  const [userProfileId, setUserProfileId] = useState<string | null>(null);

  useEffect(() => {
    fetchUserProfileAndAlerts();
  }, [user]);

  const fetchUserProfileAndAlerts = async () => {
    if (!user) return;

    try {
      // First, get the user's database ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', user.id)
        .single();

      if (userError) {
        console.error('Error fetching user:', userError);
        setLoading(false);
        return;
      }

      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profile')
        .select('id')
        .eq('user_id', userData.id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        setLoading(false);
        return;
      }

      setUserProfileId(profileData.id);

      // Fetch job alerts using user_profile.id
      const { data, error } = await supabase
        .from('job_alerts')
        .select('*')
        .eq('user_id', profileData.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching job alerts:', error);
      } else {
        setAlerts(data || []);
      }
    } catch (error) {
      console.error('Error fetching user profile and alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAlert = () => {
    if (!isActivated) {
      toast({
        title: "Bot not activated",
        description: "Please activate your bot first to create job alerts.",
        variant: "destructive",
      });
      return;
    }
    setEditingAlert(null);
    setShowForm(true);
  };

  const handleEditAlert = (alert: JobAlert) => {
    if (!isActivated) {
      toast({
        title: "Bot not activated",
        description: "Please activate your bot first to edit job alerts.",
        variant: "destructive",
      });
      return;
    }
    setEditingAlert(alert);
    setShowForm(true);
  };

  const handleDeleteAlert = async (alertId: string) => {
    if (!isActivated) {
      toast({
        title: "Bot not activated",
        description: "Please activate your bot first to delete job alerts.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('job_alerts')
        .delete()
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(alerts.filter(alert => alert.id !== alertId));
      
      toast({
        title: "Alert deleted",
        description: "Job alert has been removed successfully.",
      });
    } catch (error) {
      console.error('Error deleting job alert:', error);
      toast({
        title: "Delete failed",
        description: "There was an error deleting the job alert.",
        variant: "destructive",
      });
    }
  };

  const handleFormSubmit = () => {
    setShowForm(false);
    setEditingAlert(null);
    fetchUserProfileAndAlerts();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingAlert(null);
  };

  const handleActivationChange = (activated: boolean) => {
    setIsActivated(activated);
  };

  if (loading) {
    // Loading indicator: adjusted for new dark theme
    return (
      <div className="max-w-2xl mx-auto w-full">
        <div className="rounded-3xl bg-black/95 border-2 border-emerald-400 shadow-none p-6 mt-3 min-h-[160px] flex items-center justify-center">
          <div className="text-emerald-100 text-xs">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-3xl bg-gradient-to-b from-black/90 via-[#16181e]/95 to-[#21223A]/98 border-2 border-emerald-400 shadow-none p-0">
      <div className="pt-4 px-2 sm:px-6">
        {/* Bot Status, Add Alert, List */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="min-w-0">
            <span className="text-2xl font-orbitron bg-gradient-to-r from-emerald-200 via-emerald-400 to-fuchsia-400 bg-clip-text text-transparent font-extrabold flex items-center gap-2">
              <span className="w-6 h-6 bg-emerald-400/70 rounded-full flex items-center justify-center shadow-lg ring-2 ring-emerald-400/40">
                <svg viewBox="0 0 24 24" width={18} height={18}><path fill="none" stroke="#fff" strokeWidth="2" d="M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20z"/></svg>
              </span>
              <span>Job Alerts</span>
            </span>
            <p className="text-emerald-100 font-inter text-sm font-semibold drop-shadow-none">
              Set up personalized job alerts based on your preferences
            </p>
          </div>
        </div>
        <div>
          {/* Bot Status Component */}
          <BotStatus onActivationChange={handleActivationChange} />

          {/* Job Alerts Form and List - Only show when activated */}
          {isActivated && (
            <>
              {showForm && (
                <div className="mb-6">
                  <JobAlertForm
                    userTimezone={userTimezone}
                    editingAlert={editingAlert}
                    onSubmit={handleFormSubmit}
                    onCancel={handleFormCancel}
                  />
                </div>
              )}
              <JobAlertsList
                alerts={alerts}
                onEdit={handleEditAlert}
                onDelete={handleDeleteAlert}
              />
            </>
          )}

          {/* Message when bot is not activated */}
          {!isActivated && (
            <div className="text-center py-6">
              <Bell className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-300 font-inter text-base mb-1">Activate your bot to manage job alerts</p>
              <p className="text-gray-400 font-inter text-sm">Follow the instructions above to get started</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default JobAlertsSection;
