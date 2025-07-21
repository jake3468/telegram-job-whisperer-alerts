import { useState, useEffect, useCallback, useMemo } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { DndContext, DragEndEvent, DragOverEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, FileText, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { Layout } from '@/components/Layout';
import { useCachedJobTracker } from '@/hooks/useCachedJobTracker';
import { useCachedUserProfile } from '@/hooks/useCachedUserProfile';
import { useClerkSupabaseSync } from '@/hooks/useClerkSupabaseSync';
import { useFormTokenKeepAlive } from '@/hooks/useFormTokenKeepAlive';
import { JobTrackerOnboardingPopup } from '@/components/JobTrackerOnboardingPopup';
import { SortableJobCard } from '@/components/SortableJobCard';
import { JobEntry } from '@/types/jobTracker';
import { debugLogger } from '@/utils/debugUtils';

const JobTracker = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userProfile } = useCachedUserProfile();
  
  // CRITICAL: Ensure Clerk-Supabase sync runs on this page
  useClerkSupabaseSync();
  
  // Keep tokens fresh and track activity on Job Tracker page
  const { updateActivity } = useFormTokenKeepAlive(true);
  
  const {
    jobs,
    loading,
    error,
    refetch,
    optimisticUpdate,
    optimisticAdd,
    optimisticDelete
  } = useCachedJobTracker();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    job_title: '',
    job_description: '',
    job_url: '',
    comments: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedColumns, setCollapsedColumns] = useState<{ [key: string]: boolean }>({});

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    updateActivity?.();
    
    if (!formData.company_name || !formData.job_title) {
      toast({
        title: "Missing information",
        description: "Please fill in both company name and job title.",
        variant: "destructive"
      });
      return;
    }

    try {
      const newJob: JobEntry = {
        id: crypto.randomUUID(),
        company_name: formData.company_name,
        job_title: formData.job_title,
        job_description: formData.job_description,
        job_url: formData.job_url,
        status: 'saved',
        order_position: 0,
        resume_updated: false,
        job_role_analyzed: false,
        company_researched: false,
        cover_letter_prepared: false,
        ready_to_apply: false,
        interview_call_received: false,
        interview_prep_guide_received: false,
        ai_mock_interview_attempted: false,
        comments: formData.comments,
        file_urls: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      optimisticAdd(newJob);
      setFormData({
        company_name: '',
        job_title: '',
        job_description: '',
        job_url: '',
        comments: ''
      });
      setIsDialogOpen(false);
      toast({
        title: "Job added successfully",
        description: "Your job has been added to the tracker."
      });
    } catch (error) {
      console.error('Error adding job:', error);
      toast({
        title: "Error",
        description: "Failed to add job. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    
    if (!over) return;

    const activeJob = jobs.find(job => job.id === active.id);
    if (!activeJob) return;

    const overId = over.id as string;
    
    // Check if we're dropping on a column
    const columns = ['saved', 'applied', 'interview', 'offer', 'rejected'];
    const targetColumn = columns.find(col => overId.includes(col));
    
    if (targetColumn && activeJob.status !== targetColumn) {
      const updatedJob = { ...activeJob, status: targetColumn as JobEntry['status'] };
      optimisticUpdate(updatedJob);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Handle drag over for visual feedback
  };

  const handleInputChange = (field: string, value: string) => {
    updateActivity?.();
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleToggleColumn = (columnKey: string) => {
    setCollapsedColumns(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey]
    }));
  };

  const filteredJobs = useMemo(() => {
    if (!searchTerm) return jobs;
    
    return jobs.filter(job =>
      job.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.job_title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [jobs, searchTerm]);

  const getJobsByStatus = useCallback((status: string) => {
    const filteredJobs = jobs.filter(job => job.status === status).sort((a, b) => a.order_position - b.order_position);
    
    // Minimal logging - only in development and very rarely
    if (process.env.NODE_ENV === 'development' && Math.random() < 0.01) {
      debugLogger.log(`Jobs for status "${status}":`, filteredJobs.length);
    }
    
    return filteredJobs;
  }, [jobs]);

  const handleViewJob = (job: JobEntry) => {
    updateActivity?.();
    navigate(`/job-tracker/${job.id}`);
  };

  const handleEditJob = (job: JobEntry) => {
    updateActivity?.();
    setFormData({
      company_name: job.company_name,
      job_title: job.job_title,
      job_description: job.job_description || '',
      job_url: job.job_url || '',
      comments: job.comments || ''
    });
    setIsDialogOpen(true);
  };

  const handleDeleteJob = async (jobId: string) => {
    updateActivity?.();
    try {
      optimisticDelete(jobId);
      toast({
        title: "Job deleted",
        description: "The job has been removed from your tracker."
      });
    } catch (error) {
      console.error('Error deleting job:', error);
      toast({
        title: "Error",
        description: "Failed to delete job. Please try again.",
        variant: "destructive"
      });
    }
  };

  const columns = [
    { key: 'saved', title: 'Saved Jobs', color: 'bg-blue-100 border-blue-300' },
    { key: 'applied', title: 'Applied', color: 'bg-yellow-100 border-yellow-300' },
    { key: 'interview', title: 'Interview', color: 'bg-green-100 border-green-300' },
    { key: 'offer', title: 'Offer', color: 'bg-purple-100 border-purple-300' },
    { key: 'rejected', title: 'Rejected', color: 'bg-red-100 border-red-300' }
  ];

  useEffect(() => {
    if (isLoaded && !user) {
      navigate('/');
    }
  }, [user, isLoaded, navigate]);

  // Remove the problematic useEffect that was causing infinite loops
  // The useUserProfile hook will handle initialization automatically

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pastel-mint via-pastel-lavender to-pastel-peach flex items-center justify-center">
        <div className="text-fuchsia-900 text-xs">Loading user...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fuchsia-600 mx-auto mb-4"></div>
            <p className="text-fuchsia-700">Loading your job tracker...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8" onClick={updateActivity} onKeyDown={updateActivity}>
        <div className="text-center">
          <h1 className="text-4xl font-orbitron font-extrabold mb-2 drop-shadow tracking-tight">
            <span className="bg-gradient-to-r from-fuchsia-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Job Tracker
            </span>
          </h1>
          <p className="text-fuchsia-700 font-inter font-light">
            Keep track of your job applications and their progress
          </p>
        </div>

        <JobTrackerOnboardingPopup 
          isOpen={false}
          onClose={() => {}}
          onDontShowAgain={() => {}}
        />

        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={updateActivity}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Job
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-orbitron font-bold bg-gradient-to-r from-fuchsia-600 to-purple-600 bg-clip-text text-transparent">
                  Add New Job
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="company_name">Company Name *</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => handleInputChange('company_name', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="job_title">Job Title *</Label>
                  <Input
                    id="job_title"
                    value={formData.job_title}
                    onChange={(e) => handleInputChange('job_title', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="job_url">Job URL</Label>
                  <Input
                    id="job_url"
                    type="url"
                    value={formData.job_url}
                    onChange={(e) => handleInputChange('job_url', e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label htmlFor="job_description">Job Description</Label>
                  <Textarea
                    id="job_description"
                    value={formData.job_description}
                    onChange={(e) => handleInputChange('job_description', e.target.value)}
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="comments">Comments</Label>
                  <Textarea
                    id="comments"
                    value={formData.comments}
                    onChange={(e) => handleInputChange('comments', e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    Add Job
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <DndContext
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {columns.map((column) => {
              const columnJobs = getJobsByStatus(column.key);
              const isCollapsed = collapsedColumns[column.key];
              
              return (
                <Card key={column.key} className={`${column.color} min-h-[400px]`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold text-gray-800">
                        {column.title}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {columnJobs.length}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleColumn(column.key)}
                          className="p-1 h-6 w-6"
                        >
                          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <Collapsible open={!isCollapsed}>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <SortableContext items={columnJobs.map(job => job.id)} strategy={verticalListSortingStrategy}>
                          <div className="space-y-1">
                            {columnJobs.map((job, index) => {
                              // Minimal logging - only in development and very rarely
                              if (process.env.NODE_ENV === 'development' && Math.random() < 0.005) {
                                debugLogger.log(`Rendering job ${index + 1}/${columnJobs.length} for column ${column.key}:`, {
                                  id: job.id,
                                  company: job.company_name
                                });
                              }
                              
                              return (
                                <SortableJobCard 
                                  key={job.id}
                                  job={job}
                                  onView={handleViewJob}
                                  onEdit={handleEditJob}
                                  onDelete={handleDeleteJob}
                                  onStatusChange={(jobId, status) => {
                                    const job = jobs.find(j => j.id === jobId);
                                    if (job) {
                                      const updatedJob = { ...job, status };
                                      optimisticUpdate(updatedJob);
                                    }
                                  }}
                                  updateActivity={updateActivity}
                                />
                              );
                            })}
                          </div>
                        </SortableContext>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              );
            })}
          </div>
          <DragOverlay>
            {activeId ? (
              <div className="bg-white p-3 rounded-lg shadow-lg border-2 border-fuchsia-400 opacity-90">
                <p className="font-medium text-sm">
                  {jobs.find(job => job.id === activeId)?.company_name}
                </p>
                <p className="text-xs text-gray-600">
                  {jobs.find(job => job.id === activeId)?.job_title}
                </p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </Layout>
  );
};

export default JobTracker;
