import { useState, useMemo, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Layout } from '@/components/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, MapPin, Building2, ExternalLink, X, RefreshCw } from 'lucide-react';
import { useJobBoardData } from '@/hooks/useJobBoardData';
import { Tables } from '@/integrations/supabase/types';

type JobBoardItem = Tables<'job_board'>;

interface JobCardProps {
  job: JobBoardItem;
  onView: () => void;
  onSaveToTracker: () => void;
  showSaved?: boolean;
}

const JobCard = ({ job, onView, onSaveToTracker, showSaved = false }: JobCardProps) => {
  const formatSalary = (salary: string | null) => {
    if (!salary) return 'Salary not disclosed';
    return salary;
  };

  return (
    <div className="w-full max-w-full bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-all cursor-pointer overflow-hidden" onClick={onView}>
      <div className="p-3 max-w-full">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 max-w-full">
          {/* Company info and logo */}
          <div className="flex items-center gap-2 flex-1 min-w-0 max-w-full">
            {job.thumbnail ? (
              <img src={job.thumbnail} alt={`${job.company_name} logo`} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
            ) : (
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Building2 className="h-4 w-4 text-gray-600" />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-gray-900 truncate">{job.title}</h3>
              <p className="text-xs text-gray-700 font-medium truncate">{job.company_name}</p>
              
              {/* Desktop: Location, job type, and posted time */}
              <div className="hidden sm:flex items-center gap-2 mt-1 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{job.location || 'Remote'}</span>
                </div>
                {job.job_type && (
                  <>
                    <span>•</span>
                    <span className="truncate">{job.job_type}</span>
                  </>
                )}
                {job.posted_at && (
                  <>
                    <span>•</span>
                    <span className="truncate">{job.posted_at}</span>
                  </>
                )}
              </div>
            </div>
            
            {/* Desktop: Salary */}
            <div className="hidden sm:block text-green-600 font-semibold text-sm whitespace-nowrap mr-2">
              {formatSalary(job.salary)}
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0 sm:ml-4">
            <Button 
              onClick={(e) => {
                e.stopPropagation();
                onView();
              }} 
              variant="outline" 
              size="sm" 
              className="border-gray-300 text-gray-900 hover:bg-gray-50 text-xs px-2 py-1 h-6"
            >
              View
            </Button>
            {!showSaved && (
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  onSaveToTracker();
                }}
                size="sm" 
                className="bg-blue-600 text-white hover:bg-blue-700 text-xs px-2 py-1 h-6 whitespace-nowrap"
              >
                Save to Tracker
              </Button>
            )}
            {showSaved && (
              <div className="text-xs text-green-600 font-medium px-2 py-1">
                Saved
              </div>
            )}
          </div>
        </div>
        
        {/* Mobile: Location, job type, posted_at and salary */}
        <div className="sm:hidden mt-2 space-y-1">
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{job.location || 'Remote'}</span>
            {job.job_type && (
              <>
                <span className="mx-1">•</span>
                <span className="truncate">{job.job_type}</span>
              </>
            )}
            {job.posted_at && (
              <>
                <span className="mx-1">•</span>
                <span className="truncate">{job.posted_at}</span>
              </>
            )}
          </div>
          <div className="text-green-600 font-semibold text-xs">
            {formatSalary(job.salary)}
          </div>
        </div>
      </div>
    </div>
  );
};

const JobBoard = () => {
  const { user, isLoaded } = useUser(); // Add Clerk authentication
  const {
    postedTodayJobs,
    last7DaysJobs,
    savedToTrackerJobs,
    loading,
    error,
    saveToTracker,
    forceRefresh
  } = useJobBoardData();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJob, setSelectedJob] = useState<JobBoardItem | null>(null);

  // Show loading while Clerk is loading
  if (!isLoaded) {
    return (
      <Layout>
        <div className="p-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-white mt-4">Loading...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const filterJobsBySearch = useCallback((jobs: JobBoardItem[]) => {
    if (!searchTerm.trim()) return jobs;
    const searchLower = searchTerm.toLowerCase().trim();
    return jobs.filter(job => 
      job.title.toLowerCase().includes(searchLower) || 
      job.company_name.toLowerCase().includes(searchLower)
    );
  }, [searchTerm]);

  const filteredPostedTodayJobs = useMemo(() => filterJobsBySearch(postedTodayJobs), [filterJobsBySearch, postedTodayJobs]);
  const filteredLast7DaysJobs = useMemo(() => filterJobsBySearch(last7DaysJobs), [filterJobsBySearch, last7DaysJobs]);
  const filteredSavedToTrackerJobs = useMemo(() => filterJobsBySearch(savedToTrackerJobs), [filterJobsBySearch, savedToTrackerJobs]);

  const formatSalary = (salary: string | null) => {
    if (!salary) return 'Salary not disclosed';
    return salary;
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-white mt-4">Loading job opportunities...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Show normal layout with error indicator and refresh button in header

  return (
    <Layout>
      <div className="p-3 sm:p-6 w-full overflow-hidden">
        <div className="max-w-6xl mx-auto w-full overflow-hidden">
          {/* Header */}
          <div className="text-center mb-4 sm:mb-6">
            <div className="flex items-center justify-center gap-4 mb-2 sm:mb-4">
              <h1 className="text-2xl sm:text-4xl font-bold text-white font-orbitron">
                Job Board
              </h1>
              {/* Only show refresh button when there's an error */}
              {error && (
                <Button 
                  onClick={forceRefresh}
                  disabled={loading}
                  variant="ghost" 
                  size="sm" 
                  className="text-gray-400 hover:text-white hover:bg-gray-800/50 h-8 w-8 p-0" 
                  title="Refresh jobs data"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              )}
            </div>
            <p className="text-gray-300 text-sm sm:text-lg">
              Discover opportunities tailored to your profile
            </p>
            {/* Error indicator */}
            {error && (
              <div className="bg-red-900/50 border border-red-600 rounded-lg p-3 mt-4 mx-auto max-w-2xl">
                <div className="flex items-center gap-2 text-red-200 justify-center">
                  <span className="text-sm">Unable to load job opportunities. Click refresh to retry.</span>
                </div>
              </div>
            )}
          </div>

          {/* Job Sections */}
          <Tabs defaultValue="posted-today" className="w-full overflow-hidden">
            <TabsList className="grid w-full grid-cols-3 mb-6 overflow-hidden bg-white/10 backdrop-blur-sm gap-1 h-auto p-1 border-0 rounded-xl">
              <TabsTrigger 
                value="posted-today" 
                className="text-xs sm:text-sm px-3 sm:px-4 py-3 rounded-lg overflow-hidden bg-transparent text-gray-300 hover:bg-white/10 hover:text-white transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium"
              >
                <span className="hidden sm:inline truncate">Posted Today</span>
                <span className="sm:hidden truncate">Today</span>
                <span className="ml-1 flex-shrink-0">({filteredPostedTodayJobs.length})</span>
              </TabsTrigger>
              <TabsTrigger 
                value="last-7-days" 
                className="text-xs sm:text-sm px-3 sm:px-4 py-3 rounded-lg overflow-hidden bg-transparent text-gray-300 hover:bg-white/10 hover:text-white transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium"
              >
                <span className="hidden sm:inline truncate">Last 7 Days</span>
                <span className="sm:hidden truncate">Week</span>
                <span className="ml-1 flex-shrink-0">({filteredLast7DaysJobs.length})</span>
              </TabsTrigger>
              <TabsTrigger 
                value="saved-to-tracker" 
                className="text-xs sm:text-sm px-3 sm:px-4 py-3 rounded-lg overflow-hidden bg-transparent text-gray-300 hover:bg-white/10 hover:text-white transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium"
              >
                <span className="hidden sm:inline truncate">Saved</span>
                <span className="sm:hidden truncate">Saved</span>
                <span className="ml-1 flex-shrink-0">({filteredSavedToTrackerJobs.length})</span>
              </TabsTrigger>
            </TabsList>

            {/* Search */}
            <div className="mb-6 w-full">
              <div className="relative w-full max-w-md mx-auto">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-300 text-lg">
                  🔍
                </div>
                <Input 
                  placeholder="Search by job title or company name..." 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                  className="pl-12 pr-4 bg-gray-800 border border-gray-600 text-white placeholder:text-gray-400 h-12 text-sm w-full rounded-2xl shadow-sm focus:border-gray-500 focus:ring-2 focus:ring-gray-600 transition-all" 
                />
              </div>
            </div>

            <TabsContent value="posted-today" className="space-y-3 mt-4 w-full overflow-hidden">
              {filteredPostedTodayJobs.length === 0 ? (
                <div className="text-center py-12 w-full">
                  <p className="text-gray-400 text-lg">
                    {searchTerm ? `No jobs matching "${searchTerm}" found in posted today.` : "No jobs posted today."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 w-full overflow-hidden">
                  {filteredPostedTodayJobs.map(job => (
                    <JobCard 
                      key={job.id} 
                      job={job} 
                      onView={() => setSelectedJob(job)} 
                      onSaveToTracker={() => saveToTracker(job)} 
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="last-7-days" className="space-y-3 mt-4 w-full overflow-hidden">
              {filteredLast7DaysJobs.length === 0 ? (
                <div className="text-center py-12 w-full">
                  <p className="text-gray-400 text-lg">
                    {searchTerm ? `No jobs matching "${searchTerm}" found in last 7 days.` : "No jobs from the last 7 days."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 w-full overflow-hidden">
                  {filteredLast7DaysJobs.map(job => (
                    <JobCard 
                      key={job.id} 
                      job={job} 
                      onView={() => setSelectedJob(job)} 
                      onSaveToTracker={() => saveToTracker(job)} 
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="saved-to-tracker" className="space-y-3 mt-4 w-full overflow-hidden">
              {filteredSavedToTrackerJobs.length === 0 ? (
                <div className="text-center py-12 w-full">
                  <p className="text-gray-400 text-lg">
                    {searchTerm ? `No saved jobs matching "${searchTerm}" found.` : "No jobs saved to tracker yet."}
                  </p>
                  {!searchTerm && <p className="text-gray-500 mt-2">Save jobs from other sections to see them here.</p>}
                </div>
              ) : (
                <div className="space-y-3 w-full overflow-hidden">
                  {filteredSavedToTrackerJobs.map(job => (
                    <JobCard 
                      key={job.id} 
                      job={job} 
                      onView={() => setSelectedJob(job)} 
                      onSaveToTracker={() => saveToTracker(job)} 
                      showSaved 
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Job Details Modal */}
        <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
          <DialogContent className="max-w-3xl max-h-[85vh] bg-white border-gray-200 flex flex-col p-0">
            {selectedJob && (
              <>
                {/* Fixed Header */}
                <DialogHeader className="flex-shrink-0 bg-white border-b px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <DialogTitle className="text-gray-900 text-xl font-bold mb-2 pr-8">
                        {selectedJob.title}
                      </DialogTitle>
                      <div className="flex items-center gap-2 text-blue-600">
                        <Building2 className="h-4 w-4" />
                        <span className="font-medium">{selectedJob.company_name}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700 flex-shrink-0" onClick={() => setSelectedJob(null)}>
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </DialogHeader>
                
                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                  {/* Compact Info Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-blue-50 p-2.5 rounded-md">
                      <h3 className="text-blue-800 font-medium text-xs mb-1">Location</h3>
                      <p className="text-gray-700 text-xs">{selectedJob.location || 'Not specified'}</p>
                    </div>
                    <div className="bg-green-50 p-2.5 rounded-md">
                      <h3 className="text-green-800 font-medium text-xs mb-1">Salary</h3>
                      <p className="text-green-700 font-medium text-xs">{formatSalary(selectedJob.salary)}</p>
                    </div>
                    <div className="bg-purple-50 p-2.5 rounded-md">
                      <h3 className="text-purple-800 font-medium text-xs mb-1">Job Type</h3>
                      <p className="text-gray-700 text-xs">{selectedJob.job_type || 'Not specified'}</p>
                    </div>
                    <div className="bg-orange-50 p-2.5 rounded-md">
                      <h3 className="text-orange-800 font-medium text-xs mb-1">Posted</h3>
                      <p className="text-gray-700 text-xs">{selectedJob.posted_at || 'Recently posted'}</p>
                    </div>
                  </div>

                  {/* Job Description */}
                  {selectedJob.job_description && (
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <h3 className="text-gray-900 font-medium text-sm mb-3">Job Description</h3>
                      <div className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
                        {selectedJob.job_description}
                      </div>
                    </div>
                  )}

                  {/* External Links */}
                  {(selectedJob.link_1_title || selectedJob.link_2_title || selectedJob.link_3_title) && (
                    <div className="bg-slate-50 p-4 rounded-lg mb-4">
                      <h3 className="text-gray-900 font-medium text-sm mb-3">External Links</h3>
                      <div className="space-y-2">
                        {selectedJob.link_1_title && selectedJob.link_1_link && (
                          <Button asChild variant="outline" size="sm" className="justify-start border-blue-200 text-blue-700 hover:bg-blue-50 w-full text-xs h-8">
                            <a href={selectedJob.link_1_link} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3 mr-2" />
                              {selectedJob.link_1_title}
                            </a>
                          </Button>
                        )}
                        {selectedJob.link_2_title && selectedJob.link_2_link && (
                          <Button asChild variant="outline" size="sm" className="justify-start border-blue-200 text-blue-700 hover:bg-blue-50 w-full text-xs h-8">
                            <a href={selectedJob.link_2_link} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3 mr-2" />
                              {selectedJob.link_2_title}
                            </a>
                          </Button>
                        )}
                        {selectedJob.link_3_title && selectedJob.link_3_link && (
                          <Button asChild variant="outline" size="sm" className="justify-start border-blue-200 text-blue-700 hover:bg-blue-50 w-full text-xs h-8">
                            <a href={selectedJob.link_3_link} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3 mr-2" />
                              {selectedJob.link_3_title}
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Save Button */}
                  <div className="pt-2">
                    <Button 
                      onClick={() => selectedJob && saveToTracker(selectedJob)}
                      className="w-full bg-blue-600 text-white hover:bg-blue-700 text-sm h-10"
                    >
                      Save to Job Tracker
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default JobBoard;