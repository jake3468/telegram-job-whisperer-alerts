import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Clock, DollarSign, Building2, Search, X } from 'lucide-react';
import { useJobBoardData } from '@/hooks/useJobBoardData';
import { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

type JobBoardItem = Tables<'job_board'>;

export const JobBoard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJob, setSelectedJob] = useState<JobBoardItem | null>(null);
  const [activeTab, setActiveTab] = useState('posted_today');
  const { postedTodayJobs, last7DaysJobs, savedJobs, loading, error } = useJobBoardData();

  // Filter jobs based on search term
  const filterJobs = (jobs: JobBoardItem[]) => {
    return jobs.filter(job => {
      const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           job.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (job.job_description && job.job_description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return matchesSearch;
    });
  };

  const filteredPostedTodayJobs = filterJobs(postedTodayJobs);
  const filteredLast7DaysJobs = filterJobs(last7DaysJobs);
  const filteredSavedJobs = filterJobs(savedJobs);

  const formatSalary = (salary: string | null): string => {
    if (!salary) return 'Salary not disclosed';
    return salary;
  };

  const handleSaveToTracker = async (job: JobBoardItem) => {
    try {
      // Get current user profile
      const { data: profile } = await supabase
        .from('user_profile')
        .select('id')
        .single();

      if (!profile) {
        toast.error('Please log in to save jobs');
        return;
      }

      const { error } = await supabase
        .from('job_tracker')
        .insert({
          user_id: profile.id,
          job_title: job.title,
          company_name: job.company_name,
          job_description: job.job_description,
          status: 'saved'
        });

      if (error) throw error;

      toast.success('Job saved to tracker!');
      setSelectedJob(null);
    } catch (error) {
      console.error('Error saving job:', error);
      toast.error('Failed to save job to tracker');
    }
  };

  const JobCard = ({ job }: { job: JobBoardItem }) => (
    <Card className="hover:shadow-md transition-shadow duration-200 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            {job.thumbnail && (
              <img 
                src={job.thumbnail} 
                alt={`${job.company_name} logo`}
                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg line-clamp-2 leading-tight mb-1">
                {job.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground font-medium">
                {job.company_name}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-2 mb-4">
          {job.location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{job.location}</span>
            </div>
          )}
          
          {job.salary && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{formatSalary(job.salary)}</span>
            </div>
          )}
          
          <div className="flex items-center justify-between gap-2">
            {job.job_type && (
              <Badge variant="secondary" className="text-xs">
                {job.job_type}
              </Badge>
            )}
            
            {job.posted_at && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{job.posted_at}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setSelectedJob(job)}
            className="flex-1"
          >
            View
          </Button>
          <Button 
            size="sm" 
            onClick={() => handleSaveToTracker(job)}
            className="flex-1"
          >
            Save to Tracker
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const JobSection = ({ jobs, emptyMessage }: { jobs: JobBoardItem[], emptyMessage: string }) => (
    <div className="space-y-4">
      {jobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Jobs Found</h3>
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Loading job opportunities...</h2>
          <p className="text-muted-foreground">Please wait while we fetch the latest jobs for you.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2 text-destructive">Error Loading Jobs</h2>
          <p className="text-muted-foreground mb-4">{error.message}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 md:p-6 overflow-hidden">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Job Board</h1>
          <p className="text-muted-foreground">
            Discover exciting job opportunities curated just for you
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search jobs, companies, or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs for different sections */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="posted_today" className="text-sm">
              Posted Today ({filteredPostedTodayJobs.length})
            </TabsTrigger>
            <TabsTrigger value="last_7_days" className="text-sm">
              Last 7 Days ({filteredLast7DaysJobs.length})
            </TabsTrigger>
            <TabsTrigger value="saved_jobs" className="text-sm">
              Jobs Saved to Tracker ({filteredSavedJobs.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posted_today" className="mt-6">
            <JobSection 
              jobs={filteredPostedTodayJobs}
              emptyMessage={searchTerm 
                ? "No jobs posted today match your search terms." 
                : "No jobs were posted today. Check the other sections!"
              }
            />
          </TabsContent>

          <TabsContent value="last_7_days" className="mt-6">
            <JobSection 
              jobs={filteredLast7DaysJobs}
              emptyMessage={searchTerm 
                ? "No jobs from the last 7 days match your search terms." 
                : "No jobs from the last 7 days. Check back later!"
              }
            />
          </TabsContent>

          <TabsContent value="saved_jobs" className="mt-6">
            <JobSection 
              jobs={filteredSavedJobs}
              emptyMessage={searchTerm 
                ? "No saved jobs match your search terms." 
                : "You haven't saved any jobs to your tracker yet. Save some jobs to see them here!"
              }
            />
          </TabsContent>
        </Tabs>

        {/* Job Details Modal */}
        {selectedJob && (
          <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
              {/* Fixed Header */}
              <div className="sticky top-0 z-10 bg-background border-b p-6">
                <DialogHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                      {selectedJob.thumbnail && (
                        <img 
                          src={selectedJob.thumbnail} 
                          alt={`${selectedJob.company_name} logo`}
                          className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <DialogTitle className="text-xl font-bold leading-tight pr-8">
                          {selectedJob.title}
                        </DialogTitle>
                        <p className="text-lg text-muted-foreground font-medium mt-1">
                          {selectedJob.company_name}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedJob(null)}
                      className="absolute top-4 right-4"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </DialogHeader>
              </div>

              {/* Scrollable Content */}
              <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
                <div className="p-6">
                  {/* Job Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                    {selectedJob.location && (
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                          <MapPin className="h-3 w-3 text-primary" />
                          Location
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{selectedJob.location}</p>
                      </div>
                    )}
                    
                    {selectedJob.salary && (
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                          <DollarSign className="h-3 w-3 text-green-600" />
                          Salary
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{formatSalary(selectedJob.salary)}</p>
                      </div>
                    )}
                    
                    {selectedJob.job_type && (
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                          <Building2 className="h-3 w-3 text-blue-600" />
                          Job Type
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{selectedJob.job_type}</p>
                      </div>
                    )}
                    
                    {selectedJob.posted_at && (
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                          <Clock className="h-3 w-3 text-orange-600" />
                          Posted
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{selectedJob.posted_at}</p>
                      </div>
                    )}
                  </div>

                  {/* Job Description */}
                  {selectedJob.job_description && (
                    <div className="mb-6">
                      <h3 className="text-base font-semibold mb-3 text-foreground">Job Description</h3>
                      <div className="prose prose-sm max-w-none text-muted-foreground">
                        <p className="whitespace-pre-wrap text-xs leading-relaxed">
                          {selectedJob.job_description}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* External Links */}
                  <div className="space-y-3">
                    {(selectedJob.link_1_title && selectedJob.link_1_link) && (
                      <div>
                        <h4 className="font-medium mb-2 text-sm text-foreground">{selectedJob.link_1_title}</h4>
                        <Button asChild variant="outline" size="sm">
                          <a href={selectedJob.link_1_link} target="_blank" rel="noopener noreferrer">
                            Visit Link
                          </a>
                        </Button>
                      </div>
                    )}
                    
                    {(selectedJob.link_2_title && selectedJob.link_2_link) && (
                      <div>
                        <h4 className="font-medium mb-2 text-sm text-foreground">{selectedJob.link_2_title}</h4>
                        <Button asChild variant="outline" size="sm">
                          <a href={selectedJob.link_2_link} target="_blank" rel="noopener noreferrer">
                            Visit Link
                          </a>
                        </Button>
                      </div>
                    )}
                    
                    {(selectedJob.link_3_title && selectedJob.link_3_link) && (
                      <div>
                        <h4 className="font-medium mb-2 text-sm text-foreground">{selectedJob.link_3_title}</h4>
                        <Button asChild variant="outline" size="sm">
                          <a href={selectedJob.link_3_link} target="_blank" rel="noopener noreferrer">
                            Visit Link
                          </a>
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t mt-6">
                    <Button 
                      onClick={() => handleSaveToTracker(selectedJob)}
                      className="flex-1"
                    >
                      Save to Tracker
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default JobBoard;