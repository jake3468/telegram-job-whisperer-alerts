import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, MapPin, Building2, Clock, ExternalLink, Filter, X } from 'lucide-react';
import { useJobBoardData } from '@/hooks/useJobBoardData';
import { Tables } from '@/integrations/supabase/types';
type JobBoardItem = Tables<'job_board'>;
const JobBoard = () => {
  const {
    jobs,
    loading,
    error
  } = useJobBoardData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJob, setSelectedJob] = useState<JobBoardItem | null>(null);
  const [locationFilter, setLocationFilter] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState('');
  const filteredJobs = jobs?.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) || job.company_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = !locationFilter || job.location?.toLowerCase().includes(locationFilter.toLowerCase());
    const matchesJobType = !jobTypeFilter || job.job_type?.toLowerCase().includes(jobTypeFilter.toLowerCase());
    return matchesSearch && matchesLocation && matchesJobType;
  }) || [];
  const formatSalary = (salary: string | null) => {
    if (!salary) return 'Salary not disclosed';
    return salary;
  };
  if (loading) {
    return <Layout>
        <div className="min-h-screen p-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-white mt-4">Loading job opportunities...</p>
            </div>
          </div>
        </div>
      </Layout>;
  }
  if (error) {
    return <Layout>
        <div className="min-h-screen p-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center py-12">
              <p className="text-red-400">Error loading jobs: {error.message}</p>
            </div>
          </div>
        </div>
      </Layout>;
  }
  return <Layout>
      <div className="min-h-screen p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2 sm:mb-4 font-orbitron">
              Job Board
            </h1>
            <p className="text-gray-300 text-sm sm:text-lg">
              Discover opportunities tailored to your profile
            </p>
          </div>

          {/* Search and Filters */}
          <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-purple-500/20 p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input placeholder="Search jobs..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 bg-gray-800/50 border-gray-700 text-white h-9 sm:h-10 text-sm" />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input placeholder="Location..." value={locationFilter} onChange={e => setLocationFilter(e.target.value)} className="pl-10 bg-gray-800/50 border-gray-700 text-white h-9 sm:h-10 text-sm" />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input placeholder="Job type..." value={jobTypeFilter} onChange={e => setJobTypeFilter(e.target.value)} className="pl-10 bg-gray-800/50 border-gray-700 text-white h-9 sm:h-10 text-sm" />
              </div>
              <Button variant="outline" className="border-purple-500/50 text-black bg-slate-50 h-9 sm:h-10 text-sm">
                Apply Filters
              </Button>
            </div>
          </div>

          {/* Job Results */}
          <div className="mb-4">
            <p className="text-gray-300">
              {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found
            </p>
          </div>

          {/* Jobs List */}
          <div className="space-y-3">
            {filteredJobs.map(job => <div key={job.id} className="w-full bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-all cursor-pointer overflow-hidden" onClick={() => setSelectedJob(job)}>
                <div className="p-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    {/* Company info and logo */}
                   <div className="flex items-center gap-2 flex-1 min-w-0">
                     {job.thumbnail ? <img src={job.thumbnail} alt={`${job.company_name} logo`} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" /> : <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Building2 className="h-4 w-4 text-gray-600" />
                        </div>}
                      
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
                      <Button onClick={e => {
                        e.stopPropagation();
                        setSelectedJob(job);
                      }} variant="outline" size="sm" className="border-gray-300 text-gray-900 hover:bg-gray-50 text-xs px-2 py-1 h-6">
                        View
                      </Button>
                      <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700 text-xs px-2 py-1 h-6 whitespace-nowrap">
                        Save to Tracker
                      </Button>
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
              </div>)}
          </div>

          {filteredJobs.length === 0 && <div className="text-center py-12">
              <p className="text-gray-400 text-lg">No jobs found matching your criteria.</p>
              <p className="text-gray-500 mt-2">Try adjusting your search filters.</p>
            </div>}
        </div>

        {/* Job Details Modal */}
        <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
          <DialogContent className="max-w-3xl max-h-[85vh] bg-white border-gray-200 flex flex-col p-0">
            {selectedJob && <>
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
                    <Button className="w-full bg-blue-600 text-white hover:bg-blue-700 text-sm h-10">
                      Save to Job Tracker
                    </Button>
                  </div>
                </div>
              </>}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>;
};
export default JobBoard;