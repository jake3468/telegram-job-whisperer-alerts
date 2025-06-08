import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Bell, Plus } from 'lucide-react';
import JobAlertForm from './JobAlertForm';
import JobAlertsList from './JobAlertsList';

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

  useEffect(() => {
    fetchJobAlerts();
  }, [user]);

  const fetchJobAlerts = async () => {
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

      const { data, error } = await supabase
        .from('job_alerts')
        .select('*')
        .eq('user_id', userData.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching job alerts:', error);
      } else {
        setAlerts(data || []);
      }
    } catch (error) {
      console.error('Error fetching job alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAlert = () => {
    setEditingAlert(null);
    setShowForm(true);
  };

  const handleEditAlert = (alert: JobAlert) => {
    setEditingAlert(alert);
    setShowForm(true);
  };

  const handleDeleteAlert = async (alertId: string) => {
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
    fetchJobAlerts();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingAlert(null);
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
          {!showForm && (
            <Button onClick={handleCreateAlert} className="font-inter bg-white text-orange-600 hover:bg-gray-100 font-medium text-xs px-3 py-1 h-8 flex-shrink-0">
              <Plus className="w-3 h-3 mr-1" />
              Add Alert
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
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
      </CardContent>
    </Card>
  );
};

export default JobAlertsSection;
