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
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4 font-orbitron">
              Job Board
            </h1>
            <p className="text-gray-300 text-lg">
              Discover opportunities tailored to your profile
            </p>
          </div>

          {/* Search and Filters */}
          <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-purple-500/20 p-4 mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input placeholder="Search jobs or companies..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 bg-gray-800/50 border-gray-700 text-white" />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input placeholder="Location..." value={locationFilter} onChange={e => setLocationFilter(e.target.value)} className="pl-10 bg-gray-800/50 border-gray-700 text-white" />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input placeholder="Job type..." value={jobTypeFilter} onChange={e => setJobTypeFilter(e.target.value)} className="pl-10 bg-gray-800/50 border-gray-700 text-white" />
              </div>
              <Button variant="outline" className="border-purple-500/50 text-black bg-slate-50">
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
            {filteredJobs.map(job => <div key={job.id} className="w-full bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-all cursor-pointer p-3" onClick={() => setSelectedJob(job)}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  {/* Top row - Company info and logo */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {job.thumbnail ? <img src={job.thumbnail} alt={`${job.company_name} logo`} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" /> : <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-4 w-4 text-gray-600" />
                      </div>}
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-gray-900 truncate">{job.title}</h3>
                      <p className="text-xs text-gray-700 font-medium truncate">{job.company_name}</p>
                    </div>
                  </div>
                  
                  {/* Bottom row - Job details and actions */}
                  <div className="flex items-center justify-between gap-2 w-full sm:w-auto sm:flex-shrink-0">
                    <div className="flex items-center gap-1 text-xs text-gray-600 min-w-0 flex-1 sm:flex-initial">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{job.location || 'Remote'}</span>
                      </div>
                      {job.job_type && (
                        <>
                          <span className="mx-1">•</span>
                          <span className="truncate">{job.job_type}</span>
                        </>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button onClick={e => {
                        e.stopPropagation();
                        setSelectedJob(job);
                      }} variant="outline" size="sm" className="border-gray-300 text-gray-900 hover:bg-gray-50 text-xs px-2 py-1 h-6">
                        View
                      </Button>
                      <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700 text-xs px-2 py-1 h-6">
                        Save
                      </Button>
                    </div>
                  </div>
                  
                  {/* Salary row */}
                  <div className="text-green-600 font-semibold text-xs truncate sm:hidden">
                    {formatSalary(job.salary)}
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
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-white border-gray-200">
            {selectedJob && <>
                <DialogHeader className="relative">
                  <Button variant="ghost" size="icon" className="absolute right-0 top-0 text-gray-500 hover:text-gray-700" onClick={() => setSelectedJob(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                  <DialogTitle className="text-gray-900 text-2xl font-bold pr-8">
                    {selectedJob.title}
                  </DialogTitle>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Building2 className="h-5 w-5" />
                    {selectedJob.company_name}
                  </div>
                </DialogHeader>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h3 className="text-gray-900 font-semibold">Location</h3>
                      <p className="text-gray-600">{selectedJob.location || 'Not specified'}</p>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-gray-900 font-semibold">Salary</h3>
                      <p className="text-green-600 font-semibold">{formatSalary(selectedJob.salary)}</p>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-gray-900 font-semibold">Job Type</h3>
                      <p className="text-gray-600">{selectedJob.job_type || 'Not specified'}</p>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-gray-900 font-semibold">Posted</h3>
                      <p className="text-gray-600">{selectedJob.posted_at || 'Recently posted'}</p>
                    </div>
                  </div>

                  {selectedJob.job_description && <div className="space-y-2">
                      <h3 className="text-gray-900 font-semibold">Job Description</h3>
                      <div className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg border">
                        {selectedJob.job_description}
                      </div>
                    </div>}

                  {/* Links */}
                  <div className="space-y-4">
                    <h3 className="text-gray-900 font-semibold">External Links</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {selectedJob.link_1_title && selectedJob.link_1_link && <Button asChild variant="outline" className="justify-start border-gray-300 text-gray-900 hover:bg-gray-50">
                          <a href={selectedJob.link_1_link} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            {selectedJob.link_1_title}
                          </a>
                        </Button>}
                      {selectedJob.link_2_title && selectedJob.link_2_link && <Button asChild variant="outline" className="justify-start border-gray-300 text-gray-900 hover:bg-gray-50">
                          <a href={selectedJob.link_2_link} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            {selectedJob.link_2_title}
                          </a>
                        </Button>}
                      {selectedJob.link_3_title && selectedJob.link_3_link && <Button asChild variant="outline" className="justify-start border-gray-300 text-gray-900 hover:bg-gray-50">
                          <a href={selectedJob.link_3_link} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            {selectedJob.link_3_title}
                          </a>
                        </Button>}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button className="flex-1 bg-blue-600 text-white hover:bg-blue-700">
                      Save to Job Tracker
                    </Button>
                    <Button variant="outline" className="border-gray-300 text-gray-900 hover:bg-gray-50">
                      Share Job
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