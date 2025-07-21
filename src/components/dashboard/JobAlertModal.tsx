import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { X } from 'lucide-react';
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
      <DialogContent className="max-w-2xl w-[calc(100vw-32px)] sm:w-[95vw] max-h-[85vh] flex flex-col bg-gradient-to-br from-orange-900/95 via-[#3c1c01]/90 to-[#2b1605]/95 border-2 border-orange-500/70 rounded-2xl mx-4 sm:mx-auto p-0">
        {/* Fixed Header */}
        <DialogHeader className="flex-shrink-0 p-4 sm:p-6 pb-2 sm:pb-4 relative">
          <DialogTitle className="text-lg sm:text-xl font-orbitron font-bold bg-gradient-to-r from-orange-300 via-yellow-300 to-pink-400 bg-clip-text text-transparent pr-8">
            {editingAlert ? 'Edit Job Alert' : 'Create New Job Alert'}
          </DialogTitle>
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4 text-white" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6">
          <JobAlertForm
            userTimezone={userTimezone}
            editingAlert={editingAlert}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            currentAlertCount={currentAlertCount}
            maxAlerts={maxAlerts}
            updateActivity={updateActivity}
          />
        </div>
        
        {/* Bottom padding for mobile */}
        <div className="flex-shrink-0 h-4 sm:h-6"></div>
      </DialogContent>
    </Dialog>
  );
};

export default JobAlertModal;