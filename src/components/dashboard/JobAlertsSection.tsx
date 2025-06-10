
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

const JobAlertsSection = ({ userTimezone }: JobAlertsSectionProps) => {
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
    return (
      <Card className="bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 border-2 border-orange-400 shadow-2xl shadow-orange-500/20">
        <CardContent className="p-4">
          <div className="text-white text-xs">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 border-2 border-orange-400 shadow-2xl shadow-orange-500/20">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-white font-inter flex items-center gap-2 text-base">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                <Bell className="w-3 h-3 text-white" />
              </div>
              Job Alerts
            </CardTitle>
            <CardDescription className="text-orange-100 font-inter text-sm">
              Set up personalized job alerts based on your preferences
            </CardDescription>
          </div>
          {!showForm && isActivated && (
            <Button onClick={handleCreateAlert} className="font-inter bg-white text-orange-600 hover:bg-gray-100 font-medium text-xs px-3 py-1 h-8 flex-shrink-0">
              <Plus className="w-3 h-3 mr-1" />
              Add Alert
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
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
            <Bell className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-300 font-inter text-base mb-1">Activate your bot to manage job alerts</p>
            <p className="text-gray-400 font-inter text-sm">Follow the instructions above to get started</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default JobAlertsSection;
