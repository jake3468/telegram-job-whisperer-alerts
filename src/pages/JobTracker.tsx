import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserInitialization } from '@/hooks/useUserInitialization';
import { useCachedJobTracker } from '@/hooks/useCachedJobTracker';
import { Plus, ExternalLink, Trash2, X, Bookmark, Send, Users, XCircle, Trophy, GripVertical, RefreshCw, AlertCircle, CheckSquare, Square } from 'lucide-react';
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
  checklist_progress: number;
  checklist_items: ChecklistItem[];
  created_at: string;
  updated_at: string;
}
interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
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
  onUpdateChecklist: (jobId: string, index: number) => void;
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
  onUpdateChecklist: (jobId: string, index: number) => void;
}) => {
  const [isChecklistExpanded, setIsChecklistExpanded] = useState(false);
  const {
    toast
  } = useToast();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: job.id,
    disabled: job.checklist_progress < 5
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  // Check if dragging is allowed (checklist must be complete)
  const canDrag = job.checklist_progress >= 5;

  // Get progress color based on completion
  const getProgressColor = (progress: number) => {
    if (progress <= 1) return 'bg-red-500';
    if (progress <= 3) return 'bg-orange-500';
    return 'bg-green-500';
  };

  // Default checklist items if not provided
  const checklistItems = job.checklist_items && job.checklist_items.length > 0 ? job.checklist_items : [{
    id: '1',
    label: 'Resume updated',
    completed: false
  }, {
    id: '2',
    label: 'Job role analyzed',
    completed: false
  }, {
    id: '3',
    label: 'Company researched',
    completed: false
  }, {
    id: '4',
    label: 'Cover letter prepared',
    completed: false
  }, {
    id: '5',
    label: 'Ready to apply',
    completed: false
  }];
  const handleChecklistToggle = (index: number) => {
    onUpdateChecklist(job.id, index);
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
  return <div ref={setNodeRef} style={style} className="bg-white rounded border border-gray-300 shadow-sm hover:shadow-md transition-all py-1.5 px-2 mb-1">
      {/* Top section: Progress + Company + Actions */}
      <div className="flex items-center justify-between gap-2">
        {/* Left: Progress badge in circle */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${getProgressColor(job.checklist_progress)}`}>
          {job.checklist_progress}/5
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
          <Button variant="ghost" size="sm" onClick={() => setIsChecklistExpanded(!isChecklistExpanded)} className="text-xs px-1 py-1 h-6 text-gray-600 hover:text-gray-800">
            {isChecklistExpanded ? '▲' : '▼'}
          </Button>
          
          <Button variant="outline" size="sm" onClick={() => onView(job)} className="text-xs px-2 py-1 h-6 bg-pastel-lavender">
            View
          </Button>
          
          {job.job_url && <a href={job.job_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600 transition-colors p-1">
              <ExternalLink className="w-3 h-3" />
            </a>}

          {/* Drag Handle */}
          <div {...attributes} {...listeners} onClick={handleDragAttempt} className={`cursor-grab p-1 ${canDrag ? "text-gray-400 hover:text-gray-600" : "text-gray-200 cursor-not-allowed"}`} title={canDrag ? "Drag to move" : "Complete checklist to move"}>
            <GripVertical className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* Expandable Checklist */}
      {isChecklistExpanded && <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="space-y-1.5">
            {checklistItems.map((item, index) => <div key={item.id || index} className="flex items-center space-x-2">
                <button onClick={() => handleChecklistToggle(index)} className={`w-4 h-4 rounded border flex items-center justify-center text-xs flex-shrink-0 ${item.completed ? "bg-green-500 border-green-500 text-white" : "border-gray-300 hover:border-gray-400"}`}>
                  {item.completed && "✓"}
                </button>
                <span className={`text-xs leading-tight ${item.completed ? "text-green-600 line-through" : "text-gray-700"}`}>
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
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const {
    initializeUser
  } = useUserInitialization();

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
      // Reduced delay for better mobile responsiveness
      tolerance: 8 // Reduced tolerance for more accurate touch
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

      // Default checklist items
      const defaultChecklistItems: ChecklistItem[] = [{
        id: '1',
        label: '✅ Resume updated for this job',
        completed: false
      }, {
        id: '2',
        label: '✅ Job role analyzed',
        completed: false
      }, {
        id: '3',
        label: '✅ Company researched',
        completed: false
      }, {
        id: '4',
        label: '✅ Cover letter prepared',
        completed: false
      }, {
        id: '5',
        label: '✅ Ready to apply (unlocks drag)',
        completed: false
      }];

      // Create optimistic update first
      const tempJob: JobEntry = {
        id: `temp-${Date.now()}`,
        company_name: formData.company_name,
        job_title: formData.job_title,
        job_description: formData.job_description || undefined,
        job_url: formData.job_url || undefined,
        status: selectedStatus,
        order_position: maxOrder + 1,
        checklist_progress: 0,
        checklist_items: defaultChecklistItems,
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
        order_position: maxOrder + 1,
        checklist_progress: 0,
        checklist_items: JSON.stringify(defaultChecklistItems)
      }).select().single();
      if (error) throw error;

      // Replace temp job with real job
      if (data) {
        const transformedJob = {
          ...data,
          checklist_items: Array.isArray(data.checklist_items) ? data.checklist_items as unknown as ChecklistItem[] : JSON.parse(String(data.checklist_items) || '[]') as ChecklistItem[]
        };
        optimisticUpdate(transformedJob);
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

    // Check if checklist is complete before allowing drag
    if (activeJobToMove.checklist_progress !== 5) {
      toast({
        title: "Complete checklist first",
        description: "You must complete all checklist items (5/5) before moving this job to the next stage.",
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

      // Update local state immediately for instant feedback
      optimisticUpdate(updatedJob);
      try {
        const {
          error
        } = await supabase.from('job_tracker').update({
          status: targetColumn.key as JobEntry['status'],
          order_position: maxOrder + 1
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
  const handleUpdateChecklistItem = async (jobId: string, index: number) => {
    const targetJob = jobs.find(job => job.id === jobId);
    if (!targetJob) return;

    // Update the checklist items
    const updatedChecklistItems = targetJob.checklist_items.map((item, i) => i === index ? {
      ...item,
      completed: !item.completed
    } : item);

    // Calculate new progress
    const newProgress = updatedChecklistItems.filter(item => item.completed).length;
    try {
      // Update in database
      const {
        error
      } = await supabase.from('job_tracker').update({
        checklist_items: JSON.stringify(updatedChecklistItems),
        checklist_progress: newProgress
      }).eq('id', jobId);
      if (error) throw error;

      // Update local state
      const updatedJob = {
        ...targetJob,
        checklist_items: updatedChecklistItems,
        checklist_progress: newProgress
      };
      optimisticUpdate(updatedJob);
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
  const updateChecklistItem = async (itemId: string, completed: boolean) => {
    if (!selectedJob) return;

    // Update the checklist items
    const updatedChecklistItems = selectedJob.checklist_items.map(item => item.id === itemId ? {
      ...item,
      completed
    } : item);

    // Calculate new progress
    const newProgress = updatedChecklistItems.filter(item => item.completed).length;
    try {
      // Update in database
      const {
        error
      } = await supabase.from('job_tracker').update({
        checklist_items: JSON.stringify(updatedChecklistItems),
        checklist_progress: newProgress
      }).eq('id', selectedJob.id);
      if (error) throw error;

      // Update local state
      const updatedJob = {
        ...selectedJob,
        checklist_items: updatedChecklistItems,
        checklist_progress: newProgress
      };
      setSelectedJob(updatedJob);
      optimisticUpdate(updatedJob);
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
        <DialogContent className="bg-gray-900 border border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="font-orbitron">Add New Job</DialogTitle>
            <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="company" className="text-white font-orbitron text-sm">Company Name *</Label>
              <Input id="company" value={formData.company_name} onChange={e => setFormData(prev => ({
              ...prev,
              company_name: e.target.value
            }))} className="bg-gray-800 border-gray-600 text-white" placeholder="Enter company name" />
            </div>
            <div>
              <Label htmlFor="title" className="text-white font-orbitron text-sm">Job Title *</Label>
              <Input id="title" value={formData.job_title} onChange={e => setFormData(prev => ({
              ...prev,
              job_title: e.target.value
            }))} className="bg-gray-800 border-gray-600 text-white" placeholder="Enter job title" />
            </div>
            <div>
              <Label htmlFor="description" className="text-white font-orbitron text-sm">Job Description</Label>
              <Textarea id="description" value={formData.job_description} onChange={e => setFormData(prev => ({
              ...prev,
              job_description: e.target.value
            }))} className="bg-gray-800 border-gray-600 text-white min-h-[80px]" placeholder="Enter job description" />
            </div>
            <div>
              <Label htmlFor="url" className="text-white font-orbitron text-sm">Job URL</Label>
              <Input id="url" value={formData.job_url} onChange={e => setFormData(prev => ({
              ...prev,
              job_url: e.target.value
            }))} className="bg-gray-800 border-gray-600 text-white" placeholder="https://..." />
            </div>
            <Button onClick={handleAddJob} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-orbitron">
              Add Job
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Job Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="bg-gray-900 border border-gray-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-orbitron">Edit Job Details</DialogTitle>
            <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </DialogHeader>
          {selectedJob && <div className="space-y-6">
              {/* Checklist Section */}
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600">
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-white font-orbitron text-sm">Application Checklist</Label>
                  <div className="text-xs text-gray-400">
                    {selectedJob.checklist_progress}/5 completed
                  </div>
                </div>
                <div className="space-y-3">
                  {selectedJob.checklist_items.map(item => <div key={item.id} className="flex items-center space-x-3">
                      <button onClick={() => updateChecklistItem(item.id, !item.completed)} className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${item.completed ? 'bg-green-600 border-green-600 text-white' : 'border-gray-500 hover:border-gray-400'}`}>
                        {item.completed && <CheckSquare className="h-3 w-3" />}
                      </button>
                      <span className={`text-sm ${item.completed ? 'text-gray-400 line-through' : 'text-gray-200'}`}>
                        {item.label}
                      </span>
                    </div>)}
                </div>
              </div>

              {/* Job Details Section */}
              <div className="space-y-4">
                <h3 className="text-white font-orbitron text-lg">Job Details</h3>
                <div>
                  <Label htmlFor="edit-company" className="text-white font-orbitron text-sm">Company Name *</Label>
                  <Input id="edit-company" value={editFormData.company_name} onChange={e => setEditFormData(prev => ({
                ...prev,
                company_name: e.target.value
              }))} className="bg-gray-800 border-gray-600 text-white" placeholder="Enter company name" />
                </div>
                <div>
                  <Label htmlFor="edit-title" className="text-white font-orbitron text-sm">Job Title *</Label>
                  <Input id="edit-title" value={editFormData.job_title} onChange={e => setEditFormData(prev => ({
                ...prev,
                job_title: e.target.value
              }))} className="bg-gray-800 border-gray-600 text-white" placeholder="Enter job title" />
                </div>
                <div>
                  <Label htmlFor="edit-description" className="text-white font-orbitron text-sm">Job Description</Label>
                  <Textarea id="edit-description" value={editFormData.job_description} onChange={e => setEditFormData(prev => ({
                ...prev,
                job_description: e.target.value
              }))} className="bg-gray-800 border-gray-600 text-white min-h-[80px]" placeholder="Enter job description" />
                </div>
                <div>
                  <Label htmlFor="edit-url" className="text-white font-orbitron text-sm">Job URL</Label>
                  <Input id="edit-url" value={editFormData.job_url} onChange={e => setEditFormData(prev => ({
                ...prev,
                job_url: e.target.value
              }))} className="bg-gray-800 border-gray-600 text-white" placeholder="https://..." />
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-gray-400 text-sm">Status</Label>
                    <p className="text-gray-300 capitalize">{selectedJob.status}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400 text-sm">Created</Label>
                    <p className="text-gray-300">{new Date(selectedJob.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleUpdateJob} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-orbitron">
                    Save Changes
                  </Button>
                  <Button onClick={() => {
                deleteJob(selectedJob.id);
                setIsViewModalOpen(false);
                setSelectedJob(null);
              }} variant="destructive" className="bg-red-700 hover:bg-red-600 text-white font-orbitron">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Job
                  </Button>
                </div>
              </div>
            </div>}
        </DialogContent>
      </Dialog>
    </Layout>;
};
export default JobTracker;