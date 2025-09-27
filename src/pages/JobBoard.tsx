import { useState, useMemo, useCallback, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Layout } from '@/components/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MapPin, Building2, ExternalLink, X, RefreshCw, Check, Trash2 } from 'lucide-react';
import { useJobBoardData } from '@/hooks/useJobBoardData';
import { useUserProfile } from '@/hooks/useUserProfile';
import { JobBoardOnboardingPopup } from '@/components/JobBoardOnboardingPopup';
import { useFormTokenKeepAlive } from '@/hooks/useFormTokenKeepAlive';
import { useEnhancedTokenManagerIntegration } from '@/hooks/useEnhancedTokenManagerIntegration';
import { useClerkSupabaseSync } from '@/hooks/useClerkSupabaseSync';
import { Tables } from '@/integrations/supabase/types';
type JobBoardItem = Tables<'job_board'>;
interface JobCardProps {
  job: JobBoardItem;
  onView: () => void;
  onSaveToTracker: () => void;
  onDelete?: () => void;
  section: 'posted-today' | 'last-7-days' | 'saved';
  isAddedToTracker?: boolean;
}
const JobCard = ({
  job,
  onView,
  onSaveToTracker,
  onDelete,
  section,
  isAddedToTracker = false
}: JobCardProps) => {
  const formatSalary = (salary: string | null) => {
    if (!salary) return 'Salary not disclosed';
    return salary;
  };
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    // Handle both date objects and string dates
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      // If it's not a valid date, return the original string
      return dateString;
    }
    return date.toLocaleDateString();
  };

  // Determine what date to show based on section
  const getDateToShow = () => {
    if (section === 'posted-today' && job.posted_at) {
      // For posted today, show posted_at if available (it's already a string)
      return job.posted_at;
    } else {
      // For other sections, show formatted created_at date
      return formatDate(job.created_at);
    }
  };
  return <div className="w-full max-w-full bg-white border border-gray-600 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden" onClick={onView}>
      <div className="p-2 sm:p-3 flex gap-2 sm:gap-3">
        {/* Left section: Logo + Content */}
        <div className="flex-1 min-w-0 flex gap-2 sm:gap-3">
          {/* Company Logo - smaller on mobile */}
          <div className="flex-shrink-0">
            {job.thumbnail ? <img src={job.thumbnail} alt={`${job.company_name} logo`} className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover" /> : <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              </div>}
          </div>
          
          {/* Content: Title/Company + Details */}
          <div className="flex-1 min-w-0">
            {/* Job Title and Company Name */}
            <div className="mb-1 sm:mb-2">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-900 break-words leading-tight">{job.title}</h3>
              <p className="text-xs text-gray-600 break-words leading-tight">{job.company_name}</p>
            </div>
            
            {/* Location, Job Type, Salary - Mobile: List style, Desktop: Single line */}
            <div className="md:hidden space-y-0.5">
              <div className="flex items-center text-xs text-gray-600">
                <span className="w-1 h-1 bg-gray-400 rounded-full mr-1.5 flex-shrink-0"></span>
                <span className="break-words">{job.location || 'Remote'}</span>
              </div>
              <div className="flex items-center text-xs text-gray-600">
                <span className="w-1 h-1 bg-gray-400 rounded-full mr-1.5 flex-shrink-0"></span>
                <span className="break-words">{job.job_type || 'Full-time'}</span>
              </div>
              <div className="flex items-center text-xs text-green-600 font-medium">
                <span className="w-1 h-1 bg-green-600 rounded-full mr-1.5 flex-shrink-0"></span>
                <span className="break-words">{formatSalary(job.salary)}</span>
              </div>
            </div>
            
            {/* Desktop/Tablet: Single line with dots */}
            <div className="hidden md:block">
              <div className="text-xs text-gray-600 break-words">
                <span>{job.location || 'Remote'}</span>
                <span className="mx-2">•</span>
                <span>{job.job_type || 'Full-time'}</span>
                <span className="mx-2">•</span>
                <span className="text-green-600 font-medium">{formatSalary(job.salary)}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right section: Timestamp + Buttons */}
        <div className="flex-shrink-0 flex flex-col items-end gap-1 sm:gap-2 min-w-0">
           {/* Timestamp */}
           {getDateToShow() && <div className="text-xs text-gray-500 text-right truncate max-w-16 sm:max-w-20">
               {getDateToShow()}
             </div>}
          
           {/* Mobile: Buttons stacked vertically */}
           <div className="md:hidden flex flex-col gap-1 min-w-0 w-16">
              <Button onClick={e => {
            e.stopPropagation();
            onView();
          }} variant="outline" size="sm" className="text-xs px-1.5 py-1 h-6 w-full font-medium rounded-md overflow-hidden bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300">
                View
              </Button>
             
             {section === 'saved' && onDelete ? <>
                  <Button onClick={e => {
              e.stopPropagation();
              onSaveToTracker();
            }} size="sm" className={isAddedToTracker ? "bg-green-600 text-white hover:bg-green-700 text-xs px-1.5 py-1 h-6 w-full cursor-default font-medium rounded-md overflow-hidden" : "bg-blue-600 text-white hover:bg-blue-700 text-xs px-1.5 py-1 h-6 w-full font-medium rounded-md overflow-hidden"} disabled={isAddedToTracker}>
                    {isAddedToTracker ? <Check className="h-3 w-3" /> : "Track"}
                  </Button>
                 <Button onClick={e => {
              e.stopPropagation();
              onDelete();
            }} variant="outline" size="sm" className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 text-xs py-1 h-6 w-full font-medium rounded-md overflow-hidden">
                   <Trash2 className="h-2.5 w-2.5" />
                 </Button>
               </> : <Button onClick={e => {
            e.stopPropagation();
            onSaveToTracker();
          }} size="sm" className="bg-blue-600 text-white hover:bg-blue-700 text-xs px-1.5 py-1 h-6 w-full font-medium rounded-md overflow-hidden">
                 Save
               </Button>}
           </div>

           {/* Desktop: Buttons in horizontal row, Tablet: Vertical for saved section */}
           <div className={`hidden md:flex gap-1 min-w-0 ${section === 'saved' ? 'md:flex-col lg:flex-row' : 'flex-row'}`}>
              <Button onClick={e => {
            e.stopPropagation();
            onView();
          }} variant="outline" size="sm" className="text-xs px-2 py-1 h-7 font-medium rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300">
                View
              </Button>
             
             {section === 'saved' && onDelete ? <>
                 <Button onClick={e => {
              e.stopPropagation();
              onSaveToTracker();
            }} size="sm" className={isAddedToTracker ? "bg-green-600 text-white hover:bg-green-700 text-xs px-2 py-1 h-7 cursor-default font-medium rounded-md flex items-center gap-1" : "bg-blue-600 text-white hover:bg-blue-700 text-xs px-2 py-1 h-7 font-medium rounded-md"} disabled={isAddedToTracker}>
                   {isAddedToTracker ? <>
                       <Check className="h-3 w-3" />
                       <span>Added to Job Tracker</span>
                     </> : "Add to Job Tracker"}
                 </Button>
                 <Button onClick={e => {
              e.stopPropagation();
              onDelete();
            }} variant="outline" size="sm" className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 text-xs px-2 py-1 h-7 font-medium rounded-md">
                   <Trash2 className="h-3 w-3" />
                 </Button>
               </> : <Button onClick={e => {
            e.stopPropagation();
            onSaveToTracker();
          }} size="sm" className="bg-blue-600 text-white hover:bg-blue-700 text-xs px-2 py-1 h-7 font-medium rounded-md">
                 Save
               </Button>}
           </div>
        </div>
      </div>
    </div>;
};
const JobBoard = () => {
  const {
    user,
    isLoaded
  } = useUser(); // Add Clerk authentication
  
  // Token management and session handling
  const { isSynced } = useClerkSupabaseSync();
  const sessionManager = useEnhancedTokenManagerIntegration({ enabled: true });
  const { updateActivity } = useFormTokenKeepAlive(true);
  
  const {
    userProfile,
    updateUserProfile
  } = useUserProfile();
  const {
    postedTodayJobs,
    last7DaysJobs,
    savedToTrackerJobs,
    jobTrackerStatus,
    loading,
    error,
    connectionIssue,
    saveToTracker,
    markJobAsSaved,
    deleteJobFromBoard,
    forceRefresh,
    pagination,
    changePage,
    changePageSize,
    sectionLoading,
    sectionLoaded,
    loadSectionData
  } = useJobBoardData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJob, setSelectedJob] = useState<JobBoardItem | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState('posted-today');

  // Handle onboarding popup
  useEffect(() => {
    if (userProfile && userProfile.show_job_board_onboarding_popup) {
      setShowOnboarding(true);
    }
  }, [userProfile]);

  // Handle tab change and lazy load data
  const handleTabChange = (tabValue: string) => {
    updateActivity();
    setActiveTab(tabValue);
    
    // Load section data on demand
    if (tabValue === 'last-7-days' && !sectionLoaded.last7Days) {
      loadSectionData('last7Days');
    } else if (tabValue === 'saved-to-tracker' && !sectionLoaded.saved) {
      loadSectionData('saved');
    }
  };
  const handleCloseOnboarding = () => {
    updateActivity();
    setShowOnboarding(false);
  };
  const handleDontShowOnboardingAgain = async () => {
    updateActivity();
    setShowOnboarding(false);
    if (userProfile) {
      await updateUserProfile({
        show_job_board_onboarding_popup: false
      });
    }
  };

  // Manual refresh function - robust error handling like Job Tracker
  const handleManualRefresh = useCallback(() => {
    updateActivity();
    try {
      // For connection issues or persistent errors, immediately force page refresh
      if (connectionIssue || error) {
        window.location.reload();
        return;
      }

      // Otherwise try force refresh and immediately fall back if needed
      forceRefresh();

      // Short timeout for fallback in case refresh doesn't resolve the issue
      setTimeout(() => {
        if (connectionIssue || error) {
          window.location.reload();
        }
      }, 1000);
    } catch (err) {
      console.error('Manual refresh failed:', err);
      // Force page refresh if all else fails
      window.location.reload();
    }
  }, [forceRefresh, connectionIssue, error, updateActivity]);

  // Show loading while Clerk is loading
  if (!isLoaded) {
    return <Layout>
        <div className="p-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-white mt-4">Loading...</p>
            </div>
          </div>
        </div>
      </Layout>;
  }
  const filterJobsBySearch = useCallback((jobs: JobBoardItem[]) => {
    if (!searchTerm.trim()) return jobs;
    const searchLower = searchTerm.toLowerCase().trim();
    return jobs.filter(job => job.title.toLowerCase().includes(searchLower) || job.company_name.toLowerCase().includes(searchLower));
  }, [searchTerm]);
  const filteredPostedTodayJobs = useMemo(() => filterJobsBySearch(postedTodayJobs), [filterJobsBySearch, postedTodayJobs]);
  const filteredLast7DaysJobs = useMemo(() => filterJobsBySearch(last7DaysJobs), [filterJobsBySearch, last7DaysJobs]);
  const filteredSavedToTrackerJobs = useMemo(() => filterJobsBySearch(savedToTrackerJobs), [filterJobsBySearch, savedToTrackerJobs]);
  const formatSalary = (salary: string | null) => {
    if (!salary) return 'Salary not disclosed';
    return salary;
  };
  if (loading) {
    return <Layout>
        <div className="p-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-white mt-4">Loading job opportunities...</p>
            </div>
          </div>
        </div>
      </Layout>;
  }

  // Show normal layout with error indicator and refresh button in header

  return <Layout>
      <div className="min-h-screen overflow-hidden w-full">
        <div className="w-full max-w-4xl px-2 sm:px-6 mx-auto">
          {/* Header */}
          <div className="text-center mb-4 sm:mb-6">
            <div className="flex items-center justify-center gap-2 sm:gap-4 mb-2 sm:mb-4 mt-4 sm:mt-6 flex-wrap">
              <span className="text-3xl sm:text-3xl">💼</span>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 via-blue-700 to-cyan-600 bg-clip-text text-transparent">Job Board</h1>
              {/* Only show refresh button when there's an error */}
              {error && <Button onClick={handleManualRefresh} disabled={loading} variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 h-8 w-8 p-0" title="Refresh jobs data">
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                 </Button>}
            </div>
            <div className="px-2 sm:px-4">
              <p className="font-inter font-normal text-gray-900 text-sm sm:text-base text-left break-words mb-1 sm:mb-2">
                Browse job alerts as received via Telegram &quot;Job Alerts&quot; AI Agent — all jobs posted today appear here, stay visible for 7 days, and are auto-deleted after that. Save the ones you like and move them to your <span className="italic text-indigo-700">Job Tracker</span> page when you're ready to apply.
              </p>
            </div>
            {/* Error indicator */}
            {error && <div className="bg-red-900/50 border border-red-600 rounded-lg p-3 mt-4 mx-2 sm:mx-4 max-w-2xl mx-auto">
                <div className="flex items-center gap-2 text-red-200 justify-center">
                  <span className="text-sm break-words">
                    {connectionIssue ? "Connection issue detected. Click refresh or check your internet connection." : "Unable to load job opportunities. Click refresh to retry."}
                  </span>
                </div>
              </div>}
          </div>

          {/* Job Sections */}
          <div className="w-full overflow-hidden">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <div className="px-2 sm:px-4 mb-6">
                  <TabsList className="grid w-full grid-cols-3 bg-white/10 backdrop-blur-sm gap-0.5 sm:gap-1 h-auto p-0.5 sm:p-1 border-0 rounded-xl">
                   <TabsTrigger value="posted-today" className="text-sm sm:text-sm px-1 sm:px-3 py-3 sm:py-3 rounded-lg bg-transparent text-gray-700 border border-gray-400 hover:bg-white/10 hover:text-gray-900 transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:border-blue-600 font-medium min-w-0 overflow-hidden">
                     <span className="hidden lg:inline truncate">Posted Today</span>
                     <span className="lg:hidden truncate">Today</span>
                     <span className="ml-0.5 sm:ml-1 flex-shrink-0 text-xs sm:text-xs">({pagination.postedToday.totalCount})</span>
                   </TabsTrigger>
                   <TabsTrigger value="last-7-days" className="text-sm sm:text-sm px-1 sm:px-3 py-3 sm:py-3 rounded-lg bg-transparent text-gray-700 border border-gray-400 hover:bg-white/10 hover:text-gray-900 transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:border-blue-600 font-medium min-w-0 overflow-hidden">
                     <span className="hidden sm:inline truncate">Last 7 Days</span>
                     <span className="sm:hidden truncate">Week</span>
                     <span className="ml-0.5 sm:ml-1 flex-shrink-0 text-xs sm:text-xs">({pagination.last7Days.totalCount})</span>
                   </TabsTrigger>
                   <TabsTrigger value="saved-to-tracker" className="text-sm sm:text-sm px-1 sm:px-3 py-3 sm:py-3 rounded-lg bg-transparent text-gray-700 border border-gray-400 hover:bg-white/10 hover:text-gray-900 transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:border-blue-600 font-medium min-w-0 overflow-hidden">
                     <span className="hidden sm:inline truncate">Saved</span>
                     <span className="sm:hidden truncate">Saved</span>
                     <span className="ml-0.5 sm:ml-1 flex-shrink-0 text-xs sm:text-xs">({pagination.saved.totalCount})</span>
                   </TabsTrigger>
                 </TabsList>
              </div>

              {/* Search */}
              <div className="mb-6 px-2 sm:px-4">
                <div className="relative w-full max-w-md mx-auto">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input placeholder="Search by job title or company name..." value={searchTerm} onChange={e => { updateActivity(); setSearchTerm(e.target.value); }} onFocus={updateActivity} className="pl-12 pr-4 bg-gray-800 border border-gray-600 text-white placeholder:text-gray-400 h-12 text-sm w-full rounded-2xl shadow-sm focus:border-gray-500 focus:ring-2 focus:ring-gray-600 transition-all" />
                </div>
              </div>

              <div className="px-2 sm:px-4 overflow-hidden">
                <TabsContent value="posted-today" className="space-y-3 mt-4 w-full">
                  {sectionLoading.postedToday ? (
                    <div className="text-center py-12 w-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                      <p className="text-gray-400 mt-4">Loading job opportunities...</p>
                    </div>
                  ) : filteredPostedTodayJobs.length === 0 ? (
                    <div className="text-center py-12 w-full">
                      <p className="text-gray-400 text-lg">
                        {searchTerm ? `No jobs matching "${searchTerm}" found in posted today.` : "No jobs posted today."}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3 w-full max-w-2xl mx-auto">
                        {filteredPostedTodayJobs.map(job => (
                          <JobCard 
                            key={job.id} 
                            job={job} 
                            onView={() => { updateActivity(); setSelectedJob(job); }} 
                            onSaveToTracker={() => { updateActivity(); markJobAsSaved(job); }} 
                            section="posted-today" 
                          />
                        ))}
                      </div>
                      
                      {/* Pagination Controls */}
                      <div className="flex items-center justify-between mt-6 max-w-2xl mx-auto">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <span>
                            {((pagination.postedToday.currentPage - 1) * pagination.postedToday.pageSize) + 1}-
                            {Math.min(pagination.postedToday.currentPage * pagination.postedToday.pageSize, pagination.postedToday.totalCount)} of {pagination.postedToday.totalCount}
                          </span>
                          <Select 
                            value={pagination.postedToday.pageSize.toString()} 
                            onValueChange={(value) => changePageSize('postedToday', parseInt(value))}
                          >
                            <SelectTrigger className="w-20 h-8 text-xs bg-white/10 border-gray-600 text-gray-700">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="10">10</SelectItem>
                              <SelectItem value="25">25</SelectItem>
                              <SelectItem value="50">50</SelectItem>
                            </SelectContent>
                          </Select>
                          <span className="text-gray-700">Results per page</span>
                        </div>
                        
                        {pagination.postedToday.totalCount > pagination.postedToday.pageSize && (
                          <Pagination className="justify-end">
                            <PaginationContent>
                              <PaginationItem>
                                <PaginationPrevious 
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    if (pagination.postedToday.currentPage > 1) {
                                      changePage('postedToday', pagination.postedToday.currentPage - 1);
                                    }
                                  }}
                                  className={pagination.postedToday.currentPage === 1 ? 'pointer-events-none opacity-50' : 'text-gray-700 hover:text-gray-900'}
                                />
                              </PaginationItem>
                              
                              <PaginationItem>
                                <PaginationNext 
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    if (pagination.postedToday.currentPage < Math.ceil(pagination.postedToday.totalCount / pagination.postedToday.pageSize)) {
                                      changePage('postedToday', pagination.postedToday.currentPage + 1);
                                    }
                                  }}
                                  className={pagination.postedToday.currentPage >= Math.ceil(pagination.postedToday.totalCount / pagination.postedToday.pageSize) ? 'pointer-events-none opacity-50' : 'text-gray-700 hover:text-gray-900'}
                                />
                              </PaginationItem>
                            </PaginationContent>
                          </Pagination>
                        )}
                      </div>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="last-7-days" className="space-y-3 mt-4 w-full">
                  {sectionLoading.last7Days ? (
                    <div className="text-center py-12 w-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                      <p className="text-gray-400 mt-4">Loading job opportunities...</p>
                    </div>
                  ) : filteredLast7DaysJobs.length === 0 ? (
                    <div className="text-center py-12 w-full">
                      <p className="text-gray-400 text-lg">
                        {searchTerm ? `No jobs matching "${searchTerm}" found in last 7 days.` : "No jobs from the last 7 days."}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3 w-full max-w-2xl mx-auto">
                        {filteredLast7DaysJobs.map(job => (
                          <JobCard 
                            key={job.id} 
                            job={job} 
                            onView={() => { updateActivity(); setSelectedJob(job); }} 
                            onSaveToTracker={() => { updateActivity(); markJobAsSaved(job); }} 
                            section="last-7-days" 
                          />
                        ))}
                      </div>
                      
                      {/* Pagination Controls */}
                      <div className="flex items-center justify-between mt-6 max-w-2xl mx-auto">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <span>
                            {((pagination.last7Days.currentPage - 1) * pagination.last7Days.pageSize) + 1}-
                            {Math.min(pagination.last7Days.currentPage * pagination.last7Days.pageSize, pagination.last7Days.totalCount)} of {pagination.last7Days.totalCount}
                          </span>
                          <Select 
                            value={pagination.last7Days.pageSize.toString()} 
                            onValueChange={(value) => changePageSize('last7Days', parseInt(value))}
                          >
                            <SelectTrigger className="w-20 h-8 text-xs bg-white/10 border-gray-600 text-gray-700">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="10">10</SelectItem>
                              <SelectItem value="25">25</SelectItem>
                              <SelectItem value="50">50</SelectItem>
                            </SelectContent>
                          </Select>
                          <span className="text-gray-700">Results per page</span>
                        </div>
                        
                        {pagination.last7Days.totalCount > pagination.last7Days.pageSize && (
                          <Pagination className="justify-end">
                            <PaginationContent>
                              <PaginationItem>
                                <PaginationPrevious 
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    if (pagination.last7Days.currentPage > 1) {
                                      changePage('last7Days', pagination.last7Days.currentPage - 1);
                                    }
                                  }}
                                  className={pagination.last7Days.currentPage === 1 ? 'pointer-events-none opacity-50' : 'text-gray-700 hover:text-gray-900'}
                                />
                              </PaginationItem>
                              
                              <PaginationItem>
                                <PaginationNext 
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    if (pagination.last7Days.currentPage < Math.ceil(pagination.last7Days.totalCount / pagination.last7Days.pageSize)) {
                                      changePage('last7Days', pagination.last7Days.currentPage + 1);
                                    }
                                  }}
                                  className={pagination.last7Days.currentPage >= Math.ceil(pagination.last7Days.totalCount / pagination.last7Days.pageSize) ? 'pointer-events-none opacity-50' : 'text-gray-700 hover:text-gray-900'}
                                />
                              </PaginationItem>
                            </PaginationContent>
                          </Pagination>
                        )}
                      </div>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="saved-to-tracker" className="space-y-3 mt-4 w-full">
                  <div className="bg-gradient-to-r from-green-100 to-blue-100 border border-green-400 rounded-lg p-3 mb-4 max-w-2xl mx-auto">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 bg-green-600 rounded-full animate-pulse"></div>
                      <span className="text-green-700 font-medium text-sm">Saved Jobs Section</span>
                    </div>
                    <p className="text-gray-700 text-xs">Jobs you&apos;ve saved are shown here. Click &quot;Add to Job Tracker/Track&quot; to track your application progress.</p>
                  </div>
                  
                  {sectionLoading.saved ? (
                    <div className="text-center py-12 w-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                      <p className="text-gray-400 mt-4">Loading job opportunities...</p>
                    </div>
                  ) : filteredSavedToTrackerJobs.length === 0 ? (
                    <div className="text-center py-12 w-full">
                      <p className="text-gray-400 text-lg">
                        {searchTerm ? `No saved jobs matching "${searchTerm}" found.` : "No jobs saved yet."}
                      </p>
                      {!searchTerm && <p className="text-gray-500 mt-2">Save jobs from other sections to see them here.</p>}
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3 w-full max-w-2xl mx-auto">
                        {filteredSavedToTrackerJobs.map(job => (
                          <JobCard 
                            key={job.id} 
                            job={job} 
                            onView={() => { updateActivity(); setSelectedJob(job); }} 
                            onSaveToTracker={() => { updateActivity(); saveToTracker(job); }} 
                            onDelete={() => { updateActivity(); deleteJobFromBoard(job); }} 
                            section="saved" 
                            isAddedToTracker={job.job_reference_id ? jobTrackerStatus[job.job_reference_id] : false} 
                          />
                        ))}
                      </div>
                      
                      {/* Pagination Controls */}
                      <div className="flex items-center justify-between mt-6 max-w-2xl mx-auto">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <span>
                            {((pagination.saved.currentPage - 1) * pagination.saved.pageSize) + 1}-
                            {Math.min(pagination.saved.currentPage * pagination.saved.pageSize, pagination.saved.totalCount)} of {pagination.saved.totalCount}
                          </span>
                          <Select 
                            value={pagination.saved.pageSize.toString()} 
                            onValueChange={(value) => changePageSize('saved', parseInt(value))}
                          >
                            <SelectTrigger className="w-20 h-8 text-xs bg-white/10 border-gray-600 text-gray-700">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="10">10</SelectItem>
                              <SelectItem value="25">25</SelectItem>
                              <SelectItem value="50">50</SelectItem>
                            </SelectContent>
                          </Select>
                          <span className="text-gray-700">Results per page</span>
                        </div>
                        
                        {pagination.saved.totalCount > pagination.saved.pageSize && (
                          <Pagination className="justify-end">
                            <PaginationContent>
                              <PaginationItem>
                                <PaginationPrevious 
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    if (pagination.saved.currentPage > 1) {
                                      changePage('saved', pagination.saved.currentPage - 1);
                                    }
                                  }}
                                  className={pagination.saved.currentPage === 1 ? 'pointer-events-none opacity-50' : 'text-gray-700 hover:text-gray-900'}
                                />
                              </PaginationItem>
                              
                              <PaginationItem>
                                <PaginationNext 
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    if (pagination.saved.currentPage < Math.ceil(pagination.saved.totalCount / pagination.saved.pageSize)) {
                                      changePage('saved', pagination.saved.currentPage + 1);
                                    }
                                  }}
                                  className={pagination.saved.currentPage >= Math.ceil(pagination.saved.totalCount / pagination.saved.pageSize) ? 'pointer-events-none opacity-50' : 'text-gray-700 hover:text-gray-900'}
                                />
                              </PaginationItem>
                            </PaginationContent>
                          </Pagination>
                        )}
                      </div>
                    </>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>

        {/* Job Board Onboarding Popup */}
        <JobBoardOnboardingPopup isOpen={showOnboarding} onClose={handleCloseOnboarding} onDontShowAgain={handleDontShowOnboardingAgain} />

        {/* Job Details Modal */}
        <Dialog open={!!selectedJob} onOpenChange={() => { updateActivity(); setSelectedJob(null); }}>
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
                     <Button variant="ghost" size="icon" className="text-gray-700 hover:text-gray-900 flex-shrink-0" onClick={() => { updateActivity(); setSelectedJob(null); }}>
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
                  {selectedJob.job_description && <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <h3 className="text-gray-900 font-medium text-sm mb-3">Job Description</h3>
                      <div className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
                        {selectedJob.job_description}
                      </div>
                    </div>}

                  {/* External Links */}
                  {(selectedJob.link_1_title || selectedJob.link_2_title || selectedJob.link_3_title) && <div className="bg-slate-50 p-4 rounded-lg mb-4">
                      <h3 className="text-gray-900 font-medium text-sm mb-3">External Links</h3>
                      <div className="space-y-2">
                        {selectedJob.link_1_title && selectedJob.link_1_link && <Button asChild variant="outline" size="sm" className="justify-start border-blue-200 text-blue-700 hover:bg-blue-50 w-full text-xs h-8">
                            <a href={selectedJob.link_1_link} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3 mr-2" />
                              {selectedJob.link_1_title}
                            </a>
                          </Button>}
                        {selectedJob.link_2_title && selectedJob.link_2_link && <Button asChild variant="outline" size="sm" className="justify-start border-blue-200 text-blue-700 hover:bg-blue-50 w-full text-xs h-8">
                            <a href={selectedJob.link_2_link} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3 mr-2" />
                              {selectedJob.link_2_title}
                            </a>
                          </Button>}
                        {selectedJob.link_3_title && selectedJob.link_3_link && <Button asChild variant="outline" size="sm" className="justify-start border-blue-200 text-blue-700 hover:bg-blue-50 w-full text-xs h-8">
                            <a href={selectedJob.link_3_link} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3 mr-2" />
                              {selectedJob.link_3_title}
                            </a>
                          </Button>}
                      </div>
                    </div>}

                  {/* Save Button */}
                  <div className="pt-2">
                     <Button onClick={() => { updateActivity(); selectedJob && saveToTracker(selectedJob); }} className="w-full bg-blue-600 text-white hover:bg-blue-700 text-sm h-10">
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