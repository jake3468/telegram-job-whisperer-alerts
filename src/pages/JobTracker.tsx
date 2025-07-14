import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserInitialization } from '@/hooks/useUserInitialization';
import { useCachedJobTracker } from '@/hooks/useCachedJobTracker';
import { useUserProfile } from '@/hooks/useUserProfile';
import { JobTrackerOnboardingPopup } from '@/components/JobTrackerOnboardingPopup';
import { Plus, ExternalLink, Trash2, X, Bookmark, Send, Users, XCircle, Trophy, GripVertical, RefreshCw, AlertCircle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, TouchSensor, MouseSensor, useSensor, useSensors, closestCenter, useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface JobEntry {
  id: string;
  company_name: string;
  job_title: string;
  job_description?: string;
  job_url?: string;
  status: 'saved' | 'applied' | 'interview' | 'rejected' | 'offer';
  order_position: number;
  resume_updated: boolean;
  job_role_analyzed: boolean;
  company_researched: boolean;
  cover_letter_prepared: boolean;
  ready_to_apply: boolean;
  interview_call_received: boolean;
  interview_prep_guide_received: boolean;
  ai_mock_interview_attempted: boolean;
  created_at: string;
  updated_at: string;
}

interface EditJobFormData {
  company_name: string;
  job_title: string;
  job_description: string;
  job_url: string;
}

// Droppable Column Component
const DroppableColumn = ({
  column,
  jobs,
  onAddJob,
  onDeleteJob,
  onViewJob,
  onUpdateChecklist,
  activeJobId
}: {
  column: any;
  jobs: JobEntry[];
  onAddJob: () => void;
  onDeleteJob: (id: string) => void;
  onViewJob: (job: JobEntry) => void;
  onUpdateChecklist: (jobId: string, field: string) => void;
  activeJobId?: string;
}) => {
  const {
    isOver,
    setNodeRef
  } = useDroppable({
    id: column.key
  });
  const isDropTarget = isOver && activeJobId;
  return <div ref={setNodeRef} className={`${column.bgColor} ${column.borderColor} border-2 rounded-lg w-full md:flex-1 md:min-w-[280px] md:max-w-[320px] transition-all hover:shadow-lg ${isDropTarget ? 'ring-2 ring-blue-400 ring-opacity-50 bg-opacity-70' : ''}`}>
      <div className={`${column.headerBg} p-4 rounded-t-lg border-b ${column.borderColor} flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <column.icon className="h-4 w-4 text-white" />
          <h3 className={`font-orbitron font-bold text-sm ${column.textColor}`}>
            {column.title} ({jobs.length})
          </h3>
        </div>
        {column.canAdd && <div className="flex items-center gap-2">
            {column.key === 'saved' && <span className="text-xs text-white/80 font-medium">Start here →</span>}
            <Button size="sm" variant="ghost" className={`${column.textColor} hover:bg-black/10 h-8 w-8 p-0`} onClick={onAddJob}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>}
      </div>

      <div className={`p-2 min-h-[450px] ${isDropTarget ? 'bg-black/5' : ''} transition-colors`}>
        <SortableContext items={jobs.map(job => job.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-1">
            {jobs.map(job => <SortableJobCard key={job.id} job={job} onDelete={onDeleteJob} onView={onViewJob} onUpdateChecklist={onUpdateChecklist} />)}
          </div>
        </SortableContext>
      </div>
    </div>;
};

// Sortable Job Card Component with compact design
const SortableJobCard = ({
  job,
  onDelete,
  onView,
  onUpdateChecklist
}: {
  job: JobEntry;
  onDelete: (id: string) => void;
  onView: (job: JobEntry) => void;
  onUpdateChecklist: (jobId: string, field: string) => void;
}) => {
  const [isChecklistExpanded, setIsChecklistExpanded] = useState(false);
  const {
    toast
  } = useToast();
  
  // Calculate progress based on status and boolean fields
  const getProgress = () => {
    if (job.status === 'saved') {
      let completed = 0;
      if (job.resume_updated) completed++;
      if (job.job_role_analyzed) completed++;
      if (job.company_researched) completed++;
      if (job.cover_letter_prepared) completed++;
      if (job.ready_to_apply) completed++;
      return completed;
    } else if (job.status === 'applied') {
      return job.interview_call_received ? 1 : 0;
    } else if (job.status === 'interview') {
      let completed = 0;
      if (job.interview_prep_guide_received) completed++;
      if (job.ai_mock_interview_attempted) completed++;
      return completed;
    }
    return 0;
  };

  const progress = getProgress();
  
  // Check if dragging is allowed (checklist must be complete)
  const canDrag = job.status === 'saved' ? progress >= 5 : 
                  job.status === 'applied' ? progress >= 1 : 
                  job.status === 'interview' ? progress >= 2 : false;
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: job.id,
    disabled: !canDrag
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  // Get progress color based on completion and status
  const getProgressColor = (progress: number) => {
    if (progress === 0) return 'bg-red-500';
    if (job.status === 'saved') {
      if (progress >= 1 && progress <= 4) return 'bg-orange-500';
      if (progress === 5) return 'bg-green-500';
    } else if (job.status === 'applied') {
      if (progress === 1) return 'bg-green-500';
    } else if (job.status === 'interview') {
      if (progress === 1) return 'bg-orange-500';
      if (progress === 2) return 'bg-green-500';
    }
    return 'bg-orange-500';
  };

  // Checklist items based on job status
  const checklistItems = job.status === 'saved' ? [
    { field: 'cover_letter_prepared', label: '✍️ Did you prepare your cover letter?', completed: job.cover_letter_prepared },
    { field: 'resume_updated', label: '📄 Did you update your resume?', completed: job.resume_updated },
    { field: 'company_researched', label: '🏢 Did you research the company?', completed: job.company_researched },
    { field: 'job_role_analyzed', label: '🎯 Did you analyze the job role?', completed: job.job_role_analyzed },
    { field: 'ready_to_apply', label: '🚀 Are you ready to apply?', completed: job.ready_to_apply }
  ] : job.status === 'applied' ? [
    { field: 'interview_call_received', label: 'Interview call received', completed: job.interview_call_received }
  ] : job.status === 'interview' ? [
    { field: 'interview_prep_guide_received', label: 'Did you receive the interview prep guide?', completed: job.interview_prep_guide_received },
    { field: 'ai_mock_interview_attempted', label: 'Did you attempt the AI mock interview?', completed: job.ai_mock_interview_attempted }
  ] : [];

  const handleChecklistToggle = (field: string) => {
    onUpdateChecklist(job.id, field);
  };

  const handleDragAttempt = () => {
    if (!canDrag) {
      toast({
        title: "Complete checklist first",
        description: "Complete all checklist items to move this application.",
        variant: "destructive"
      });
    }
  };

  return <div ref={setNodeRef} style={style} className="bg-white rounded-lg border border-gray-200 shadow-md hover:shadow-lg transition-all duration-200 py-1.5 px-2 mb-1 hover:scale-[1.02]">
      {/* Top section: Progress + Company + Actions */}
      <div className="flex items-center justify-between gap-2">
        {/* Left: Progress badge in circle */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${getProgressColor(progress)}`}>
          {progress}/{job.status === 'saved' ? '5' : job.status === 'applied' ? '1' : job.status === 'interview' ? '2' : '0'}
        </div>
        
        {/* Center: Company & Job Title */}
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm text-black leading-tight truncate">
            {job.company_name}
          </div>
          <div className="text-xs text-gray-600 leading-tight truncate">
            {job.job_title}
          </div>
        </div>

        {/* Right: Dropdown + Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Show dropdown arrow for jobs with checklist items */}
          {(job.status === 'saved' || job.status === 'applied' || job.status === 'interview') && (
            <Button variant="ghost" size="sm" onClick={() => setIsChecklistExpanded(!isChecklistExpanded)} className="text-xs px-1 py-1 h-6 text-gray-600 hover:text-gray-800">
              {isChecklistExpanded ? '▲' : '▼'}
            </Button>
          )}
          
          <Button variant="outline" size="sm" onClick={() => onView(job)} className="text-xs px-2 py-1 h-6 bg-pastel-lavender">
            View
          </Button>
          
          {job.job_url && <a href={job.job_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 transition-colors p-1" title="Open job posting">
              <ExternalLink className="w-3 h-3" />
            </a>}

          {/* Drag Handle */}
          <div {...attributes} {...listeners} onClick={handleDragAttempt} className={`cursor-grab p-1 transition-colors ${canDrag ? "text-gray-600 hover:text-gray-800" : "text-gray-400 cursor-not-allowed"}`} title={canDrag ? "Drag to move" : "Complete checklist to move"}>
            <GripVertical className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* Expandable Checklist - for saved, applied, and interview jobs */}
      {isChecklistExpanded && (job.status === 'saved' || job.status === 'applied' || job.status === 'interview') && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="space-y-1.5">
            {checklistItems.map((item) => (
              <div key={item.field} className="flex items-center space-x-2">
                <Checkbox
                  checked={item.completed}
                  onCheckedChange={() => handleChecklistToggle(item.field)}
                  className={`h-4 w-4 ${item.completed ? 'data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500' : ''}`}
                />
                <span className={`text-xs leading-tight ${item.completed ? "text-gray-500 line-through" : "text-gray-700"}`}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>;
};

const JobTracker = () => {
  const {
    user,
    isLoaded
  } = useUser();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const {
    initializeUser
  } = useUserInitialization();
  const { userProfile, updateUserProfile } = useUserProfile();

  // Use cached hook for instant data display
  const {
    jobs,
    userProfileId,
    loading,
    error,
    connectionIssue,
    invalidateCache,
    optimisticUpdate,
    optimisticAdd,
    optimisticDelete,
    forceRefresh
  } = useCachedJobTracker();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobEntry | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'saved' | 'applied' | 'interview'>('saved');
  const [activeJob, setActiveJob] = useState<JobEntry | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [formData, setFormData] = useState<EditJobFormData>({
    company_name: '',
    job_title: '',
    job_description: '',
    job_url: ''
  });
  const [editFormData, setEditFormData] = useState<EditJobFormData>({
    company_name: '',
    job_title: '',
    job_description: '',
    job_url: ''
  });
  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8
    }
  }), useSensor(TouchSensor, {
    activationConstraint: {
      delay: 150,
      tolerance: 8
    }
  }), useSensor(MouseSensor, {
    activationConstraint: {
      distance: 8
    }
  }));
  const columns = [{
    key: 'saved',
    title: 'Saved',
    icon: Bookmark,
    canAdd: true,
    bgColor: 'bg-blue-50',
    textColor: 'text-white',
    borderColor: 'border-blue-200',
    headerBg: 'bg-blue-600'
  }, {
    key: 'applied',
    title: 'Applied',
    icon: Send,
    canAdd: true,
    bgColor: 'bg-green-50',
    textColor: 'text-white',
    borderColor: 'border-green-200',
    headerBg: 'bg-green-600'
  }, {
    key: 'interview',
    title: 'Interview',
    icon: Users,
    canAdd: true,
    bgColor: 'bg-yellow-50',
    textColor: 'text-white',
    borderColor: 'border-yellow-200',
    headerBg: 'bg-yellow-600'
  }, {
    key: 'rejected',
    title: 'Rejected',
    icon: XCircle,
    canAdd: false,
    bgColor: 'bg-red-50',
    textColor: 'text-white',
    borderColor: 'border-red-200',
    headerBg: 'bg-red-600'
  }, {
    key: 'offer',
    title: 'Offer',
    icon: Trophy,
    canAdd: false,
    bgColor: 'bg-purple-50',
    textColor: 'text-white',
    borderColor: 'border-purple-300',
    headerBg: 'bg-gradient-to-r from-purple-600 via-violet-600 to-purple-700'
  }];

  // Initialize user when component mounts
  useEffect(() => {
    if (user) {
      initializeUser();
    }
  }, [user, initializeUser]);
  useEffect(() => {
    if (isLoaded && !user) {
      navigate('/');
    }
  }, [user, isLoaded, navigate]);

  // Handle onboarding popup
  useEffect(() => {
    if (userProfile && userProfile.show_job_tracker_onboarding_popup) {
      setShowOnboarding(true);
    }
  }, [userProfile]);

  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
  };

  const handleDontShowOnboardingAgain = async () => {
    setShowOnboarding(false);
    if (userProfile) {
      await updateUserProfile({ show_job_tracker_onboarding_popup: false });
    }
  };

  // Manual refresh function - instant refresh for better UX
  const handleManualRefresh = useCallback(() => {
    try {
      // For inactive state or offline scenarios, immediately force page refresh
      if (connectionIssue || error) {
        window.location.reload();
        return;
      }

      // Otherwise try force refresh and immediately fall back if needed
      forceRefresh();

      // Short timeout for fallback
      setTimeout(() => {
        if (connectionIssue || error) {
          window.location.reload();
        }
      }, 1000);
    } catch (err) {
      console.error('Manual refresh failed:', err);
      // Force page refresh if all else fails
      window.location.reload();
    }
  }, [forceRefresh, connectionIssue, error]);

  const handleAddJob = async () => {
    if (!formData.company_name || !formData.job_title) {
      toast({
        title: "Error",
        description: "Company name and job title are required.",
        variant: "destructive"
      });
      return;
    }
    if (!userProfileId) {
      toast({
        title: "Error",
        description: "User profile not loaded. Please refresh and try again.",
        variant: "destructive"
      });
      return;
    }
    try {
      const maxOrder = Math.max(...jobs.filter(job => job.status === selectedStatus).map(job => job.order_position), -1);

      // Create optimistic update first
      const tempJob: JobEntry = {
        id: `temp-${Date.now()}`,
        company_name: formData.company_name,
        job_title: formData.job_title,
        job_description: formData.job_description || undefined,
        job_url: formData.job_url || undefined,
        status: selectedStatus,
        order_position: maxOrder + 1,
        resume_updated: false,
        job_role_analyzed: false,
        company_researched: false,
        cover_letter_prepared: false,
        ready_to_apply: false,
        interview_call_received: false,
        interview_prep_guide_received: false,
        ai_mock_interview_attempted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      optimisticAdd(tempJob);

      const {
        data,
        error
      } = await supabase.from('job_tracker').insert({
        user_id: userProfileId,
        company_name: formData.company_name,
        job_title: formData.job_title,
        job_description: formData.job_description || null,
        job_url: formData.job_url || null,
        status: selectedStatus,
        order_position: maxOrder + 1
      }).select().single();
      if (error) throw error;

      // Replace temp job with real job
      if (data) {
        optimisticUpdate(data);
      }

      // Invalidate cache for fresh data on next load
      invalidateCache();
      toast({
        title: "Success",
        description: "Job added successfully!"
      });
      setFormData({
        company_name: '',
        job_title: '',
        job_description: '',
        job_url: ''
      });
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error adding job:', error);
      // Remove the optimistic update on error
      optimisticDelete(`temp-${Date.now()}`);
      toast({
        title: "Error",
        description: "Failed to add job.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateJob = async () => {
    if (!selectedJob) return;
    if (!editFormData.company_name || !editFormData.job_title) {
      toast({
        title: "Error",
        description: "Company name and job title are required.",
        variant: "destructive"
      });
      return;
    }
    try {
      const {
        error
      } = await supabase.from('job_tracker').update({
        company_name: editFormData.company_name,
        job_title: editFormData.job_title,
        job_description: editFormData.job_description || null,
        job_url: editFormData.job_url || null
      }).eq('id', selectedJob.id);
      if (error) throw error;
      toast({
        title: "Success",
        description: "Job updated successfully!"
      });
      setIsViewModalOpen(false);
      setSelectedJob(null);
      invalidateCache();
    } catch (error) {
      console.error('Error updating job:', error);
      toast({
        title: "Error",
        description: "Failed to update job.",
        variant: "destructive"
      });
    }
  };

  const deleteJob = async (jobId: string) => {
    // Optimistic delete first
    optimisticDelete(jobId);
    try {
      const {
        error
      } = await supabase.from('job_tracker').delete().eq('id', jobId);
      if (error) throw error;

      // Invalidate cache for fresh data on next load
      invalidateCache();
      toast({
        title: "Success",
        description: "Job deleted successfully!"
      });
    } catch (error) {
      console.error('Error deleting job:', error);
      // Revert optimistic delete on error - re-fetch data
      invalidateCache();
      toast({
        title: "Error",
        description: "Failed to delete job.",
        variant: "destructive"
      });
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const {
      active
    } = event;
    const job = jobs.find(j => j.id === active.id);
    setActiveJob(job || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const {
      active,
      over
    } = event;
    setActiveJob(null);
    if (!over) return;
    const activeJobToMove = jobs.find(j => j.id === active.id);
    if (!activeJobToMove) return;

    // Calculate progress for different job statuses
    const getProgress = (job: JobEntry) => {
      if (job.status === 'saved') {
        let completed = 0;
        if (job.resume_updated) completed++;
        if (job.job_role_analyzed) completed++;
        if (job.company_researched) completed++;
        if (job.cover_letter_prepared) completed++;
        if (job.ready_to_apply) completed++;
        return completed;
      } else if (job.status === 'applied') {
        return job.interview_call_received ? 1 : 0;
      } else if (job.status === 'interview') {
        let completed = 0;
        if (job.interview_prep_guide_received) completed++;
        if (job.ai_mock_interview_attempted) completed++;
        return completed;
      }
      return 0;
    };

    // Check if checklist is complete before allowing drag
    const progress = getProgress(activeJobToMove);
    let requiredProgress = 0;
    
    if (activeJobToMove.status === 'saved') {
      requiredProgress = 5;
    } else if (activeJobToMove.status === 'applied') {
      requiredProgress = 1;
    } else if (activeJobToMove.status === 'interview') {
      requiredProgress = 2;
    }

    if (progress < requiredProgress) {
      toast({
        title: "Complete checklist first",
        description: `You must complete all checklist items (${progress}/${requiredProgress}) before moving this job.`,
        variant: "destructive"
      });
      return;
    }

    // Check if dropped on a column (over.id will be the column key)
    const targetColumn = columns.find(col => col.key === over.id);
    if (targetColumn && activeJobToMove.status !== targetColumn.key) {
      // Optimistic update - update UI immediately
      const targetJobs = jobs.filter(j => j.status === targetColumn.key);
      const maxOrder = Math.max(...targetJobs.map(j => j.order_position), -1);
      const updatedJob = {
        ...activeJobToMove,
        status: targetColumn.key as JobEntry['status'],
        order_position: maxOrder + 1
      };

      // Reset irrelevant checklist items based on target status
      if (targetColumn.key === 'saved') {
        // Keep saved items, reset others
        updatedJob.interview_call_received = false;
        updatedJob.interview_prep_guide_received = false;
        updatedJob.ai_mock_interview_attempted = false;
      } else if (targetColumn.key === 'applied') {
        // Reset interview items when moving to applied
        updatedJob.interview_prep_guide_received = false;
        updatedJob.ai_mock_interview_attempted = false;
      } else if (targetColumn.key === 'rejected' || targetColumn.key === 'offer') {
        // Reset all checklist items for final statuses
        updatedJob.interview_call_received = false;
        updatedJob.interview_prep_guide_received = false;
        updatedJob.ai_mock_interview_attempted = false;
      }

      // Update local state immediately for instant feedback
      optimisticUpdate(updatedJob);
      try {
        const {
          error
        } = await supabase.from('job_tracker').update({
          status: targetColumn.key as JobEntry['status'],
          order_position: maxOrder + 1,
          interview_call_received: updatedJob.interview_call_received,
          interview_prep_guide_received: updatedJob.interview_prep_guide_received,
          ai_mock_interview_attempted: updatedJob.ai_mock_interview_attempted
        }).eq('id', activeJobToMove.id);
        if (error) throw error;

        // Invalidate cache for fresh data on next load
        invalidateCache();
        toast({
          title: "Success",
          description: `Job moved to ${targetColumn.title}!`
        });
      } catch (error) {
        console.error('Error moving job:', error);
        // Revert optimistic update on error
        optimisticUpdate(activeJobToMove);
        toast({
          title: "Error",
          description: "Failed to move job.",
          variant: "destructive"
        });
      }
    }
  };

  const getJobsByStatus = (status: string) => {
    return jobs.filter(job => job.status === status);
  };

  const handleViewJob = (job: JobEntry) => {
    setSelectedJob(job);
    setEditFormData({
      company_name: job.company_name,
      job_title: job.job_title,
      job_description: job.job_description || '',
      job_url: job.job_url || ''
    });
    setIsViewModalOpen(true);
  };

  // Function to handle checklist updates for cards
  const handleUpdateChecklistItem = async (jobId: string, field: string) => {
    const targetJob = jobs.find(job => job.id === jobId);
    if (!targetJob || (targetJob.status !== 'saved' && targetJob.status !== 'applied' && targetJob.status !== 'interview')) return;

    try {
      // Update in database
      const currentValue = targetJob[field as keyof JobEntry] as boolean;
      const {
        error
      } = await supabase.from('job_tracker').update({
        [field]: !currentValue
      }).eq('id', jobId);
      if (error) throw error;

      // Update local state
      const updatedJob = {
        ...targetJob,
        [field]: !currentValue
      };
      optimisticUpdate(updatedJob);
      
      // Also update selectedJob if it's the same job
      if (selectedJob && selectedJob.id === jobId) {
        setSelectedJob(updatedJob);
      }
      
      toast({
        title: "Success",
        description: "Checklist updated successfully!"
      });
    } catch (error) {
      console.error('Error updating checklist:', error);
      toast({
        title: "Error",
        description: "Failed to update checklist.",
        variant: "destructive"
      });
    }
  };

  if (!isLoaded || !user) {
    return <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-fuchsia-950 flex items-center justify-center">
        <div className="text-white text-xs">Loading...</div>
      </div>;
  }
  if (loading) {
    return <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-white text-xs">Loading job tracker...</div>
        </div>
      </Layout>;
  }
  return <Layout>
      {/* Main container with scrollable content */}
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-black via-gray-950 to-fuchsia-950">
        
        {/* Header section - scrollable */}
        <header className="py-6 px-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              <span className="font-semibold text-3xl">📈</span>
              <h1 className="font-extrabold font-orbitron bg-gradient-to-r from-sky-400 via-fuchsia-400 to-pastel-lavender bg-clip-text text-transparent drop-shadow md:text-4xl text-center text-3xl">Job Tracker</h1>
              
              {/* Manual Refresh Button */}
              {connectionIssue && <Button onClick={handleManualRefresh} variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-gray-800/50 h-8 w-8 p-0" title="Refresh data">
                  <RefreshCw className="h-4 w-4" />
                </Button>}
            </div>

            {/* Error Display */}
            {error && <div className="bg-red-900/50 border border-red-600 rounded-lg p-3 mb-4 mx-auto max-w-2xl">
                <div className="flex items-center gap-2 text-red-200">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                  <Button onClick={handleManualRefresh} variant="ghost" size="sm" className="ml-auto text-red-200 hover:text-white hover:bg-red-800/50">
                    Retry
                  </Button>
                </div>
              </div>}

            <p className="text-gray-100 font-inter max-w-4xl mx-auto leading-relaxed mb-3 font-extralight text-base">
              Drag the grip handle (⋮⋮) to move job applications between columns. Use the View button to see details or add new jobs using the + button.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-gray-300 font-medium">
              <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">Saved</span>
              <span className="hidden sm:inline">→</span>
              <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">Applied</span>
              <span className="hidden sm:inline">→</span>
              <span className="bg-yellow-600 text-white px-2 py-1 rounded text-xs">Interview</span>
              <span className="hidden sm:inline">→</span>
              <span className="bg-red-600 text-white px-2 py-1 rounded text-xs">Rejected</span>
              <span className="text-gray-400 hidden sm:inline">|</span>
              <span className="bg-gradient-to-r from-purple-600 via-violet-600 to-purple-700 text-white px-2 py-1 rounded text-xs font-bold">🎉 Offer</span>
            </div>
          </div>
        </header>

        {/* Main content area - responsive flexbox layout */}
        <main className="flex-1 p-4 overflow-x-auto">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            {/* Responsive flexbox: stacked on mobile, wrapped on larger screens */}
            <div className="flex flex-col md:flex-row md:flex-wrap gap-4 w-full">
              {columns.map(column => <DroppableColumn key={column.key} column={column} jobs={getJobsByStatus(column.key)} onAddJob={() => {
              setSelectedStatus(column.key as 'saved' | 'applied' | 'interview');
              setIsModalOpen(true);
            }} onDeleteJob={deleteJob} onViewJob={handleViewJob} onUpdateChecklist={handleUpdateChecklistItem} activeJobId={activeJob?.id} />)}
            </div>
            <DragOverlay>
              {activeJob ? <div className="bg-gray-800 rounded-lg p-4 border border-gray-600 shadow-2xl transform rotate-3 w-full max-w-[280px]">
                  <h4 className="font-bold text-white text-sm font-orbitron">{activeJob.company_name}</h4>
                  <p className="text-gray-300 text-xs">{activeJob.job_title}</p>
                </div> : null}
            </DragOverlay>
          </DndContext>
        </main>
      </div>

      {/* Add Job Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-white border border-gray-200 text-gray-900">
          <DialogHeader>
            <DialogTitle className="font-orbitron text-gray-900">Add New Job</DialogTitle>
            <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none text-gray-500 hover:text-gray-700">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="company" className="text-gray-700 font-orbitron text-sm">Company Name *</Label>
              <Input id="company" value={formData.company_name} onChange={e => setFormData(prev => ({
              ...prev,
              company_name: e.target.value
            }))} className="bg-white border-gray-300 text-gray-900" placeholder="Enter company name" />
            </div>
            <div>
              <Label htmlFor="title" className="text-gray-700 font-orbitron text-sm">Job Title *</Label>
              <Input id="title" value={formData.job_title} onChange={e => setFormData(prev => ({
              ...prev,
              job_title: e.target.value
            }))} className="bg-white border-gray-300 text-gray-900" placeholder="Enter job title" />
            </div>
            <div>
              <Label htmlFor="description" className="text-gray-700 font-orbitron text-sm">Job Description</Label>
              <Textarea id="description" value={formData.job_description} onChange={e => setFormData(prev => ({
              ...prev,
              job_description: e.target.value
            }))} className="bg-white border-gray-300 text-gray-900 min-h-[80px]" placeholder="Enter job description" />
            </div>
            <div>
              <Label htmlFor="url" className="text-gray-700 font-orbitron text-sm">Job URL</Label>
              <Input id="url" value={formData.job_url} onChange={e => setFormData(prev => ({
              ...prev,
              job_url: e.target.value
            }))} className="bg-white border-gray-300 text-gray-900" placeholder="https://..." />
            </div>
            <Button onClick={handleAddJob} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-orbitron">
              Add Job
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Job Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 text-gray-900 max-w-md w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg -m-6 mb-4 p-4">
            <DialogTitle className="font-orbitron text-white text-lg">Job Details</DialogTitle>
            <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 text-white hover:text-gray-200">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </DialogHeader>
          {selectedJob && <div className="space-y-4 p-1">
              {/* Checklist Section */}
              {(selectedJob.status === 'saved' || selectedJob.status === 'applied') && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-100 rounded-lg p-3 border border-green-200">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-green-800 font-orbitron text-sm font-bold">
                      {selectedJob.status === 'saved' ? 'Application Checklist' : 'Applied Status'}
                    </Label>
                    <div className={`text-xs font-bold px-2 py-1 rounded-full ${
                      selectedJob.status === 'saved' 
                        ? [selectedJob.resume_updated, selectedJob.job_role_analyzed, selectedJob.company_researched, selectedJob.cover_letter_prepared, selectedJob.ready_to_apply].filter(Boolean).length === 0
                          ? 'bg-red-500 text-white'
                          : [selectedJob.resume_updated, selectedJob.job_role_analyzed, selectedJob.company_researched, selectedJob.cover_letter_prepared, selectedJob.ready_to_apply].filter(Boolean).length === 5 
                            ? 'bg-green-500 text-white' 
                            : 'bg-orange-500 text-white'
                        : selectedJob.interview_call_received 
                          ? 'bg-green-500 text-white' 
                          : 'bg-red-500 text-white'
                    }`}>
                      {selectedJob.status === 'saved' 
                        ? `${[selectedJob.resume_updated, selectedJob.job_role_analyzed, selectedJob.company_researched, selectedJob.cover_letter_prepared, selectedJob.ready_to_apply].filter(Boolean).length}/5`
                        : `${selectedJob.interview_call_received ? 1 : 0}/1`
                      }
                    </div>
                  </div>
                  <div className="space-y-2">
                    {(selectedJob.status === 'saved' ? [
                      { field: 'cover_letter_prepared', label: '✍️ Did you prepare your cover letter?', completed: selectedJob.cover_letter_prepared, page: '/cover-letter' },
                      { field: 'resume_updated', label: '📄 Did you update your resume?', completed: selectedJob.resume_updated, page: '/job-analysis' },
                      { field: 'company_researched', label: '🏢 Did you research the company?', completed: selectedJob.company_researched, page: '/company-role-analysis' },
                      { field: 'job_role_analyzed', label: '🎯 Did you analyze the job role?', completed: selectedJob.job_role_analyzed, page: '/job-analysis' },
                      { field: 'ready_to_apply', label: '🚀 Are you ready to apply?', completed: selectedJob.ready_to_apply, page: null }
                    ] : selectedJob.status === 'applied' ? [
                      { field: 'interview_call_received', label: 'Interview call received', completed: selectedJob.interview_call_received, page: null }
                    ] : [
                      { field: 'interview_prep_guide_received', label: 'Interview prep guide received', completed: selectedJob.interview_prep_guide_received, page: '/interview-prep' },
                      { field: 'ai_mock_interview_attempted', label: 'AI mock interview attempted', completed: selectedJob.ai_mock_interview_attempted, page: '/grace-interview' }
                    ]).map((item) => (
                      <div key={item.field} className="flex items-center justify-between space-x-2">
                        <div className="flex items-center space-x-2 flex-1">
                          <Checkbox
                            checked={item.completed}
                            onCheckedChange={() => handleUpdateChecklistItem(selectedJob.id, item.field)}
                            className={`h-4 w-4 ${item.completed ? 'data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500' : ''}`}
                          />
                          <span className={`text-xs ${item.completed ? 'text-green-600 line-through' : 'text-green-800'}`}>
                            {item.label}
                          </span>
                        </div>
                        {item.page && !item.completed && (
                          <button
                            onClick={() => {
                              if (item.page === '/cover-letter') {
                                navigate(item.page, {
                                  state: {
                                    jobData: {
                                      company_name: selectedJob.company_name,
                                      job_title: selectedJob.job_title,
                                      job_description: selectedJob.job_description || ''
                                    }
                                  }
                                });
                              } else if (item.page === '/job-analysis') {
                                navigate(item.page, {
                                  state: {
                                    jobData: {
                                      company_name: selectedJob.company_name,
                                      job_title: selectedJob.job_title,
                                      job_description: selectedJob.job_description || ''
                                    }
                                  }
                                });
                              } else if (item.page === '/company-role-analysis') {
                                navigate(item.page, {
                                  state: {
                                    jobData: {
                                      company_name: selectedJob.company_name,
                                      job_title: selectedJob.job_title,
                                      location: 'USA' // Default location
                                    }
                                  }
                                });
                              } else if (item.page === '/interview-prep') {
                                navigate(item.page, {
                                  state: {
                                    jobData: {
                                      company_name: selectedJob.company_name,
                                      job_title: selectedJob.job_title,
                                      job_description: selectedJob.job_description || ''
                                    }
                                  }
                                });
                              } else if (item.page === '/grace-interview') {
                                navigate(item.page, {
                                  state: {
                                    jobData: {
                                      company_name: selectedJob.company_name,
                                      job_title: selectedJob.job_title,
                                      job_description: selectedJob.job_description || ''
                                    }
                                  }
                                });
                              } else {
                                navigate(item.page);
                              }
                            }}
                            className="text-blue-600 hover:text-blue-800 text-xs font-medium underline"
                          >
                            Get it now
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Job Details Section */}
              <div className="bg-gradient-to-r from-slate-50 to-gray-100 rounded-lg p-3 border border-gray-200">
                <h3 className="text-gray-800 font-orbitron text-sm font-bold mb-3">Job Details</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="edit-company" className="text-gray-700 text-xs font-medium">Company Name *</Label>
                    <Input id="edit-company" value={editFormData.company_name} onChange={e => setEditFormData(prev => ({
                  ...prev,
                  company_name: e.target.value
                }))} className="bg-white border-gray-300 text-gray-900 text-sm h-8" placeholder="Company name" />
                  </div>
                  <div>
                    <Label htmlFor="edit-title" className="text-gray-700 text-xs font-medium">Job Title *</Label>
                    <Input id="edit-title" value={editFormData.job_title} onChange={e => setEditFormData(prev => ({
                  ...prev,
                  job_title: e.target.value
                }))} className="bg-white border-gray-300 text-gray-900 text-sm h-8" placeholder="Job title" />
                  </div>
                  <div>
                    <Label htmlFor="edit-description" className="text-gray-700 text-xs font-medium">Job Description</Label>
                    <Textarea id="edit-description" value={editFormData.job_description} onChange={e => setEditFormData(prev => ({
                  ...prev,
                  job_description: e.target.value
                }))} className="bg-white border-gray-300 text-gray-900 text-sm min-h-[60px]" placeholder="Job description" />
                  </div>
                  <div>
                    <Label htmlFor="edit-url" className="text-gray-700 text-xs font-medium">Job URL</Label>
                    <Input id="edit-url" value={editFormData.job_url} onChange={e => setEditFormData(prev => ({
                  ...prev,
                  job_url: e.target.value
                }))} className="bg-white border-gray-300 text-gray-900 text-sm h-8" placeholder="https://..." />
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-blue-100 p-2 rounded border border-blue-200">
                      <Label className="text-blue-700 font-medium">Status</Label>
                      <p className="text-blue-900 capitalize font-bold">{selectedJob.status}</p>
                    </div>
                    <div className="bg-purple-100 p-2 rounded border border-purple-200">
                      <Label className="text-purple-700 font-medium">Created</Label>
                      <p className="text-purple-900 font-bold">{new Date(selectedJob.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleUpdateJob} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-orbitron text-sm h-9">
                  Save Changes
                </Button>
                <Button onClick={() => {
                deleteJob(selectedJob.id);
                setIsViewModalOpen(false);
                setSelectedJob(null);
              }} variant="destructive" className="bg-red-600 hover:bg-red-700 text-white font-orbitron text-sm h-9">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>}
        </DialogContent>
      </Dialog>

      {/* Job Tracker Onboarding Popup */}
      <JobTrackerOnboardingPopup 
        isOpen={showOnboarding}
        onClose={handleCloseOnboarding}
        onDontShowAgain={handleDontShowOnboardingAgain}
      />
    </Layout>;
};
export default JobTracker;
