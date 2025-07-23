
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
}

const JobAlertModal = ({
  isOpen,
  onClose,
  userTimezone,
  editingAlert,
  onSubmit,
  currentAlertCount,
  maxAlerts
}: JobAlertModalProps) => {
  const handleFormSubmit = () => {
    onSubmit();
    onClose();
  };

  const handleFormCancel = () => {
    onClose();
  };

  const handleModalClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleModalClose}>
      <DialogContent className="left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[calc(100vw-32px)] max-w-[calc(100vw-32px)] sm:max-w-2xl max-h-[90vh] flex flex-col bg-gradient-to-br from-orange-900/95 via-[#3c1c01]/90 to-[#2b1605]/95 border-2 border-orange-500/70 rounded-2xl p-0">
        {/* Fixed Header */}
        <DialogHeader className="flex-shrink-0 p-3 sm:p-4 pb-2 relative">
          <DialogTitle className="text-xl sm:text-2xl md:text-3xl font-orbitron font-bold bg-gradient-to-r from-orange-300 via-yellow-300 to-pink-400 bg-clip-text text-transparent pr-8 tracking-wide drop-shadow-lg">
            {editingAlert ? 'Edit Job Alert' : 'Create New Job Alert'}
          </DialogTitle>
          <DialogClose 
            onClick={handleModalClose}
            className="absolute right-3 top-3 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
          >
            <X className="h-4 w-4 text-white" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-4">
          <JobAlertForm
            userTimezone={userTimezone}
            editingAlert={editingAlert}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            currentAlertCount={currentAlertCount}
            maxAlerts={maxAlerts}
          />
        </div>
        
        {/* Bottom padding for mobile */}
        <div className="flex-shrink-0 h-3 sm:h-4"></div>
      </DialogContent>
    </Dialog>
  );
};

export default JobAlertModal;
