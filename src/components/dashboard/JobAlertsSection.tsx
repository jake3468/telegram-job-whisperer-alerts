import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Bell, Plus, AlertCircle, RefreshCw } from 'lucide-react';
import JobAlertModal from './JobAlertModal';
import JobAlertsList from './JobAlertsList';
import EnhancedBotStatus from './EnhancedBotStatus';
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
  sessionManager?: any; // Enterprise session manager
}
const JobAlertsSection = ({
  userTimezone,
  sessionManager
}: JobAlertsSectionProps) => {
  const {
    toast
  } = useToast();
  const {
    alerts,
    isActivated,
    userProfileId,
    loading,
    error,
    debugInfo,
    optimisticAdd,
    invalidateCache,
    forceRefresh,
    deleteJobAlert
  } = useCachedJobAlertsData();
  const [showModal, setShowModal] = useState(false);
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
    setShowModal(true);
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
    setShowModal(true);
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
    try {
      // deleteJobAlert now handles optimistic updates internally
      await deleteJobAlert(alertId);
      toast({
        title: "Alert deleted",
        description: "Job alert has been removed successfully."
      });
    } catch (error) {
      console.error('Error deleting job alert:', error);

      // Enhanced error handling with context
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      if (errorMessage.includes('Authentication') || errorMessage.includes('expired')) {
        toast({
          title: "Session expired",
          description: "Please refresh the page to continue.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Delete failed",
          description: "There was an error deleting the job alert. Please try again.",
          variant: "destructive"
        });
      }
    }
  };
  const handleModalSubmit = (newAlert?: JobAlert) => {
    setEditingAlert(null);

    // If a new alert was created, add it optimistically for immediate UI feedback
    if (newAlert && !editingAlert) {
      optimisticAdd(newAlert);
      toast({
        title: "Alert created",
        description: "Your job alert has been created successfully and will be processed shortly."
      });
    } else {
      // For edits, just invalidate cache to refresh data
      invalidateCache();
    }
  };
  const handleModalClose = () => {
    setShowModal(false);
    setEditingAlert(null);
  };

  // Manual refresh function - reloads entire page to reset all state and tokens
  const handleManualRefresh = useCallback(() => {
    window.location.reload();
  }, []);

  // Show fast initial loading state, then content even if auth is still loading
  if (loading && !userProfileId) {
    return <div className="max-w-5xl mx-auto w-full mb-8">
        <div className="rounded-3xl bg-orange-900/90 border-2 border-orange-400 shadow-none p-6 space-y-4">
          <div className="h-8 bg-orange-200/40 rounded-lg animate-pulse"></div>
          <div className="h-4 bg-orange-100/30 rounded animate-pulse w-3/4"></div>
          <div className="space-y-3 pt-4">
            <div className="h-24 bg-orange-200/40 rounded-xl animate-pulse"></div>
            <div className="h-24 bg-orange-200/40 rounded-xl animate-pulse"></div>
          </div>
        </div>
      </div>;
  }
  return <section className="rounded-3xl border-2 border-orange-400 bg-orange-900/90 shadow-none p-0 max-w-5xl mx-auto mb-8">
      <div className="pt-4 px-2 sm:px-6">
        {/* Manual Refresh Button */}
        {error && <div className="mb-4 flex justify-end">
            <Button onClick={handleManualRefresh} variant="outline" size="sm" className="text-xs bg-yellow-900/20 border-yellow-400/30 text-yellow-300 hover:bg-yellow-800/30">
              <RefreshCw className="w-3 h-3 mr-1" />
              Refresh
            </Button>
          </div>}

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
            <p className="text-orange-100 font-inter text-sm drop-shadow-none font-extralight">Set up personalized daily job alerts based on your preferences - just one job title and location per alert to ensure we send you the most accurate matches.</p>
            
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

          {isActivated && <div className="flex items-center mt-2 sm:mt-0">
              <Button onClick={handleCreateAlert} disabled={isAtLimit} className={`font-bold px-4 py-2 rounded-lg shadow-sm transition text-orange-950 ${isAtLimit ? 'bg-gray-400 cursor-not-allowed opacity-50' : 'bg-gradient-to-tr from-orange-200 via-yellow-100 to-orange-300 hover:bg-orange-100 hover:from-yellow-200'}`}>
                <Plus className="w-4 h-4 mr-2" /> 
                {isAtLimit ? 'Limit Reached' : 'Add Alert'}
              </Button>
            </div>}
        </div>

        <div>
          {/* Enhanced Bot Status Component */}
          <EnhancedBotStatus onActivationChange={() => {}} />

          {/* Job Alerts List - Only show when activated */}
          {isActivated && <div className="flex flex-col gap-4 pb-6 sm:pb-8">
              <JobAlertsList alerts={alerts} onEdit={handleEditAlert} onDelete={handleDeleteAlert} />
            </div>}

          {/* Job Alert Modal */}
          <JobAlertModal isOpen={showModal} onClose={handleModalClose} userTimezone={userTimezone} editingAlert={editingAlert} onSubmit={handleModalSubmit} currentAlertCount={alertsUsed} maxAlerts={MAX_ALERTS} sessionManager={sessionManager} />

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