import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Edit2, Trash2, ExternalLink, Calendar, Building, MapPin, DollarSign, Loader2, RefreshCw } from 'lucide-react';
import { useCachedJobTracker } from '@/hooks/useCachedJobTracker';
import { useToast } from '@/hooks/use-toast';
import { useFormTokenKeepAlive } from '@/hooks/useFormTokenKeepAlive';

const JOB_STATUSES = [
  { value: 'wishlist', label: 'Wishlist', color: 'bg-gray-500' },
  { value: 'applied', label: 'Applied', color: 'bg-blue-500' },
  { value: 'interviewing', label: 'Interviewing', color: 'bg-yellow-500' },
  { value: 'offer', label: 'Offer', color: 'bg-green-500' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-500' },
];

export default function JobTracker() {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Enhanced token management - same as bio section
  const { updateActivity } = useFormTokenKeepAlive(true);
  
  const [isAddJobDialogOpen, setIsAddJobDialogOpen] = useState(false);
  const [isEditJobDialogOpen, setIsEditJobDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [newJob, setNewJob] = useState({
    title: '',
    company: '',
    location: '',
    salary: '',
    job_url: '',
    description: '',
    status: 'wishlist',
    application_date: '',
    notes: ''
  });

  const {
    jobs,
    isLoading,
    error,
    addJob,
    updateJob,
    deleteJob,
    refreshJobs
  } = useCachedJobTracker();

  // Activity tracking for all user interactions
  const handleInputChange = (field: string, value: string) => {
    updateActivity(); // Track form interactions
    if (editingJob) {
      setEditingJob({ ...editingJob, [field]: value });
    } else {
      setNewJob({ ...newJob, [field]: value });
    }
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    updateActivity(); // Track filter changes
  };

  const handleAddJob = async () => {
    updateActivity(); // Track job creation
    try {
      await addJob(newJob);
      setNewJob({
        title: '',
        company: '',
        location: '',
        salary: '',
        job_url: '',
        description: '',
        status: 'wishlist',
        application_date: '',
        notes: ''
      });
      setIsAddJobDialogOpen(false);
      toast({
        title: "Job Added",
        description: "Job has been added to your tracker.",
      });
    } catch (error) {
      console.error('Add job failed:', error);
      toast({
        title: "Add Failed",
        description: "Failed to add job. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditJob = async () => {
    updateActivity(); // Track job updates
    if (!editingJob) return;
    
    try {
      await updateJob(editingJob.id, editingJob);
      setEditingJob(null);
      setIsEditJobDialogOpen(false);
      toast({
        title: "Job Updated",
        description: "Job details have been updated.",
      });
    } catch (error) {
      console.error('Update job failed:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update job. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    updateActivity(); // Track job deletion
    try {
      await deleteJob(jobId);
      toast({
        title: "Job Deleted",
        description: "Job has been removed from your tracker.",
      });
    } catch (error) {
      console.error('Delete job failed:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete job. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (jobId: string, newStatus: string) => {
    updateActivity(); // Track status changes
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;
    
    try {
      await updateJob(jobId, { ...job, status: newStatus });
      toast({
        title: "Status Updated",
        description: `Job status changed to ${JOB_STATUSES.find(s => s.value === newStatus)?.label || newStatus}.`,
      });
    } catch (error) {
      console.error('Status update failed:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update job status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = async () => {
    updateActivity(); // Track refresh action
    try {
      await refreshJobs();
      toast({
        title: "Jobs Refreshed",
        description: "Job tracker has been updated.",
      });
    } catch (error) {
      console.error('Refresh failed:', error);
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh jobs. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (job: any) => {
    updateActivity(); // Track edit action
    setEditingJob({ ...job });
    setIsEditJobDialogOpen(true);
  };

  const handleJobUrlClick = (url: string) => {
    updateActivity(); // Track external link clicks
    if (url) {
      window.open(url.startsWith('http') ? url : `https://${url}`, '_blank');
    }
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (isLoaded && !user) {
      navigate('/');
    }
  }, [user, isLoaded, navigate]);

  if (!isLoaded || !user) {
    return <Layout><div className="flex items-center justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div></Layout>;
  }

  const filteredJobs = statusFilter === 'all' 
    ? jobs 
    : jobs.filter(job => job.status === statusFilter);

  const jobsByStatus = JOB_STATUSES.reduce((acc, status) => {
    acc[status.value] = jobs.filter(job => job.status === status.value);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white">Job Tracker</h1>
          <div className="flex items-center gap-3">
            <Button onClick={handleRefresh} variant="outline" disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Dialog open={isAddJobDialogOpen} onOpenChange={setIsAddJobDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Job
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-gray-800 border-gray-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Add New Job</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title" className="text-white">Job Title *</Label>
                      <Input
                        id="title"
                        value={newJob.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        placeholder="Software Engineer"
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="company" className="text-white">Company *</Label>
                      <Input
                        id="company"
                        value={newJob.company}
                        onChange={(e) => handleInputChange('company', e.target.value)}
                        placeholder="Google"
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="location" className="text-white">Location</Label>
                      <Input
                        id="location"
                        value={newJob.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        placeholder="San Francisco, CA"
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="salary" className="text-white">Salary</Label>
                      <Input
                        id="salary"
                        value={newJob.salary}
                        onChange={(e) => handleInputChange('salary', e.target.value)}
                        placeholder="$120,000 - $150,000"
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="job_url" className="text-white">Job URL</Label>
                    <Input
                      id="job_url"
                      value={newJob.job_url}
                      onChange={(e) => handleInputChange('job_url', e.target.value)}
                      placeholder="https://company.com/jobs/123"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="status" className="text-white">Status</Label>
                      <Select value={newJob.status} onValueChange={(value) => handleInputChange('status', value)}>
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-700 border-gray-600">
                          {JOB_STATUSES.map((status) => (
                            <SelectItem key={status.value} value={status.value} className="text-white">
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="application_date" className="text-white">Application Date</Label>
                      <Input
                        id="application_date"
                        type="date"
                        value={newJob.application_date}
                        onChange={(e) => handleInputChange('application_date', e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description" className="text-white">Description</Label>
                    <Textarea
                      id="description"
                      value={newJob.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Job description and requirements..."
                      className="bg-gray-700 border-gray-600 text-white min-h-[100px]"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="notes" className="text-white">Notes</Label>
                    <Textarea
                      id="notes"
                      value={newJob.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="Personal notes about this job..."
                      className="bg-gray-700 border-gray-600 text-white"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setIsAddJobDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddJob} disabled={!newJob.title || !newJob.company}>
                    Add Job
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Status Filter */}
        <div className="mb-6">
          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-48 bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="all" className="text-white">All Jobs ({jobs.length})</SelectItem>
              {JOB_STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value} className="text-white">
                  {status.label} ({jobsByStatus[status.value]?.length || 0})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Jobs List */}
        {error && (
          <div className="mb-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-300">
            Error loading jobs: {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            <span className="ml-3 text-blue-200">Loading your job tracker...</span>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            {statusFilter === 'all' 
              ? "No jobs in your tracker yet. Add your first job to get started!"
              : `No jobs with status "${JOB_STATUSES.find(s => s.value === statusFilter)?.label}".`
            }
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredJobs.map((job) => {
              const status = JOB_STATUSES.find(s => s.value === job.status);
              return (
                <Card key={job.id} className="bg-gray-800 border-gray-700 hover:bg-gray-700 transition-colors">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-white">{job.title}</CardTitle>
                          <Badge className={`${status?.color} text-white`}>
                            {status?.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-gray-400 text-sm">
                          <div className="flex items-center gap-1">
                            <Building className="h-4 w-4" />
                            {job.company}
                          </div>
                          {job.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {job.location}
                            </div>
                          )}
                          {job.salary && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              {job.salary}
                            </div>
                          )}
                          {job.application_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Applied: {new Date(job.application_date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select value={job.status} onValueChange={(value) => handleStatusChange(job.id, value)}>
                          <SelectTrigger className="w-32 bg-gray-700 border-gray-600 text-white text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-700 border-gray-600">
                            {JOB_STATUSES.map((status) => (
                              <SelectItem key={status.value} value={status.value} className="text-white text-xs">
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {job.job_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleJobUrlClick(job.job_url)}
                            className="text-gray-400 hover:text-blue-400"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(job)}
                          className="text-gray-400 hover:text-blue-400"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteJob(job.id)}
                          className="text-gray-400 hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {(job.description || job.notes) && (
                    <CardContent className="pt-0">
                      {job.description && (
                        <p className="text-gray-300 text-sm mb-2 line-clamp-2">
                          {job.description}
                        </p>
                      )}
                      {job.notes && (
                        <div className="bg-gray-700 p-3 rounded-lg">
                          <p className="text-gray-300 text-sm">
                            <strong>Notes:</strong> {job.notes}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {/* Edit Job Dialog */}
        <Dialog open={isEditJobDialogOpen} onOpenChange={setIsEditJobDialogOpen}>
          <DialogContent className="max-w-2xl bg-gray-800 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Job</DialogTitle>
            </DialogHeader>
            {editingJob && (
              <div className="grid gap-4 py-4">
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-title" className="text-white">Job Title *</Label>
                    <Input
                      id="edit-title"
                      value={editingJob.title || ''}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-company" className="text-white">Company *</Label>
                    <Input
                      id="edit-company"
                      value={editingJob.company || ''}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-location" className="text-white">Location</Label>
                    <Input
                      id="edit-location"
                      value={editingJob.location || ''}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-salary" className="text-white">Salary</Label>
                    <Input
                      id="edit-salary"
                      value={editingJob.salary || ''}
                      onChange={(e) => handleInputChange('salary', e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="edit-job_url" className="text-white">Job URL</Label>
                  <Input
                    id="edit-job_url"
                    value={editingJob.job_url || ''}
                    onChange={(e) => handleInputChange('job_url', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-status" className="text-white">Status</Label>
                    <Select value={editingJob.status} onValueChange={(value) => handleInputChange('status', value)}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        {JOB_STATUSES.map((status) => (
                          <SelectItem key={status.value} value={status.value} className="text-white">
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-application_date" className="text-white">Application Date</Label>
                    <Input
                      id="edit-application_date"
                      type="date"
                      value={editingJob.application_date || ''}
                      onChange={(e) => handleInputChange('application_date', e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="edit-description" className="text-white">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editingJob.description || ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white min-h-[100px]"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-notes" className="text-white">Notes</Label>
                  <Textarea
                    id="edit-notes"
                    value={editingJob.notes || ''}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>
            )}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsEditJobDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditJob} disabled={!editingJob?.title || !editingJob?.company}>
                Update Job
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
