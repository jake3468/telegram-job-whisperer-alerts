import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserInitialization } from '@/hooks/useUserInitialization';
import { useCachedJobTracker } from '@/hooks/useCachedJobTracker';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useEnterpriseAuth } from '@/hooks/useEnterpriseAuth';
import { useClerkSupabaseSync } from '@/hooks/useClerkSupabaseSync';
import { useEnhancedTokenManagerIntegration } from '@/hooks/useEnhancedTokenManagerIntegration';
import { useFormTokenKeepAlive } from '@/hooks/useFormTokenKeepAlive';
import { JobTrackerOnboardingPopup } from '@/components/JobTrackerOnboardingPopup';
import { Plus, ExternalLink, Trash2, X, Bookmark, Send, Users, XCircle, Trophy, GripVertical, RefreshCw, AlertCircle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { FileUpload } from '@/components/FileUpload';
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
  comments?: string;
  file_urls?: string[];
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
  activeJobId,
  isDragActive
}: {
  column: any;
  jobs: JobEntry[];
  onAddJob: () => void;
  onDeleteJob: (id: string) => void;
  onViewJob: (job: JobEntry) => void;
  onUpdateChecklist: (jobId: string, field: string) => void;
  activeJobId?: string;
  isDragActive: boolean;
}) => {
  const {
    isOver,
    setNodeRef
  } = useDroppable({
    id: column.key
  });
  const isDropTarget = isOver && activeJobId;
  return <div ref={setNodeRef} className={`${column.bgColor} ${column.borderColor} border-2 rounded-lg w-full min-w-0 md:flex-1 md:min-w-[280px] md:max-w-[320px] transition-all hover:shadow-lg overflow-hidden ${isDropTarget ? 'ring-2 ring-blue-400 ring-opacity-50 bg-opacity-70' : ''}`}>
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

      <div className={`p-2 h-[450px] transition-colors ${isDragActive ? 'overflow-hidden' : 'overflow-y-auto'} ${isDropTarget ? 'bg-black/5' : ''}`} style={{
      scrollBehavior: isDragActive ? 'auto' : 'smooth'
    }}>
        <SortableContext items={jobs.map(job => job.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-1">
            {jobs.map((job, index) => <SortableJobCard key={`${job.id}-${job.status}-${job.order_position}`} job={job} onDelete={onDeleteJob} onView={onViewJob} onUpdateChecklist={onUpdateChecklist} />)}
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
  const canDrag = job.status === 'saved' ? progress >= 5 : job.status === 'applied' ? progress >= 1 : job.status === 'interview' ? progress >= 2 : job.status === 'rejected' || job.status === 'offer' ? true : false;
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
  const checklistItems = job.status === 'saved' ? [{
    field: 'cover_letter_prepared',
    label: '✍️ Did you prepare your cover letter?',
    completed: job.cover_letter_prepared
  }, {
    field: 'resume_updated',
    label: '📄 Did you update your resume?',
    completed: job.resume_updated
  }, {
    field: 'company_researched',
    label: '🏢 Did you research the company?',
    completed: job.company_researched
  }, {
    field: 'job_role_analyzed',
    label: '🎯 Did you analyze the job role?',
    completed: job.job_role_analyzed
  }, {
    field: 'ready_to_apply',
    label: '🚀 Are you ready to apply?',
    completed: job.ready_to_apply
  }] : job.status === 'applied' ? [{
    field: 'interview_call_received',
    label: '📞 Did you receive the interview call?',
    completed: job.interview_call_received
  }] : job.status === 'interview' ? [{
    field: 'interview_prep_guide_received',
    label: '📘 Did you receive the Interview prep guide?',
    completed: job.interview_prep_guide_received
  }, {
    field: 'ai_mock_interview_attempted',
    label: '🤖 Did you attempt the AI mock phone Interview?',
    completed: job.ai_mock_interview_attempted
  }] : [];
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
  return <div ref={setNodeRef} style={{
    ...style,
    touchAction: isDragging ? 'none' : 'auto',
    userSelect: isDragging ? 'none' : 'auto',
    WebkitUserSelect: isDragging ? 'none' : 'auto'
  }} className={`bg-white rounded-lg border-2 border-gray-400 shadow-md hover:shadow-lg transition-all duration-200 py-1.5 px-2 mb-1 hover:scale-[1.02] min-w-0 w-full overflow-hidden ${isDragging ? 'shadow-2xl border-blue-400 bg-blue-50 scale-105 z-50' : ''}`}>
      {/* Top section: Progress + Company + Actions */}
      <div className="flex items-center gap-2 min-w-0">
        {/* Left: Progress badge in circle */}
        <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${getProgressColor(progress)}`}>
          {job.status === 'rejected' ? '❌' : job.status === 'offer' ? '🤩' : `${progress}/${job.status === 'saved' ? '5' : job.status === 'applied' ? '1' : job.status === 'interview' ? '2' : '0'}`}
        </div>
        
        {/* Center: Company & Job Title */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="font-bold text-sm text-black leading-tight break-words hyphens-auto" style={{
          wordBreak: 'break-word',
          overflowWrap: 'anywhere'
        }}>
            {job.company_name}
          </div>
          <div className="text-xs text-gray-600 leading-tight break-words hyphens-auto" style={{
          wordBreak: 'break-word',
          overflowWrap: 'anywhere'
        }}>
            {job.job_title}
          </div>
        </div>

        {/* Right: Dropdown + Actions */}
        <div className="flex items-center gap-1 flex-shrink-0 overflow-hidden">
          {/* Show dropdown arrow for jobs with checklist items */}
          {(job.status === 'saved' || job.status === 'applied' || job.status === 'interview') && <Button variant="ghost" size="sm" onClick={() => setIsChecklistExpanded(!isChecklistExpanded)} className="text-xs px-1 py-1 h-6 text-gray-600 hover:text-gray-800">
              {isChecklistExpanded ? '▲' : '▼'}
            </Button>}
          
          <Button variant="outline" size="sm" onClick={() => onView(job)} className="text-xs px-2 py-1 h-6 bg-pastel-lavender flex-shrink-0">
            View
          </Button>
          
          {job.job_url && <a href={job.job_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 transition-colors p-1 flex-shrink-0" title="Open job posting">
              <ExternalLink className="w-3 h-3" />
            </a>}

          {/* Enhanced Drag Handle with Mobile Touch Support */}
          <div {...attributes} {...listeners} onClick={handleDragAttempt} className={`relative cursor-grab p-3 sm:p-2 transition-all duration-200 flex-shrink-0 rounded-md touch-manipulation ${canDrag ? `text-gray-600 hover:text-gray-800 ${isDragging ? 'bg-blue-100 scale-110 shadow-lg' : 'hover:bg-gray-100'}` : "text-gray-400 cursor-not-allowed"}`} title={canDrag ? "Hold for 0.5s then drag to move" : "Complete checklist to move"} style={{
          minWidth: '32px',
          minHeight: '32px',
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none'
        }}>
            {/* Dragging Indicator */}
            {isDragging && <div className="absolute inset-0 bg-blue-500/30 rounded-md animate-pulse" />}
            
            <GripVertical className={`w-4 h-4 relative z-10 transition-transform ${isDragging ? 'scale-110' : ''}`} />
          </div>
        </div>
      </div>

      {/* Expandable Checklist - for saved, applied, and interview jobs */}
      {isChecklistExpanded && (job.status === 'saved' || job.status === 'applied' || job.status === 'interview') && <div className="mt-2 pt-2 border-t border-gray-200 min-w-0">
          <div className="space-y-1.5">
            {checklistItems.map(item => <div key={item.field} className="flex items-center space-x-2 min-w-0">
                <Checkbox checked={item.completed} onCheckedChange={() => handleChecklistToggle(item.field)} className={`h-4 w-4 flex-shrink-0 ${item.completed ? 'data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500' : ''}`} />
                <span className={`text-xs leading-tight flex-1 min-w-0 ${item.completed ? "text-gray-500 line-through" : "text-gray-700"}`}>
                  {item.label}
                </span>
              </div>)}
          </div>
        </div>}
    </div>;
};
const JobTracker = () => {
  const {
    user,
    isLoaded
  } = useUser();
  const {
    executeWithRetry,
    isAuthReady
  } = useEnterpriseAuth();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const {
    initializeUser
  } = useUserInitialization();
  const {
    userProfile,
    updateUserProfile
  } = useUserProfile();

  // Enterprise session management for Job Tracker page
  useClerkSupabaseSync();
  const sessionManager = useEnhancedTokenManagerIntegration({
    enabled: true
  });
  const {
    updateActivity
  } = useFormTokenKeepAlive(true);

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

  // Handle refresh trigger from navigation state
  useEffect(() => {
    const state = window.history.state;
    if (state?.refresh) {
      // Clear the navigation state and trigger refresh
      window.history.replaceState({}, document.title, window.location.pathname);
      forceRefresh();
    }
  }, [forceRefresh]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobEntry | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'saved' | 'applied' | 'interview'>('saved');
  const [activeJob, setActiveJob] = useState<JobEntry | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [commentTimer, setCommentTimer] = useState<NodeJS.Timeout | null>(null);
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
  // Auto-scroll animation frame ref
  const autoScrollAnimationRef = React.useRef<number | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor), useSensor(TouchSensor, {
    activationConstraint: {
      delay: 500,
      tolerance: 5
    }
  }), useSensor(MouseSensor));
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

  // Remove redundant user initialization - useUserProfile already handles this
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
      await updateUserProfile({
        show_job_tracker_onboarding_popup: false
      });
    }
  };

  // Manual refresh function - instant refresh for better UX
  const handleManualRefresh = useCallback(() => {
    updateActivity(); // Track user activity
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
  }, [forceRefresh, connectionIssue, error, updateActivity]);
  const handleAddJob = async () => {
    updateActivity(); // Track user activity
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
    if (!isAuthReady) {
      toast({
        title: "Please wait",
        description: "Authentication is loading. Please try again in a moment.",
        variant: "destructive"
      });
      return;
    }
    try {
      // Get the next order position using database function for consistency
      const {
        data: nextPosition,
        error: positionError
      } = await executeWithRetry(async () => {
        return await supabase.rpc('get_next_order_position', {
          p_user_id: userProfileId,
          p_status: selectedStatus
        });
      }, 3, 'get next order position');
      if (positionError) {
        throw new Error(`Failed to get order position: ${positionError.message}`);
      }
      const orderPosition = nextPosition || 0;

      // Create optimistic update first
      const tempJob: JobEntry = {
        id: `temp-${Date.now()}`,
        company_name: formData.company_name,
        job_title: formData.job_title,
        job_description: formData.job_description || undefined,
        job_url: formData.job_url || undefined,
        status: selectedStatus,
        order_position: orderPosition,
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
      const data = await executeWithRetry(async () => {
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
          order_position: orderPosition
        }).select().single();
        if (error) throw error;
        return data;
      }, 3, 'add job to tracker');

      // Replace temp job with real job
      if (data) {
        optimisticUpdate({
          ...data,
          file_urls: Array.isArray(data.file_urls) ? data.file_urls.map(url => String(url)) : [],
          comments: data.comments || undefined
        } as JobEntry);
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
    if (!selectedJob) {
      toast({
        title: "Error",
        description: "No job selected for update.",
        variant: "destructive"
      });
      return;
    }
    if (!isAuthReady || !userProfileId) {
      toast({
        title: "Please wait",
        description: "Loading your data. Please try again in a moment.",
        variant: "default"
      });
      return;
    }

    // Show loading state
    const loadingToast = toast({
      title: "Updating job...",
      description: "Please wait while we save your changes.",
      duration: 0
    });
    try {
      await executeWithRetry(async () => {
        const {
          error
        } = await supabase.from('job_tracker').update({
          company_name: editFormData.company_name,
          job_title: editFormData.job_title,
          job_description: editFormData.job_description || null,
          job_url: editFormData.job_url || null
        }).eq('id', selectedJob.id).eq('user_id', userProfileId);
        if (error) {
          throw error;
        }
      }, 3, 'update job details');

      // Dismiss loading toast
      loadingToast.dismiss();
      toast({
        title: "Success",
        description: "Job updated successfully!"
      });
      setIsViewModalOpen(false);
      setSelectedJob(null);
      invalidateCache();
    } catch (error: any) {
      // Dismiss loading toast
      loadingToast.dismiss();

      // Enterprise-grade error handling - user-friendly messages only
      let errorMessage = "Unable to update job. Please try again.";
      if (error?.code === 'PGRST116') {
        errorMessage = "Job not found. Please refresh the page.";
      } else if (error?.message?.includes('refresh the page')) {
        errorMessage = error.message;
      }
      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };
  const handleDeleteJob = async () => {
    updateActivity(); // Track user activity
    if (!selectedJob) return;
    if (!isAuthReady || !userProfileId) {
      toast({
        title: "Please wait",
        description: "Loading your data. Please try again in a moment.",
        variant: "default"
      });
      return;
    }

    // Show loading state
    const loadingToast = toast({
      title: "Deleting job...",
      description: "Please wait while we remove this job.",
      duration: 0
    });
    try {
      await executeWithRetry(async () => {
        const {
          error
        } = await supabase.from('job_tracker').delete().eq('id', selectedJob.id).eq('user_id', userProfileId);
        if (error) {
          throw error;
        }
      }, 3, 'delete job');

      // Dismiss loading toast
      loadingToast.dismiss();
      toast({
        title: "Success",
        description: "Job deleted successfully!"
      });
      optimisticDelete(selectedJob.id);
      setIsViewModalOpen(false);
      setSelectedJob(null);
      invalidateCache();
    } catch (error: any) {
      // Dismiss loading toast
      loadingToast.dismiss();

      // Enterprise-grade error handling
      let errorMessage = "Unable to delete job. Please try again.";
      if (error?.message?.includes('refresh the page')) {
        errorMessage = error.message;
      }
      toast({
        title: "Delete Failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };
  // Auto-scroll implementation
  const autoScroll = useCallback((clientY: number) => {
    const scrollThreshold = 100;
    const scrollSpeed = 10;
    const viewportHeight = window.innerHeight;
    if (clientY < scrollThreshold) {
      // Scroll up
      window.scrollBy(0, -scrollSpeed);
    } else if (clientY > viewportHeight - scrollThreshold) {
      // Scroll down
      window.scrollBy(0, scrollSpeed);
    }
  }, []);

  // Drag and Drop handlers with auto-scroll support and optimistic updates
  const handleDragStart = (event: DragStartEvent) => {
    const draggedJob = jobs.find(job => job.id === event.active.id);
    if (draggedJob) {
      setActiveJob(draggedJob);

      // Haptic feedback for mobile (if supported)
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      updateActivity();
    }
  };
  const handleDragEnd = async (event: DragEndEvent) => {
    const {
      active,
      over
    } = event;
    setActiveJob(null);

    // Clear auto-scroll animation
    if (autoScrollAnimationRef.current) {
      cancelAnimationFrame(autoScrollAnimationRef.current);
      autoScrollAnimationRef.current = null;
    }
    updateActivity(); // Track user activity
    if (!over) return;
    const activeJobToMove = jobs.find(j => j.id === active.id);
    if (!activeJobToMove) return;

    // Handle reordering within the same column
    if (over.id === activeJobToMove.status) {
      // Same column - just reorder
      const targetJobs = jobs.filter(job => job.status === activeJobToMove.status).sort((a, b) => a.order_position - b.order_position);
      const activeIndex = targetJobs.findIndex(job => job.id === active.id);
      const overIndex = targetJobs.findIndex(job => job.id === over.id);
      if (activeIndex !== overIndex && activeIndex !== -1 && overIndex !== -1) {
        // Reorder logic - update order_position values
        const reorderedJobs = [...targetJobs];
        const [movedItem] = reorderedJobs.splice(activeIndex, 1);
        reorderedJobs.splice(overIndex, 0, movedItem);

        // Update order positions
        reorderedJobs.forEach((job, index) => {
          const updatedJob = {
            ...job,
            order_position: index
          };
          optimisticUpdate(updatedJob);
        });

        // Update database for all affected jobs using enhanced authentication
        try {
          await executeWithRetry(async () => {
            await Promise.all(reorderedJobs.map(async (job, index) => {
              const {
                error
              } = await supabase.from('job_tracker').update({
                order_position: index
              }).eq('id', job.id);
              if (error) throw error;
            }));
          }, 3, 'reorder jobs in database');
        } catch (error) {
          console.error('Error reordering jobs:', error);
          toast({
            title: "Error",
            description: "Failed to reorder jobs.",
            variant: "destructive"
          });
        }
      }
      return;
    }

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

    // Check if checklist is complete before allowing drag (except for rejected/offer columns)
    const progress = getProgress(activeJobToMove);
    let requiredProgress = 0;
    if (activeJobToMove.status === 'saved') {
      requiredProgress = 5;
    } else if (activeJobToMove.status === 'applied') {
      requiredProgress = 1;
    } else if (activeJobToMove.status === 'interview') {
      requiredProgress = 2;
    }

    // Allow dragging from rejected/offer columns without checklist requirements
    if (activeJobToMove.status !== 'rejected' && activeJobToMove.status !== 'offer' && progress < requiredProgress) {
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
      try {
        // Get the next order position using database function for consistency
        const {
          data: nextPosition,
          error: positionError
        } = await executeWithRetry(async () => {
          return await supabase.rpc('get_next_order_position', {
            p_user_id: userProfileId,
            p_status: targetColumn.key as 'saved' | 'applied' | 'interview' | 'rejected' | 'offer'
          });
        }, 3, 'get next order position for drag drop');
        if (positionError) {
          throw new Error(`Failed to get order position: ${positionError.message}`);
        }
        const orderPosition = nextPosition || 0;

        // Optimistic update - update UI immediately  
        const updatedJob = {
          ...activeJobToMove,
          status: targetColumn.key as 'saved' | 'applied' | 'interview' | 'rejected' | 'offer',
          order_position: orderPosition
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
        optimisticUpdate({
          ...updatedJob,
          file_urls: Array.isArray(updatedJob.file_urls) ? updatedJob.file_urls.map(url => String(url)) : [],
          comments: updatedJob.comments || undefined
        } as JobEntry);
        await executeWithRetry(async () => {
          const {
            error
          } = await supabase.from('job_tracker').update({
            status: targetColumn.key as 'saved' | 'applied' | 'interview' | 'rejected' | 'offer',
            order_position: orderPosition,
            interview_call_received: updatedJob.interview_call_received,
            interview_prep_guide_received: updatedJob.interview_prep_guide_received,
            ai_mock_interview_attempted: updatedJob.ai_mock_interview_attempted
          }).eq('id', activeJobToMove.id);
          if (error) throw error;
        }, 3, 'move job to new column');

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
    const filteredJobs = jobs.filter(job => job.status === status).sort((a, b) => a.order_position - b.order_position);
    return filteredJobs;
  };
  const handleViewJob = (job: JobEntry) => {
    updateActivity(); // Track user activity
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
    updateActivity(); // Track user activity
    const targetJob = jobs.find(job => job.id === jobId);
    if (!targetJob || targetJob.status !== 'saved' && targetJob.status !== 'applied' && targetJob.status !== 'interview') return;

    // Check if authentication is ready
    if (!isAuthReady) {
      toast({
        title: "Please wait",
        description: "Authentication is loading. Please try again in a moment.",
        variant: "destructive"
      });
      return;
    }
    try {
      // Update in database using enhanced authentication
      const currentValue = targetJob[field as keyof JobEntry] as boolean;

      // First perform optimistic update for immediate UI feedback
      const updatedJob = {
        ...targetJob,
        [field]: !currentValue
      };
      optimisticUpdate(updatedJob);

      // Also update selectedJob if it's the same job
      if (selectedJob && selectedJob.id === jobId) {
        setSelectedJob(updatedJob);
      }

      // Perform database update with improved error handling
      try {
        await executeWithRetry(async () => {
          const {
            error
          } = await supabase.from('job_tracker').update({
            [field]: !currentValue
          }).eq('id', jobId);
          if (error) throw error;
        }, 5, 'update checklist item'); // Increased retries to 5

        // Only show success toast if database update succeeded
        toast({
          title: "Success",
          description: "Checklist updated successfully!"
        });
      } catch (dbError) {
        console.error('Database error updating checklist:', dbError);

        // Revert optimistic update on database error
        optimisticUpdate(targetJob);
        if (selectedJob && selectedJob.id === jobId) {
          setSelectedJob(targetJob);
        }

        // Only show error toast for actual database failures
        toast({
          title: "Error",
          description: "Failed to update checklist. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      // This catches any unexpected errors in the optimistic update logic
      console.error('Unexpected error in checklist update:', error);

      // Ensure we revert the optimistic update
      optimisticUpdate(targetJob);
      if (selectedJob && selectedJob.id === jobId) {
        setSelectedJob(targetJob);
      }
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    }
  };
  if (!isLoaded || !user) {
    return <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-fuchsia-950 flex items-center justify-center">
        <div className="text-white text-xs">Loading...</div>
      </div>;
  }

  // Show loading state if authentication is not ready
  if (!isAuthReady) {
    return <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-white text-xs">Preparing secure connection...</div>
        </div>
      </Layout>;
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
              
              {/* Manual Refresh Button - Always visible for debugging */}
              <Button onClick={handleManualRefresh} variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-gray-800/50 h-8 w-8 p-0" title="Refresh data">
                <RefreshCw className="h-4 w-4" />
              </Button>
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

            <p className="text-gray-100 font-inter max-w-4xl mx-auto leading-relaxed mb-3 font-extralight text-sm">Drag jobs between columns using the ⋮⋮ handle as you progress through each stage. Click ‘View’ to see job details or use the ➕ button to manually add a job. Each stage comes with its own checklist — from resume prep and job research to AI mock interviews — so you always know what to do next</p>
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
        <main className="flex-1 p-4 overflow-x-hidden md:overflow-x-auto">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragMove={event => {
          // Implement auto-scroll during drag
          if (event.active && event.delta) {
            const rect = event.active.rect.current.translated;
            if (rect) {
              const clientY = rect.top + rect.height / 2;

              // Clear existing animation
              if (autoScrollAnimationRef.current) {
                cancelAnimationFrame(autoScrollAnimationRef.current);
              }

              // Set up new auto-scroll animation
              const scroll = () => {
                autoScroll(clientY);
                autoScrollAnimationRef.current = requestAnimationFrame(scroll);
              };
              autoScrollAnimationRef.current = requestAnimationFrame(scroll);
            }
          }
        }}>
            {/* Responsive flexbox: stacked on mobile, wrapped on larger screens */}
            <div className="flex flex-col md:flex-row md:flex-wrap gap-2 sm:gap-4 w-full min-w-0">
              {columns.map(column => <DroppableColumn key={column.key} column={column} jobs={getJobsByStatus(column.key)} onAddJob={() => {
              updateActivity(); // Track user activity
              setSelectedStatus(column.key as 'saved' | 'applied' | 'interview');
              setIsModalOpen(true);
            }} onDeleteJob={handleDeleteJob} onViewJob={handleViewJob} onUpdateChecklist={handleUpdateChecklistItem} activeJobId={activeJob?.id} isDragActive={isDragActive} />)}
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
        <DialogContent className="bg-white border border-gray-200 text-gray-900 w-[90vw] max-w-md rounded-xl overflow-hidden p-0">
          <DialogHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-t-xl">
            <DialogTitle className="font-orbitron text-white text-lg pr-8 text-center">Add New Job</DialogTitle>
            <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 text-white hover:text-gray-200">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </DialogHeader>
          <div className="p-4 space-y-4">
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
            <Button onClick={handleAddJob} className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-orbitron">Add</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Job Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 text-gray-900 w-[95vw] max-w-md h-[90vh] max-h-[600px] overflow-hidden rounded-lg sm:rounded-lg p-0 flex flex-col">
          <DialogHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg p-4 flex-shrink-0">
            <DialogTitle className="font-orbitron text-white text-lg pr-8">Job Details</DialogTitle>
            <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 text-white hover:text-gray-200">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </DialogHeader>
          
          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto p-4">
          {selectedJob && <div className="space-y-4">
              {/* Checklist Section */}
              {(selectedJob.status === 'saved' || selectedJob.status === 'applied' || selectedJob.status === 'interview') && <div className="bg-gradient-to-r from-green-50 to-emerald-100 rounded-lg p-3 border border-green-200">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-green-800 font-orbitron text-sm font-bold">
                      {selectedJob.status === 'saved' ? 'Application Checklist' : selectedJob.status === 'applied' ? 'Applied Status' : 'Interview Checklist'}
                    </Label>
                    <div className={`text-xs font-bold px-2 py-1 rounded-full ${selectedJob.status === 'saved' ? [selectedJob.resume_updated, selectedJob.job_role_analyzed, selectedJob.company_researched, selectedJob.cover_letter_prepared, selectedJob.ready_to_apply].filter(Boolean).length === 0 ? 'bg-red-500 text-white' : [selectedJob.resume_updated, selectedJob.job_role_analyzed, selectedJob.company_researched, selectedJob.cover_letter_prepared, selectedJob.ready_to_apply].filter(Boolean).length === 5 ? 'bg-green-500 text-white' : 'bg-orange-500 text-white' : selectedJob.status === 'applied' ? selectedJob.interview_call_received ? 'bg-green-500 text-white' : 'bg-red-500 text-white' : [selectedJob.interview_prep_guide_received, selectedJob.ai_mock_interview_attempted].filter(Boolean).length === 0 ? 'bg-red-500 text-white' : [selectedJob.interview_prep_guide_received, selectedJob.ai_mock_interview_attempted].filter(Boolean).length === 2 ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'}`}>
                      {selectedJob.status === 'saved' ? `${[selectedJob.resume_updated, selectedJob.job_role_analyzed, selectedJob.company_researched, selectedJob.cover_letter_prepared, selectedJob.ready_to_apply].filter(Boolean).length}/5` : selectedJob.status === 'applied' ? `${selectedJob.interview_call_received ? 1 : 0}/1` : `${[selectedJob.interview_prep_guide_received, selectedJob.ai_mock_interview_attempted].filter(Boolean).length}/2`}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {(selectedJob.status === 'saved' ? [{
                  field: 'cover_letter_prepared',
                  label: '✍️ Did you prepare your cover letter?',
                  completed: selectedJob.cover_letter_prepared,
                  page: '/cover-letter',
                  linkText: 'Get it now'
                }, {
                  field: 'resume_updated',
                  label: '📄 Did you update your resume?',
                  completed: selectedJob.resume_updated,
                  page: '/resume-builder',
                  linkText: 'Update Now'
                }, {
                  field: 'company_researched',
                  label: '🏢 Did you research the company?',
                  completed: selectedJob.company_researched,
                  page: '/company-role-analysis',
                  linkText: 'Research Now'
                }, {
                  field: 'job_role_analyzed',
                  label: '🎯 Did you analyze the job role?',
                  completed: selectedJob.job_role_analyzed,
                  page: '/job-guide',
                  linkText: 'Analyze Now'
                }, {
                  field: 'ready_to_apply',
                  label: '🚀 Are you ready to apply?',
                  completed: selectedJob.ready_to_apply,
                  page: null,
                  linkText: null
                }] : selectedJob.status === 'applied' ? [{
                  field: 'interview_call_received',
                  label: '📞 Did you receive the interview call?',
                  completed: selectedJob.interview_call_received,
                  page: null,
                  linkText: null
                }] : [{
                  field: 'interview_prep_guide_received',
                  label: '📘 Did you receive the Interview prep guide?',
                  completed: selectedJob.interview_prep_guide_received,
                  page: '/interview-prep',
                  linkText: 'Get Prep Guide'
                }, {
                  field: 'ai_mock_interview_attempted',
                  label: '🤖 Did you attempt the AI mock phone Interview?',
                  completed: selectedJob.ai_mock_interview_attempted,
                  page: '/ai-mock-interview',
                  linkText: 'Call Phone Now'
                }]).map(item => <div key={item.field} className="flex items-center justify-between space-x-2">
                        <div className="flex items-center space-x-2 flex-1">
                          <Checkbox checked={item.completed} onCheckedChange={() => handleUpdateChecklistItem(selectedJob.id, item.field)} className={`h-4 w-4 ${item.completed ? 'data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500' : ''}`} />
                          <span className={`text-xs ${item.completed ? 'text-green-600 line-through' : 'text-green-800'}`}>
                            {item.label}
                          </span>
                        </div>
                        {item.page && !item.completed && <button onClick={() => {
                    if (item.page === '/cover-letter') {
                      navigate(item.page, {
                        state: {
                          companyName: selectedJob.company_name,
                          jobTitle: selectedJob.job_title,
                          jobDescription: selectedJob.job_description || ''
                        }
                      });
                    } else if (item.page === '/resume-builder') {
                      navigate(item.page);
                    } else if (item.page === '/company-role-analysis') {
                      navigate(item.page, {
                        state: {
                          companyName: selectedJob.company_name,
                          jobTitle: selectedJob.job_title,
                          locationMessage: 'this field needs to be filled'
                        }
                      });
                    } else if (item.page === '/job-guide') {
                      navigate(item.page, {
                        state: {
                          companyName: selectedJob.company_name,
                          jobTitle: selectedJob.job_title,
                          jobDescription: selectedJob.job_description || ''
                        }
                      });
                    } else if (item.page === '/interview-prep') {
                      navigate(item.page, {
                        state: {
                          companyName: selectedJob.company_name,
                          jobTitle: selectedJob.job_title,
                          jobDescription: selectedJob.job_description || ''
                        }
                      });
                    } else if (item.page === '/ai-mock-interview') {
                      navigate(item.page, {
                        state: {
                          companyName: selectedJob.company_name,
                          jobTitle: selectedJob.job_title,
                          jobDescription: selectedJob.job_description || ''
                        }
                      });
                    } else {
                      navigate(item.page);
                    }
                  }} className="text-blue-600 hover:text-blue-800 text-xs font-medium underline">
                            {item.linkText || 'Get it now'}
                          </button>}
                      </div>)}
                   </div>
                   
                   {/* Tips for Saved status */}
                   {selectedJob.status === 'saved' && [selectedJob.resume_updated, selectedJob.job_role_analyzed, selectedJob.company_researched, selectedJob.cover_letter_prepared, selectedJob.ready_to_apply].filter(Boolean).length === 5 && <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                       <p className="text-blue-700 text-xs font-medium">
                         ✅ Great! All checklist items completed. You can now drag and drop this job card to the 'Applied' section.
                       </p>
                     </div>}
                   
                   {/* Tips for Applied status */}
                   {selectedJob.status === 'applied' && <div className="mt-3 space-y-2">
                       <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
                         <p className="text-green-700 text-xs font-medium">💡 Once you receive the interview call from the HR, you can tick mark above and then move this card to the 'Interview' section to unlock the checklist for interview preparation.</p>
                       </div>
                       <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                         <p className="text-blue-700 text-xs font-medium mb-2">
                           💡 Still waiting on that interview call? Have you posted something impactful on LinkedIn to stand out? Use our AI-powered LinkedIn post generator with custom images to share your ideas, achievements, or insights — and stay visible to recruiters while you wait.
                         </p>
                         <Link to="/linkedin-posts" className="text-blue-600 hover:text-blue-800 text-xs font-bold underline">
                           Create a Post Now 🚀
                         </Link>
                       </div>
                     </div>}
                    
                     {/* Tips for Interview status */}
                     {selectedJob.status === 'interview' && <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                         <p className="text-blue-700 text-xs font-medium">
                           💖 Got an update from the recruiter? You can now move this job to either the 'Offer' or 'Rejected' column. Whatever the outcome, we're cheering you on — and there's always a next step 😊
                         </p>
                       </div>}
                 </div>}

              {/* Comments Section */}
              <div className="bg-gradient-to-r from-yellow-50 to-amber-100 rounded-lg p-3 border border-yellow-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-yellow-800 font-orbitron text-sm font-bold">Comments</h3>
                  <Button onClick={async () => {
                  try {
                    const {
                      error
                    } = await supabase.from('job_tracker').update({
                      comments: selectedJob.comments
                    }).eq('id', selectedJob.id);
                    if (error) throw error;

                    // Update optimistic state
                    optimisticUpdate(selectedJob);
                    toast({
                      title: "Success",
                      description: "Comment saved successfully!"
                    });
                  } catch (error) {
                    console.error('Error saving comment:', error);
                    toast({
                      title: "Error",
                      description: "Failed to save comment.",
                      variant: "destructive"
                    });
                  }
                }} size="sm" className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs h-6 px-2">
                    Save
                  </Button>
                </div>
                <Textarea value={selectedJob.comments || ''} onChange={e => {
                const updatedJob = {
                  ...selectedJob,
                  comments: e.target.value
                };
                setSelectedJob(updatedJob);
                // Auto-save after 2 seconds of no typing (backup)
                if (commentTimer) clearTimeout(commentTimer);
                const newTimer = setTimeout(async () => {
                  await supabase.from('job_tracker').update({
                    comments: e.target.value
                  }).eq('id', selectedJob.id);
                }, 2000);
                setCommentTimer(newTimer);
              }} placeholder="Add your notes about this job..." className="border-yellow-300 text-gray-900 placeholder:text-gray-500 text-sm min-h-[60px] bg-white/80" />
              </div>

              {/* File Upload Section */}
              <div className="bg-gradient-to-r from-purple-50 to-violet-100 rounded-lg p-3 border border-purple-200">
                <h3 className="text-purple-800 font-orbitron text-sm font-bold mb-3">Files</h3>
                {userProfileId && <FileUpload jobId={selectedJob.id} userProfileId={userProfileId} existingFiles={selectedJob.file_urls || []} onFilesUpdate={files => {
                const updatedJob = {
                  ...selectedJob,
                  file_urls: files
                };
                setSelectedJob(updatedJob);
                optimisticUpdate(updatedJob);
              }} />}
              </div>

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
              </div>}
            </div>
          
          {/* Fixed footer with action buttons */}
          <div className="flex-shrink-0 p-4 border-t border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-100">
            <div className="flex gap-2">
              <Button onClick={handleUpdateJob} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-orbitron text-sm h-9">
                Save Changes
              </Button>
              <Button onClick={() => {
              handleDeleteJob();
              setIsViewModalOpen(false);
              setSelectedJob(null);
            }} variant="destructive" className="bg-red-600 hover:bg-red-700 text-white font-orbitron text-sm h-9">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
        </DialogContent>
      </Dialog>

      {/* Job Tracker Onboarding Popup */}
      <JobTrackerOnboardingPopup isOpen={showOnboarding} onClose={handleCloseOnboarding} onDontShowAgain={handleDontShowOnboardingAgain} />
    </Layout>;
};
export default JobTracker;