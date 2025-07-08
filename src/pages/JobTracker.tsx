import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, ArrowLeft, ArrowRight, ExternalLink, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
interface JobEntry {
  id: string;
  company_name: string;
  job_title: string;
  job_description?: string;
  job_url?: string;
  status: 'saved' | 'applied' | 'interview' | 'rejected' | 'offer';
  order_position: number;
}
interface AddJobFormData {
  company_name: string;
  job_title: string;
  job_description: string;
  job_url: string;
}
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<'saved' | 'applied' | 'interview'>('saved');
  const [formData, setFormData] = useState<AddJobFormData>({
    company_name: '',
    job_title: '',
    job_description: '',
    job_url: ''
  });
  const columns = [{
    key: 'saved',
    title: 'Saved',
    canAdd: true,
    color: 'bg-slate-700'
  }, {
    key: 'applied',
    title: 'Applied',
    canAdd: true,
    color: 'bg-blue-700'
  }, {
    key: 'interview',
    title: 'Interview',
    canAdd: true,
    color: 'bg-orange-700'
  }, {
    key: 'rejected',
    title: 'Rejected',
    canAdd: false,
    color: 'bg-red-700'
  }, {
    key: 'offer',
    title: 'Offer',
    canAdd: false,
    color: 'bg-green-700'
  }];
  useEffect(() => {
    if (isLoaded && !user) {
      navigate('/');
    }
  }, [user, isLoaded, navigate]);
  useEffect(() => {
    if (user) {
      fetchJobs();
    }
  }, [user]);
  const fetchJobs = async () => {
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
  };
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
  const moveJob = async (jobId: string, direction: 'left' | 'right') => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;
    const statusOrder = ['saved', 'applied', 'interview', 'rejected', 'offer'];
    const currentIndex = statusOrder.indexOf(job.status);
    const newIndex = direction === 'right' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex < 0 || newIndex >= statusOrder.length) return;
    const newStatus = statusOrder[newIndex] as JobEntry['status'];
    const maxOrder = Math.max(...jobs.filter(j => j.status === newStatus).map(j => j.order_position), -1);
    try {
      const {
        error
      } = await supabase.from('job_tracker').update({
        status: newStatus,
        order_position: maxOrder + 1
      }).eq('id', jobId);
      if (error) throw error;
      fetchJobs();
    } catch (error) {
      console.error('Error moving job:', error);
      toast({
        title: "Error",
        description: "Failed to move job.",
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
  const getJobsByStatus = (status: string) => {
    return jobs.filter(job => job.status === status);
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
      <div className="mb-8 text-center">
        <h1 className="font-extrabold text-3xl md:text-4xl font-orbitron bg-gradient-to-r from-sky-400 via-fuchsia-400 to-pastel-lavender bg-clip-text text-transparent drop-shadow mb-2">
          Job Tracker
        </h1>
        <p className="text-gray-100 font-inter font-light text-base">Use this page to manage and track your job applications through every stage — from saving listings to receiving offers.
Click “+ Add” under any column to add a job. Use the → and ← arrows to move applications forward or backward as your progress changes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-7xl mx-auto">
        {columns.map((column, columnIndex) => <div key={column.key} className="bg-gray-800/50 rounded-lg p-4 min-h-[500px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-orbitron font-bold text-white text-sm">{column.title}</h3>
              {column.canAdd && <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="ghost" className="text-white hover:bg-white/10 h-8 w-8 p-0" onClick={() => {
                setSelectedStatus(column.key as 'saved' | 'applied' | 'interview');
                setIsModalOpen(true);
              }}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
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
                </Dialog>}
            </div>

            <div className="space-y-3">
              {getJobsByStatus(column.key).map(job => <div key={job.id} className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all group shadow-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-bold text-white text-sm font-orbitron">{job.company_name}</h4>
                      <p className="text-gray-300 text-xs">{job.job_title}</p>
                    </div>
                    <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/20" onClick={() => deleteJob(job.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  {job.job_description && <p className="text-gray-400 text-xs mb-2 line-clamp-2">{job.job_description}</p>}

                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {columnIndex > 0 && <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-gray-600" onClick={() => moveJob(job.id, 'left')}>
                          <ArrowLeft className="h-3 w-3" />
                        </Button>}
                      {columnIndex < columns.length - 1 && <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-gray-600" onClick={() => moveJob(job.id, 'right')}>
                          <ArrowRight className="h-3 w-3" />
                        </Button>}
                    </div>
                    {job.job_url && <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-gray-600" onClick={() => window.open(job.job_url, '_blank')}>
                        <ExternalLink className="h-3 w-3" />
                      </Button>}
                  </div>
                </div>)}
            </div>
          </div>)}
      </div>
    </Layout>;
};
export default JobTracker;