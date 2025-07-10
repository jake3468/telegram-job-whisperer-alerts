import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { History, FileText, Briefcase, Building, Calendar, Trash2, Eye, X, AlertCircle, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import { PercentageMeter } from '@/components/PercentageMeter';
interface JobAnalysisItem {
  id: string;
  company_name?: string;
  job_title?: string;
  job_description?: string;
  created_at: string;
  job_match?: string;
  match_score?: string;
}
interface JobAnalysisHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  gradientColors: string;
}
const JobAnalysisHistoryModal = ({
  isOpen,
  onClose,
  gradientColors
}: JobAnalysisHistoryModalProps) => {
  const {
    user,
    isLoaded
  } = useUser();
  const {
    toast
  } = useToast();
  const {
    userProfile
  } = useUserProfile();
  const [historyData, setHistoryData] = useState<JobAnalysisItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<JobAnalysisItem | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  useEffect(() => {
    if (isOpen && isLoaded && user && userProfile) {
      console.log('🔄 JobAnalysisHistoryModal: Starting to fetch history');
      fetchHistory();
    }
  }, [isOpen, isLoaded, user, userProfile]);
  const fetchHistory = async (isRetry = false) => {
    if (!isLoaded || !user || !userProfile) {
      console.log('❌ Cannot fetch history: missing requirements', {
        isLoaded,
        user: !!user,
        userProfile: !!userProfile
      });
      return;
    }
    setIsLoading(true);
    try {
      console.log('📡 Fetching job analysis history for user:', userProfile.id);
      const {
        data,
        error
      } = await supabase.from('job_analyses').select('id, company_name, job_title, job_description, created_at, job_match, match_score').eq('user_id', userProfile.id).order('created_at', {
        ascending: false
      }).limit(20);
      if (error) {
        console.error('❌ Error fetching history:', error);

        // If JWT expired, try to refresh the session
        if (error.message?.includes('JWT expired') || error.code === 'PGRST301') {
          console.log('🔄 JWT expired, attempting to refresh session...');
          if (!isRetry && retryCount < 2) {
            // Wait a moment for potential token refresh, then retry
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
              fetchHistory(true);
            }, 2000);
            return;
          }
        }
        throw error;
      }
      console.log('✅ Successfully fetched history:', data?.length || 0, 'items');
      setHistoryData(data || []);
      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      console.error('❌ Failed to fetch history:', err);
      toast({
        title: "Error",
        description: "Failed to load history. Please try again or refresh the page.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleCopyResult = async (item: JobAnalysisItem) => {
    const result = item.job_match;
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      toast({
        title: "Copied!",
        description: "Job analysis copied to clipboard successfully."
      });
    } catch (err) {
      console.error('Failed to copy text:', err);
      toast({
        title: "Error",
        description: "Failed to copy text to clipboard.",
        variant: "destructive"
      });
    }
  };
  const handleDelete = async (itemId: string) => {
    if (!userProfile) {
      toast({
        title: "Error",
        description: "User profile not found. Please try again.",
        variant: "destructive"
      });
      return;
    }
    try {
      console.log(`Attempting to delete job analysis item with ID: ${itemId} for user profile: ${userProfile.id}`);
      const {
        error
      } = await supabase.from('job_analyses').delete().eq('id', itemId).eq('user_id', userProfile.id);
      if (error) {
        console.error('Supabase delete error:', error);
        throw error;
      }
      console.log('Delete operation completed successfully');

      // Remove from local state
      setHistoryData(prev => prev.filter(item => item.id !== itemId));
      toast({
        title: "Deleted",
        description: "Job analysis deleted successfully."
      });

      // Close details view if we deleted the currently viewed item
      if (selectedItem && selectedItem.id === itemId) {
        setShowDetails(false);
        setSelectedItem(null);
      }
    } catch (err) {
      console.error('Failed to delete item:', err);
      toast({
        title: "Error",
        description: "Failed to delete item. Please try again.",
        variant: "destructive"
      });
    }
  };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  const hasResult = (item: JobAnalysisItem) => {
    return item.job_match && item.job_match.trim().length > 0;
  };
  if (showDetails && selectedItem) {
    return <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl h-[90vh] overflow-hidden bg-black border-white/20 flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-white font-inter flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5" />
              Job Analysis Details
              <Button onClick={() => setShowDetails(false)} size="sm" className="ml-auto bg-white/20 hover:bg-white/30 text-white border-white/20 text-sm mx-[15px]">
                <X className="w-4 h-4 mr-1" />
                Back to List
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-6 mt-4">
            {/* Input Details Section */}
            <div className="rounded-lg p-4 border border-white/10 bg-blue-800">
              <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                <Building className="w-4 h-4" />
                Input Details
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-cyan-200 text-sm font-semibold">Company Name:</label>
                  <div className="rounded p-3 mt-1 bg-black/80 border border-cyan-300/20">
                    <p className="text-white text-sm">{selectedItem.company_name}</p>
                  </div>
                </div>
                <div>
                  <label className="text-cyan-200 text-sm font-semibold">Job Title:</label>
                  <div className="rounded p-3 mt-1 bg-black/80 border border-cyan-300/20">
                    <p className="text-white text-sm">{selectedItem.job_title}</p>
                  </div>
                </div>
                <div>
                  <label className="text-cyan-200 text-sm font-semibold">Job Description:</label>
                  <div className="rounded p-3 mt-1 max-h-32 overflow-y-auto bg-black/80 border border-cyan-300/20">
                    <p className="text-white text-sm">{selectedItem.job_description}</p>
                  </div>
                </div>
                <div>
                  <label className="text-cyan-200 text-sm font-semibold">Created:</label>
                  <div className="rounded p-3 mt-1 bg-black/80 border border-cyan-300/20">
                    <p className="text-white text-sm">{formatDate(selectedItem.created_at)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Result Section */}
            {hasResult(selectedItem) && <div className="rounded-lg p-4 border border-white/10 shadow-inner bg-red-700">
                <h3 className="text-white font-medium mb-3 flex flex-wrap gap-2 justify-between items-center">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Job Analysis Result
                  </div>
                </h3>

                <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-lime-400 font-semibold">Job Analysis Result</h4>
                    <Button onClick={() => handleCopyResult(selectedItem)} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Result
                    </Button>
                  </div>
                  
                  {selectedItem.match_score && <div className="mb-4">
                      <PercentageMeter score={parseInt(selectedItem.match_score)} label="Match Score" />
                    </div>}
                  
                  <div className="text-black bg-white rounded p-4 font-inter text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {selectedItem.job_match}
                  </div>
                </div>
              </div>}
          </div>
        </DialogContent>
      </Dialog>;
  }
  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-5xl h-[90vh] overflow-hidden bg-black border-white/20 flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-white font-inter flex items-center gap-2 text-base sm:text-lg">
              <History className="w-4 h-4 sm:w-5 sm:h-5" />
              Job Analysis History
            </DialogTitle>
            <Button onClick={onClose} size="sm" variant="ghost" className="text-white/70 hover:text-white h-8 w-8 p-0 hover:bg-white/10">
              <X className="w-4 h-4" />
            </Button>
          </div>
          <DialogDescription className="text-white/70 font-inter text-xs sm:text-sm">
            Your history is automatically deleted after 60 days. Found {historyData.length} items.
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-2 sm:p-3 mb-4 flex-shrink-0">
          <div className="flex items-center gap-2 text-orange-200">
            <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <p className="text-xs sm:text-sm">
              Your history is automatically deleted after 60 days for privacy and storage optimization.
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {isLoading ? <div className="flex items-center justify-center py-8">
              <div className="text-white/70 text-sm flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white/70"></div>
                Loading history...
              </div>
            </div> : historyData.length === 0 ? <div className="flex flex-col items-center justify-center py-8">
              <div className="text-white/70 text-center">
                <History className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No job analyses found.</p>
                <Button onClick={() => fetchHistory()} size="sm" className="mt-2 bg-blue-600 hover:bg-blue-700">
                  Retry Loading
                </Button>
              </div>
            </div> : <div className="space-y-2 sm:space-y-3 pb-4">
              {historyData.map(item => <div key={item.id} className="rounded-lg p-3 sm:p-4 border border-white/10 transition-colors bg-green-600">
                  {/* Mobile Layout */}
                  <div className="block sm:hidden space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-white font-medium text-sm">
                          <Building className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{item.company_name || 'Unknown Company'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/80 text-sm mt-1">
                          <Briefcase className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{item.job_title || 'Unknown Position'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/60 text-xs mt-1">
                          <Calendar className="w-3 h-3 flex-shrink-0" />
                          <span>{formatDate(item.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 pt-2">
                      <Button onClick={() => {
                  setSelectedItem(item);
                  setShowDetails(true);
                }} size="sm" className="flex-1 bg-blue-600/80 hover:bg-blue-600 text-white text-xs px-2 py-1">
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      
                      <Button onClick={() => handleDelete(item.id)} size="sm" className="flex-1 bg-red-600/80 hover:bg-red-600 text-white text-xs px-2 py-1">
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden sm:flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-white font-medium truncate">
                          <Building className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{item.company_name || 'Unknown Company'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/80 truncate">
                          <Briefcase className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{item.job_title || 'Unknown Position'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/60 text-sm">
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          <span className="whitespace-nowrap">{formatDate(item.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button onClick={() => {
                  setSelectedItem(item);
                  setShowDetails(true);
                }} size="sm" className="text-white text-xs px-3 py-1 bg-blue-800 hover:bg-blue-700">
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      
                      <Button onClick={() => handleDelete(item.id)} size="sm" className="text-white text-xs px-3 py-1 bg-red-800 hover:bg-red-700">
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>)}
            </div>}
        </div>
      </DialogContent>
    </Dialog>;
};
export default JobAnalysisHistoryModal;