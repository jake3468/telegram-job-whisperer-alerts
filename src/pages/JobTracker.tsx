import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, ExternalLink, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  MouseSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
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
  const { isOver, setNodeRef } = useDroppable({
    id: column.key,
  });

  const isDropTarget = isOver && activeJobId;

  return (
    <div
      ref={setNodeRef}
      className={`${column.bgColor} ${column.borderColor} border-2 rounded-lg min-w-[280px] flex-shrink-0 transition-all hover:shadow-lg ${
        isDropTarget ? 'ring-2 ring-blue-400 ring-opacity-50 bg-opacity-70' : ''
      }`}
    >
      <div className={`${column.headerBg} p-4 rounded-t-lg border-b ${column.borderColor} flex items-center justify-between`}>
        <h3 className={`font-orbitron font-bold text-sm ${column.textColor}`}>
          {column.title} ({jobs.length})
        </h3>
        {column.canAdd && (
          <Button
            size="sm"
            variant="ghost"
            className={`${column.textColor} hover:bg-black/10 h-8 w-8 p-0`}
            onClick={onAddJob}
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className={`p-4 min-h-[450px] ${isDropTarget ? 'bg-black/5' : ''} transition-colors`}>
        <SortableContext
          items={jobs.map(job => job.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {jobs.map(job => (
              <SortableJobCard
                key={job.id}
                job={job}
                onDelete={onDeleteJob}
                onView={onViewJob}
              />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  );
};

// Sortable Job Card Component
const SortableJobCard = ({ job, onDelete, onView }: { 
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
    isDragging,
  } = useSortable({ id: job.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-gray-800 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-all group shadow-lg cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-bold text-white text-sm font-orbitron">{job.company_name}</h4>
          <p className="text-gray-300 text-xs font-medium mb-2">{job.job_title}</p>
          <p className="text-gray-400 text-xs">
            Added: {new Date(job.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-1">
          <Button 
            size="sm" 
            variant="ghost" 
            className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/20" 
            onClick={(e) => {
              e.stopPropagation();
              onDelete(job.id);
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button 
          size="sm" 
          variant="outline" 
          className="text-xs bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white h-7 px-3"
          onClick={(e) => {
            e.stopPropagation();
            onView(job);
          }}
        >
          View
        </Button>
        {job.job_url && (
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-6 w-6 p-0 text-blue-300 hover:text-blue-100 hover:bg-blue-900/20" 
            onClick={(e) => {
              e.stopPropagation();
              window.open(job.job_url, '_blank');
            }}
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
};

const JobTracker = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<JobEntry[]>([]);
  const [loading, setLoading] = useState(true);
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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const columns = [
    { key: 'saved', title: 'Saved', canAdd: true, bgColor: 'bg-blue-50', textColor: 'text-blue-800', borderColor: 'border-blue-200', headerBg: 'bg-blue-100' },
    { key: 'applied', title: 'Applied', canAdd: true, bgColor: 'bg-green-50', textColor: 'text-green-800', borderColor: 'border-green-200', headerBg: 'bg-green-100' },
    { key: 'interview', title: 'Interview', canAdd: true, bgColor: 'bg-yellow-50', textColor: 'text-yellow-800', borderColor: 'border-yellow-200', headerBg: 'bg-yellow-100' },
    { key: 'rejected', title: 'Rejected', canAdd: false, bgColor: 'bg-red-50', textColor: 'text-red-800', borderColor: 'border-red-200', headerBg: 'bg-red-100' },
    { key: 'offer', title: 'Offer', canAdd: false, bgColor: 'bg-emerald-50', textColor: 'text-emerald-800', borderColor: 'border-emerald-200', headerBg: 'bg-emerald-700' }
  ];

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (user) {
      fetchJobs();
      const interval = setInterval(fetchJobs, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    if (isLoaded && !user) {
      navigate('/');
    }
  }, [user, isLoaded, navigate]);

  const fetchJobs = useCallback(async () => {
    if (!user) return;
    
    try {
      // First get the user UUID from users table using clerk_id
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', user?.id)
        .single();

      if (userError || !userData) {
        console.error('User not found:', userError);
        return;
      }

      // Then get user profile using the user UUID
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profile')
        .select('id')
        .eq('user_id', userData.id)
        .single();

      if (profileError || !userProfile) {
        console.error('User profile not found:', profileError);
        return;
      }

      // Finally get jobs for this user profile
      const { data, error } = await supabase
        .from('job_tracker')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('order_position', { ascending: true });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast({
        title: "Error",
        description: "Failed to load job tracker data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

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
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', user?.id)
        .single();

      if (userError || !userData) {
        console.error('User not found:', userError);
        throw new Error('User not found');
      }

      // Then get user profile using the user UUID
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profile')
        .select('id')
        .eq('user_id', userData.id)
        .single();

      if (profileError || !userProfile) {
        console.error('User profile not found:', profileError);
        throw new Error('User profile not found');
      }

      const maxOrder = Math.max(...jobs.filter(job => job.status === selectedStatus).map(job => job.order_position), -1);
      const { error } = await supabase.from('job_tracker').insert({
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
      const { error } = await supabase
        .from('job_tracker')
        .update({
          company_name: editFormData.company_name,
          job_title: editFormData.job_title,
          job_description: editFormData.job_description || null,
          job_url: editFormData.job_url || null,
        })
        .eq('id', selectedJob.id);

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
      const { error } = await supabase.from('job_tracker').delete().eq('id', jobId);
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
    const { active } = event;
    const job = jobs.find(j => j.id === active.id);
    setActiveJob(job || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveJob(null);

    if (!over) return;

    const activeJob = jobs.find(j => j.id === active.id);
    if (!activeJob) return;

    // Check if dropped on a column (over.id will be the column key)
    const targetColumn = columns.find(col => col.key === over.id);
    if (targetColumn && activeJob.status !== targetColumn.key) {
      try {
        const targetJobs = jobs.filter(j => j.status === targetColumn.key);
        const maxOrder = Math.max(...targetJobs.map(j => j.order_position), -1);

        const { error } = await supabase
          .from('job_tracker')
          .update({
            status: targetColumn.key as JobEntry['status'],
            order_position: maxOrder + 1
          })
          .eq('id', activeJob.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: `Job moved to ${targetColumn.title}!`
        });

        fetchJobs();
      } catch (error) {
        console.error('Error moving job:', error);
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-fuchsia-950 flex items-center justify-center">
        <div className="text-white text-xs">Loading...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-white text-xs">Loading job tracker...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Fixed Header - Centered to Page */}
      <div className="mb-8 text-center w-full">
        <h1 className="font-extrabold text-3xl md:text-4xl font-orbitron bg-gradient-to-r from-sky-400 via-fuchsia-400 to-pastel-lavender bg-clip-text text-transparent drop-shadow mb-2">
          Job Tracker
        </h1>
        <p className="text-gray-100 font-inter font-light text-base">
          Drag and drop job applications between columns to track your progress. Click View to see details or add new jobs using the + button.
        </p>
      </div>

      {/* Kanban Cards Container - Separate Horizontal Scroll */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="w-full overflow-x-auto overflow-y-hidden">
          <div className="flex gap-4 pb-4" style={{ width: 'max-content' }}>
            {columns.map((column) => (
              <DroppableColumn
                key={column.key}
                column={column}
                jobs={getJobsByStatus(column.key)}
                onAddJob={() => {
                  setSelectedStatus(column.key as 'saved' | 'applied' | 'interview');
                  setIsModalOpen(true);
                }}
                onDeleteJob={deleteJob}
                onViewJob={handleViewJob}
                activeJobId={activeJob?.id}
              />
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeJob ? (
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-600 shadow-2xl transform rotate-3 min-w-[280px]">
              <h4 className="font-bold text-white text-sm font-orbitron">{activeJob.company_name}</h4>
              <p className="text-gray-300 text-xs">{activeJob.job_title}</p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

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
              <Input
                id="company"
                value={formData.company_name}
                onChange={e => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                className="bg-gray-800 border-gray-600 text-white"
                placeholder="Enter company name"
              />
            </div>
            <div>
              <Label htmlFor="title" className="text-white font-orbitron text-sm">Job Title *</Label>
              <Input
                id="title"
                value={formData.job_title}
                onChange={e => setFormData(prev => ({ ...prev, job_title: e.target.value }))}
                className="bg-gray-800 border-gray-600 text-white"
                placeholder="Enter job title"
              />
            </div>
            <div>
              <Label htmlFor="description" className="text-white font-orbitron text-sm">Job Description</Label>
              <Textarea
                id="description"
                value={formData.job_description}
                onChange={e => setFormData(prev => ({ ...prev, job_description: e.target.value }))}
                className="bg-gray-800 border-gray-600 text-white min-h-[80px]"
                placeholder="Enter job description"
              />
            </div>
            <div>
              <Label htmlFor="url" className="text-white font-orbitron text-sm">Job URL</Label>
              <Input
                id="url"
                value={formData.job_url}
                onChange={e => setFormData(prev => ({ ...prev, job_url: e.target.value }))}
                className="bg-gray-800 border-gray-600 text-white"
                placeholder="https://..."
              />
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
          {selectedJob && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-company" className="text-white font-orbitron text-sm">Company Name *</Label>
                <Input
                  id="edit-company"
                  value={editFormData.company_name}
                  onChange={e => setEditFormData(prev => ({ ...prev, company_name: e.target.value }))}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="Enter company name"
                />
              </div>
              <div>
                <Label htmlFor="edit-title" className="text-white font-orbitron text-sm">Job Title *</Label>
                <Input
                  id="edit-title"
                  value={editFormData.job_title}
                  onChange={e => setEditFormData(prev => ({ ...prev, job_title: e.target.value }))}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="Enter job title"
                />
              </div>
              <div>
                <Label htmlFor="edit-description" className="text-white font-orbitron text-sm">Job Description</Label>
                <Textarea
                  id="edit-description"
                  value={editFormData.job_description}
                  onChange={e => setEditFormData(prev => ({ ...prev, job_description: e.target.value }))}
                  className="bg-gray-800 border-gray-600 text-white min-h-[80px]"
                  placeholder="Enter job description"
                />
              </div>
              <div>
                <Label htmlFor="edit-url" className="text-white font-orbitron text-sm">Job URL</Label>
                <Input
                  id="edit-url"
                  value={editFormData.job_url}
                  onChange={e => setEditFormData(prev => ({ ...prev, job_url: e.target.value }))}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="https://..."
                />
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default JobTracker;