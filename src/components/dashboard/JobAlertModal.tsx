import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import JobAlertForm from './JobAlertForm';

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

interface JobAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  userTimezone: string;
  editingAlert: JobAlert | null;
  onSubmit: () => void;
  currentAlertCount: number;
  maxAlerts: number;
  updateActivity?: () => void;
}

const JobAlertModal = ({
  isOpen,
  onClose,
  userTimezone,
  editingAlert,
  onSubmit,
  currentAlertCount,
  maxAlerts,
  updateActivity
}: JobAlertModalProps) => {
  const handleFormSubmit = () => {
    onSubmit();
    onClose();
  };

  const handleFormCancel = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-orange-900/95 via-[#3c1c01]/90 to-[#2b1605]/95 border-2 border-orange-500/70 rounded-2xl mx-4 p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-orbitron font-bold bg-gradient-to-r from-orange-300 via-yellow-300 to-pink-400 bg-clip-text text-transparent">
            {editingAlert ? 'Edit Job Alert' : 'Create New Job Alert'}
          </DialogTitle>
        </DialogHeader>
        
        <JobAlertForm
          userTimezone={userTimezone}
          editingAlert={editingAlert}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          currentAlertCount={currentAlertCount}
          maxAlerts={maxAlerts}
          updateActivity={updateActivity}
        />
      </DialogContent>
    </Dialog>
  );
};

export default JobAlertModal;