
import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bookmark, BookmarkCheck, ExternalLink, Search, MapPin, Building, Calendar, Loader2, RefreshCw } from 'lucide-react';
import { useJobBoardData } from '@/hooks/useJobBoardData';
import { useToast } from '@/hooks/use-toast';
import { useFormTokenKeepAlive } from '@/hooks/useFormTokenKeepAlive';

export default function JobBoard() {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Enhanced token management - same as bio section
  const { updateActivity } = useFormTokenKeepAlive(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  
  const {
    jobs,
    savedJobs,
    isLoading,
    error,
    refreshJobs,
    saveJob,
    unsaveJob,
    isJobSaved,
    searchJobs
  } = useJobBoardData();

  // Activity tracking for all user interactions
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    updateActivity(); // Track search activity
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocationFilter(e.target.value);
    updateActivity(); // Track filter activity
  };

  const handleTabChange = (value: string) => {
    setSelectedTab(value);
    updateActivity(); // Track tab navigation
  };

  const handleSearch = async () => {
    updateActivity(); // Track search action
    try {
      await searchJobs(searchQuery, locationFilter);
      toast({
        title: "Search Updated",
        description: "Job listings have been refreshed with your search criteria.",
      });
    } catch (error) {
      console.error('Search failed:', error);
      toast({
        title: "Search Failed",
        description: "Failed to search jobs. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveJob = async (jobId: string) => {
    updateActivity(); // Track save action
    try {
      if (isJobSaved(jobId)) {
        await unsaveJob(jobId);
        toast({
          title: "Job Removed",
          description: "Job has been removed from your saved jobs.",
        });
      } else {
        await saveJob(jobId);
        toast({
          title: "Job Saved",
          description: "Job has been added to your saved jobs.",
        });
      }
    } catch (error) {
      console.error('Save job failed:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save job. Please try again.",
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
        description: "Job listings have been updated.",
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

  const handleJobClick = (jobUrl: string) => {
    updateActivity(); // Track job view action
    window.open(jobUrl, '_blank');
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

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white">Job Board</h1>
          <Button onClick={handleRefresh} variant="outline" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Search Controls */}
        <div className="mb-6 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search jobs by title, company, or keywords..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div className="w-64">
              <Input
                placeholder="Location (optional)"
                value={locationFilter}
                onChange={handleLocationChange}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <Button onClick={handleSearch} disabled={isLoading}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800">
            <TabsTrigger value="all" className="text-white">All Jobs ({jobs.length})</TabsTrigger>
            <TabsTrigger value="saved" className="text-white">Saved Jobs ({savedJobs.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            {error && (
              <div className="mb-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-300">
                Error loading jobs: {error}
              </div>
            )}
            
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                <span className="ml-3 text-blue-200">Loading jobs...</span>
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                No jobs found. Try adjusting your search criteria.
              </div>
            ) : (
              <div className="grid gap-4">
                {jobs.map((job) => (
                  <Card key={job.id} className="bg-gray-800 border-gray-700 hover:bg-gray-700 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-white hover:text-blue-400 cursor-pointer" 
                            onClick={() => handleJobClick(job.url)}>
                            {job.title}
                          </CardTitle>
                          <div className="flex items-center gap-4 text-gray-400 text-sm mt-2">
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
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(job.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSaveJob(job.id)}
                            className="text-gray-400 hover:text-blue-400"
                          >
                            {isJobSaved(job.id) ? (
                              <BookmarkCheck className="h-4 w-4" />
                            ) : (
                              <Bookmark className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleJobClick(job.url)}
                            className="text-gray-400 hover:text-blue-400"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    {job.description && (
                      <CardContent className="pt-0">
                        <p className="text-gray-300 text-sm line-clamp-3">
                          {job.description}
                        </p>
                        {job.salary && (
                          <Badge variant="secondary" className="mt-2">
                            {job.salary}
                          </Badge>
                        )}
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="saved" className="mt-6">
            {savedJobs.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                No saved jobs yet. Save some jobs to see them here.
              </div>
            ) : (
              <div className="grid gap-4">
                {savedJobs.map((job) => (
                  <Card key={job.id} className="bg-gray-800 border-gray-700 hover:bg-gray-700 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-white hover:text-blue-400 cursor-pointer" 
                            onClick={() => handleJobClick(job.url)}>
                            {job.title}
                          </CardTitle>
                          <div className="flex items-center gap-4 text-gray-400 text-sm mt-2">
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
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(job.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSaveJob(job.id)}
                            className="text-blue-400 hover:text-gray-400"
                          >
                            <BookmarkCheck className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleJobClick(job.url)}
                            className="text-gray-400 hover:text-blue-400"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    {job.description && (
                      <CardContent className="pt-0">
                        <p className="text-gray-300 text-sm line-clamp-3">
                          {job.description}
                        </p>
                        {job.salary && (
                          <Badge variant="secondary" className="mt-2">
                            {job.salary}
                          </Badge>
                        )}
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
