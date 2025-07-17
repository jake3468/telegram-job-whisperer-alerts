import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Bell, Plus, AlertCircle, RefreshCw } from 'lucide-react';
import JobAlertForm from './JobAlertForm';
import JobAlertsList from './JobAlertsList';
import BotStatus from './BotStatus';
import { useCachedJobAlertsData } from '@/hooks/useCachedJobAlertsData';
interface JobAlert {
  id: string;
  country: string;
  country_name?: string;
  location: string;
  job_title: string;
  job_type: 'full-time' | 'part-time' | 'contract' | 'intern';
  alert_frequency: string;
  preferred_time: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}
interface JobAlertsSectionProps {
  userTimezone: string;
}
const JobAlertsSection = ({
  userTimezone
}: {
  userTimezone: string;
}) => {
  const { toast } = useToast();
  const { 
    alerts, 
    isActivated, 
    userProfileId, 
    loading, 
    error, 
    isAuthReady,
    invalidateCache,
    forceRefresh,
    deleteJobAlert,
    executeWithRetry
  } = useCachedJobAlertsData();
  
  const [showForm, setShowForm] = useState(false);
  const [editingAlert, setEditingAlert] = useState<JobAlert | null>(null);
  
  const MAX_ALERTS = 3;
  const alertsUsed = alerts.length;
  const alertsRemaining = MAX_ALERTS - alertsUsed;
  const isAtLimit = alertsUsed >= MAX_ALERTS;
  const handleCreateAlert = () => {
    if (!isActivated) {
      toast({
        title: "Bot not activated",
        description: "Please activate your bot first to create job alerts.",
        variant: "destructive"
      });
      return;
    }
    if (isAtLimit) {
      toast({
        title: "Alert limit reached",
        description: `You can only create up to ${MAX_ALERTS} job alerts. Please delete an existing alert to create a new one.`,
        variant: "destructive"
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
        variant: "destructive"
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
        variant: "destructive"
      });
      return;
    }

    if (!isAuthReady) {
      toast({
        title: "Please wait",
        description: "Authentication is loading, please try again in a moment.",
        variant: "destructive"
      });
      return;
    }

    try {
      await deleteJobAlert(alertId);
      
      // Invalidate cache to refresh data
      invalidateCache();
      
      toast({
        title: "Alert deleted",
        description: "Job alert has been removed successfully."
      });
    } catch (error) {
      console.error('Error deleting job alert:', error);
      toast({
        title: "Delete failed",
        description: "There was an error deleting the job alert.",
        variant: "destructive"
      });
    }
  };
  const handleFormSubmit = () => {
    setShowForm(false);
    setEditingAlert(null);
    // Invalidate cache to refresh data
    invalidateCache();
  };
  
  const handleFormCancel = () => {
    setShowForm(false);
    setEditingAlert(null);
  };

  // Manual refresh function - uses proper data refetch instead of page reload
  const handleManualRefresh = useCallback(() => {
    forceRefresh();
  }, [forceRefresh]);
  // Show fast initial loading state, then content even if auth is still loading
  if (loading && !userProfileId) {
    return <div className="max-w-2xl mx-auto w-full">
        <div className="rounded-3xl bg-black/95 border-2 border-emerald-400 shadow-none p-6 mt-3 min-h-[160px] flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-400 mx-auto"></div>
            <div className="text-emerald-100 text-xs">Loading job alerts...</div>
          </div>
        </div>
      </div>;
  }
  return <section className="rounded-3xl border-2 border-orange-400 bg-gradient-to-b from-orange-900/90 via-[#2b1605]/90 to-[#2b1605]/98 shadow-none p-0 max-w-5xl mx-auto">
      <div className="pt-4 px-2 sm:px-6">
        {/* Manual Refresh Button */}
        {error && (
          <div className="mb-4 flex justify-end">
            <Button
              onClick={handleManualRefresh}
              variant="outline"
              size="sm"
              className="text-xs bg-yellow-900/20 border-yellow-400/30 text-yellow-300 hover:bg-yellow-800/30"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Refresh
            </Button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl font-orbitron bg-gradient-to-r from-orange-300 via-yellow-300 to-pink-400 bg-clip-text text-transparent font-extrabold flex items-center gap-2 drop-shadow">
                <span className="w-6 h-6 bg-orange-400/70 rounded-full flex items-center justify-center shadow-lg ring-2 ring-orange-300/40">
                  <svg viewBox="0 0 24 24" width={18} height={18}>
                    <path fill="none" stroke="#fff" strokeWidth="2" d="M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20z" />
                  </svg>
                </span>
                <span>Job Alerts</span>
              </span>
              
            </div>
            <p className="text-orange-100 font-inter text-sm font-semibold drop-shadow-none">Set up personalized daily job alerts based on your preferences</p>
            
            {/* Alert Usage Counter */}
            {isActivated && <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1 text-xs">
                  <span className={`font-medium ${isAtLimit ? 'text-red-300' : 'text-orange-200'}`}>
                    {alertsUsed}/{MAX_ALERTS} alerts used
                  </span>
                  {isAtLimit && <AlertCircle className="w-3 h-3 text-red-300" />}
                </div>
                {alertsRemaining > 0 && <span className="text-xs text-green-300">
                    ({alertsRemaining} remaining)
                  </span>}
              </div>}
          </div>

          {isActivated && !showForm && <div className="flex items-center mt-2 sm:mt-0">
              <Button onClick={handleCreateAlert} disabled={isAtLimit} className={`font-bold px-4 py-2 rounded-lg shadow-sm transition text-orange-950 ${isAtLimit ? 'bg-gray-400 cursor-not-allowed opacity-50' : 'bg-gradient-to-tr from-orange-200 via-yellow-100 to-orange-300 hover:bg-orange-100 hover:from-yellow-200'}`}>
                <Plus className="w-4 h-4 mr-2" /> 
                {isAtLimit ? 'Limit Reached' : 'Add Alert'}
              </Button>
            </div>}
        </div>

        <div>
          {/* Bot Status Component */}
          <BotStatus onActivationChange={() => {}} />

          {/* Job Alerts Form and List - Only show when activated */}
          {isActivated && <>
              {showForm && <div className="mb-6 rounded-2xl bg-gradient-to-br from-orange-900/95 via-[#3c1c01]/90 to-[#2b1605]/95 border border-orange-500/70 shadow-lg p-2 sm:p-4">
                  <JobAlertForm userTimezone={userTimezone} editingAlert={editingAlert} onSubmit={handleFormSubmit} onCancel={handleFormCancel} currentAlertCount={alertsUsed} maxAlerts={MAX_ALERTS} />
                </div>}
              <div className="flex flex-col gap-4 pb-6 sm:pb-8">
                <JobAlertsList alerts={alerts} onEdit={handleEditAlert} onDelete={handleDeleteAlert} />
              </div>
            </>}

          {!isActivated && <div className="text-center py-6">
              <Bell className="w-10 h-10 text-orange-400 mx-auto mb-3" />
              <p className="text-orange-100 font-inter text-base mb-1">Activate your bot to manage job alerts</p>
              <p className="text-orange-200 font-inter text-sm">Follow the instructions above to get started</p>
            </div>}
        </div>
      </div>
      <div className="h-2 sm:h-4" />
    </section>;
};
export default JobAlertsSection;