import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, ExternalLink, Trash2, X, Bookmark, Send, Users, XCircle, Trophy, GripVertical, RefreshCw, AlertCircle } from 'lucide-react';
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
  activeJobId
}: {
  column: any;
  jobs: JobEntry[];
  onAddJob: () => void;
  onDeleteJob: (id: string) => void;
  onViewJob: (job: JobEntry) => void;
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

      <div className={`p-4 min-h-[450px] ${isDropTarget ? 'bg-black/5' : ''} transition-colors`}>
        <SortableContext items={jobs.map(job => job.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {jobs.map(job => <SortableJobCard key={job.id} job={job} onDelete={onDeleteJob} onView={onViewJob} />)}
          </div>
        </SortableContext>
      </div>
    </div>;
};

// Sortable Job Card Component with dedicated drag handle
const SortableJobCard = ({
  job,
  onDelete,
  onView
}: {
  job: JobEntry;
  onDelete: (id: string) => void;
  onView: (job: JobEntry) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: job.id
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };
  return <div ref={setNodeRef} style={style} {...attributes} className="bg-gray-800 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-all group shadow-lg relative">
      {/* Drag Handle - Only this area is draggable */}
      <div {...listeners} className="absolute top-2 right-2 p-3 md:p-2 rounded cursor-grab active:cursor-grabbing hover:bg-gray-700 transition-colors bg-gray-700/50 hover:bg-gray-700/70 touch-manipulation select-none" title="Drag to move between columns" style={{
      touchAction: 'none'
    }} onTouchStart={e => {
      e.preventDefault();
    }}>
        <GripVertical className="h-5 w-5 md:h-4 md:w-4 text-gray-200 hover:text-gray-100" />
      </div>

      <div className="flex items-start justify-between mb-3 pr-8">
        <div className="flex-1">
          <h4 className="font-bold text-sm font-orbitron text-amber-200">{job.company_name}</h4>
          <p className="text-xs font-medium mb-2 text-fuchsia-200">{job.job_title}</p>
          <p className="text-gray-400 text-xs">
            Added: {new Date(job.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/20" onClick={e => {
          e.stopPropagation();
          onDelete(job.id);
        }}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button size="sm" variant="outline" onClick={e => {
        e.stopPropagation();
        onView(job);
      }} className="text-xs border-gray-600 text-gray-300 hover:text-white h-7 px-3 bg-blue-700 hover:bg-blue-600">
          View
        </Button>
        {job.job_url && <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-blue-300 hover:text-blue-100 hover:bg-blue-900/20" onClick={e => {
        e.stopPropagation();
        window.open(job.job_url, '_blank');
      }}>
            <ExternalLink className="h-3 w-3" />
          </Button>}
      </div>
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
  const [jobs, setJobs] = useState<JobEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  // Auto-refresh every 10 seconds and on visibility change
  useEffect(() => {
    if (user) {
      fetchJobs();
      const interval = setInterval(fetchJobs, 10000);

      // Handle page visibility changes
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          fetchJobs();
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
        clearInterval(interval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [user]);
  useEffect(() => {
    if (isLoaded && !user) {
      navigate('/');
    }
  }, [user, isLoaded, navigate]);
  const fetchJobs = useCallback(async (retryCount = 0) => {
    if (!user) return;
    setError(null);
    console.log(`Fetching jobs for user: ${user.id} (attempt ${retryCount + 1})`);
    try {
      // Silent token refresh for JWT expiry issues
      const {
        data: sessionData
      } = await supabase.auth.getSession();
      if (!sessionData.session) {
        console.log('No active session, attempting refresh...');
        const {
          error: refreshError
        } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.error('Token refresh failed:', refreshError);
          if (retryCount < 2) {
            setTimeout(() => fetchJobs(retryCount + 1), 1000);
            return;
          }
        }
      }

      // First get the user UUID from users table using clerk_id
      const {
        data: userData,
        error: userError
      } = await supabase.from('users').select('id').eq('clerk_id', user.id).maybeSingle();
      if (userError) {
        console.error('User lookup error:', userError);
        // Don't show JWT/RLS errors to users - handle silently
        if (userError.message.includes('JWT') || userError.message.includes('expired') || userError.message.includes('row-level security')) {
          console.log('Silent authentication issue, retrying...');
          if (retryCount < 3) {
            setTimeout(() => fetchJobs(retryCount + 1), 1000 * (retryCount + 1));
            return;
          }
        }
        throw new Error('Unable to load your profile');
      }
      if (!userData) {
        console.log('User not found, creating new user...');
        // Try to create user if they don't exist
        const {
          data: newUser,
          error: createUserError
        } = await supabase.from('users').insert({
          clerk_id: user.id,
          email: user.primaryEmailAddress?.emailAddress || '',
          first_name: user.firstName || '',
          last_name: user.lastName || ''
        }).select('id').single();
        if (createUserError || !newUser) {
          console.error('Failed to create user:', createUserError);
          // Silent retry for creation issues
          if (createUserError?.message.includes('JWT') || createUserError?.message.includes('expired')) {
            if (retryCount < 3) {
              setTimeout(() => fetchJobs(retryCount + 1), 1000 * (retryCount + 1));
              return;
            }
          }
          throw new Error('Unable to set up your account');
        }

        // Create user profile with better error handling
        const {
          data: newProfile,
          error: profileError
        } = await supabase.from('user_profile').insert({
          user_id: newUser.id
        }).select('id').single();
        if (profileError || !newProfile) {
          console.error('Failed to create user profile:', profileError);
          // Silent retry for profile creation issues
          if (profileError?.message.includes('JWT') || profileError?.message.includes('expired')) {
            if (retryCount < 3) {
              setTimeout(() => fetchJobs(retryCount + 1), 1000 * (retryCount + 1));
              return;
            }
          }
          throw new Error('Unable to complete account setup');
        }
        console.log('New user and profile created successfully');
        setJobs([]);
        setError(null);
        return;
      }

      // Get user profile using the user UUID
      const {
        data: userProfile,
        error: profileError
      } = await supabase.from('user_profile').select('id').eq('user_id', userData.id).maybeSingle();
      if (profileError) {
        console.error('User profile lookup error:', profileError);
        // Silent retry for JWT/RLS issues
        if (profileError.message.includes('JWT') || profileError.message.includes('expired') || profileError.message.includes('row-level security')) {
          if (retryCount < 3) {
            setTimeout(() => fetchJobs(retryCount + 1), 1000 * (retryCount + 1));
            return;
          }
        }
        throw new Error('Unable to access your profile');
      }
      if (!userProfile) {
        console.log('Profile not found, creating profile...');
        // Create user profile if it doesn't exist
        const {
          data: newProfile,
          error: createProfileError
        } = await supabase.from('user_profile').insert({
          user_id: userData.id
        }).select('id').single();
        if (createProfileError || !newProfile) {
          console.error('Failed to create profile:', createProfileError);
          // Silent retry for creation issues
          if (createProfileError?.message.includes('JWT') || createProfileError?.message.includes('expired')) {
            if (retryCount < 3) {
              setTimeout(() => fetchJobs(retryCount + 1), 1000 * (retryCount + 1));
              return;
            }
          }
          throw new Error('Unable to create your profile');
        }
        console.log('Profile created successfully');
        setJobs([]);
        setError(null);
        return;
      }

      // Finally get jobs for this user profile
      console.log(`Fetching jobs for profile: ${userProfile.id}`);
      const {
        data,
        error
      } = await supabase.from('job_tracker').select('*').eq('user_id', userProfile.id).order('order_position', {
        ascending: true
      });
      if (error) {
        console.error('Job tracker query error:', error);
        // Silent retry for JWT/RLS issues
        if (error.message.includes('JWT') || error.message.includes('expired') || error.message.includes('row-level security')) {
          if (retryCount < 3) {
            setTimeout(() => fetchJobs(retryCount + 1), 1000 * (retryCount + 1));
            return;
          }
        }
        throw new Error('Unable to load your job applications');
      }
      console.log(`Successfully loaded ${data?.length || 0} jobs`);
      setJobs(data || []);
      setError(null);
    } catch (error: any) {
      console.error('Error fetching jobs:', error);
      const errorMessage = error.message || 'Unable to load job applications';

      // Only show user-friendly errors, never technical ones
      if (!errorMessage.includes('JWT') && !errorMessage.includes('expired') && !errorMessage.includes('row-level security')) {
        setError(errorMessage);
        toast({
          title: "Loading Issue",
          description: errorMessage,
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Manual refresh function
  const handleManualRefresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    await fetchJobs();
  }, [fetchJobs]);
  const handleAddJob = async () => {
    if (!formData.company_name || !formData.job_title) {
      toast({
        title: "Error",
        description: "Company name and job title are required.",
        variant: "destructive"
      });
      return;
    }
    try {
      // First get the user UUID from users table using clerk_id
      const {
        data: userData,
        error: userError
      } = await supabase.from('users').select('id').eq('clerk_id', user?.id).single();
      if (userError || !userData) {
        console.error('User not found:', userError);
        throw new Error('User not found');
      }

      // Then get user profile using the user UUID
      const {
        data: userProfile,
        error: profileError
      } = await supabase.from('user_profile').select('id').eq('user_id', userData.id).single();
      if (profileError || !userProfile) {
        console.error('User profile not found:', profileError);
        throw new Error('User profile not found');
      }
      const maxOrder = Math.max(...jobs.filter(job => job.status === selectedStatus).map(job => job.order_position), -1);
      const {
        error
      } = await supabase.from('job_tracker').insert({
        user_id: userProfile.id,
        company_name: formData.company_name,
        job_title: formData.job_title,
        job_description: formData.job_description || null,
        job_url: formData.job_url || null,
        status: selectedStatus,
        order_position: maxOrder + 1
      });
      if (error) throw error;
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
      fetchJobs();
    } catch (error) {
      console.error('Error adding job:', error);
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
      fetchJobs();
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
    try {
      const {
        error
      } = await supabase.from('job_tracker').delete().eq('id', jobId);
      if (error) throw error;
      toast({
        title: "Success",
        description: "Job deleted successfully!"
      });
      fetchJobs();
    } catch (error) {
      console.error('Error deleting job:', error);
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
      setJobs(prevJobs => prevJobs.map(job => job.id === activeJobToMove.id ? updatedJob : job));
      try {
        const {
          error
        } = await supabase.from('job_tracker').update({
          status: targetColumn.key as JobEntry['status'],
          order_position: maxOrder + 1
        }).eq('id', activeJobToMove.id);
        if (error) throw error;
        toast({
          title: "Success",
          description: `Job moved to ${targetColumn.title}!`
        });
      } catch (error) {
        console.error('Error moving job:', error);
        // Revert optimistic update on error
        setJobs(prevJobs => prevJobs.map(job => job.id === activeJobToMove.id ? activeJobToMove : job));
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
              
              {/* Refresh Button */}
              
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

            <p className="text-gray-100 font-inter max-w-4xl mx-auto leading-relaxed mb-3 font-extralight text-sm">
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
            }} onDeleteJob={deleteJob} onViewJob={handleViewJob} activeJobId={activeJob?.id} />)}
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
          {selectedJob && <div className="space-y-4">
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
              <Button onClick={handleUpdateJob} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-orbitron">
                Save Changes
              </Button>
            </div>}
        </DialogContent>
      </Dialog>
    </Layout>;
};
export default JobTracker;