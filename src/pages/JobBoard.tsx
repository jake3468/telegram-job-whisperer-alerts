import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, MapPin, Building2, Clock, ExternalLink, Bookmark, Filter } from 'lucide-react';
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
  const formatPostedAt = (postedAt: string | null) => {
    if (!postedAt) return 'Recently posted';
    const date = new Date(postedAt);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };
  if (loading) {
    return <Layout>
        <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-purple-900 p-6">
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
        <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-purple-900 p-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center py-12">
              <p className="text-red-400">Error loading jobs: {error.message}</p>
            </div>
          </div>
        </div>
      </Layout>;
  }
  return <Layout>
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-purple-900 p-6">
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
          <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-purple-500/20 p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

          {/* Jobs Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredJobs.map(job => <Card key={job.id} className="bg-black/40 backdrop-blur-sm border-gray-700 hover:border-purple-500/50 transition-all cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {job.thumbnail && <img src={job.thumbnail} alt={`${job.company_name} logo`} className="w-12 h-12 rounded-lg object-cover bg-gray-800" onError={e => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }} />}
                      <div>
                        <CardTitle className="text-white text-lg font-semibold">
                          {job.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-gray-300 text-sm mt-1">
                          <Building2 className="h-4 w-4" />
                          {job.company_name}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-purple-400">
                      <Bookmark className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 text-sm text-gray-300">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {job.location || 'Location not specified'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatPostedAt(job.posted_at)}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {job.job_type && <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">
                          {job.job_type}
                        </Badge>}
                      {job.via && <Badge variant="outline" className="border-gray-600 text-gray-400">
                          via {job.via}
                        </Badge>}
                    </div>

                    <p className="text-green-400 font-semibold">
                      {formatSalary(job.salary)}
                    </p>

                    {job.job_description && <p className="text-gray-300 text-sm line-clamp-2">
                        {job.job_description.substring(0, 150)}...
                      </p>}

                    <div className="flex gap-2 pt-2">
                      <Button onClick={() => setSelectedJob(job)} variant="outline" className="flex-1 border-purple-500/50 text-white hover:bg-purple-500/20">
                        View Details
                      </Button>
                      <Button className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                        Save to Tracker
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>)}
          </div>

          {filteredJobs.length === 0 && <div className="text-center py-12">
              <p className="text-gray-400 text-lg">No jobs found matching your criteria.</p>
              <p className="text-gray-500 mt-2">Try adjusting your search filters.</p>
            </div>}
        </div>

        {/* Job Details Modal */}
        <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-gray-900 border-gray-700">
            {selectedJob && <>
                <DialogHeader>
                  <DialogTitle className="text-white text-2xl font-bold">
                    {selectedJob.title}
                  </DialogTitle>
                  <div className="flex items-center gap-2 text-gray-300">
                    <Building2 className="h-5 w-5" />
                    {selectedJob.company_name}
                  </div>
                </DialogHeader>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h3 className="text-white font-semibold">Location</h3>
                      <p className="text-gray-300">{selectedJob.location || 'Not specified'}</p>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-white font-semibold">Salary</h3>
                      <p className="text-green-400 font-semibold">{formatSalary(selectedJob.salary)}</p>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-white font-semibold">Job Type</h3>
                      <p className="text-gray-300">{selectedJob.job_type || 'Not specified'}</p>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-white font-semibold">Posted</h3>
                      <p className="text-gray-300">{formatPostedAt(selectedJob.posted_at)}</p>
                    </div>
                  </div>

                  {selectedJob.job_description && <div className="space-y-2">
                      <h3 className="text-white font-semibold">Job Description</h3>
                      <div className="text-gray-300 whitespace-pre-wrap bg-gray-800/50 p-4 rounded-lg">
                        {selectedJob.job_description}
                      </div>
                    </div>}

                  {/* Links */}
                  <div className="space-y-4">
                    <h3 className="text-white font-semibold">External Links</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {selectedJob.link_1_title && selectedJob.link_1_link && <Button asChild variant="outline" className="justify-start border-purple-500/50 text-white hover:bg-purple-500/20">
                          <a href={selectedJob.link_1_link} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            {selectedJob.link_1_title}
                          </a>
                        </Button>}
                      {selectedJob.link_2_title && selectedJob.link_2_link && <Button asChild variant="outline" className="justify-start border-purple-500/50 text-white hover:bg-purple-500/20">
                          <a href={selectedJob.link_2_link} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            {selectedJob.link_2_title}
                          </a>
                        </Button>}
                      {selectedJob.link_3_title && selectedJob.link_3_link && <Button asChild variant="outline" className="justify-start border-purple-500/50 text-white hover:bg-purple-500/20">
                          <a href={selectedJob.link_3_link} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            {selectedJob.link_3_title}
                          </a>
                        </Button>}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                      Save to Job Tracker
                    </Button>
                    <Button variant="outline" className="border-purple-500/50 text-white hover:bg-purple-500/20">
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