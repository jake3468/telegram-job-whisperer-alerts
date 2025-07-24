import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { History, FileText, Briefcase, Building, Calendar, Trash2, Eye, X, AlertCircle, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import CoverLetterDownloadActions from '@/components/CoverLetterDownloadActions';
interface CoverLetterItem {
  id: string;
  company_name?: string;
  job_title?: string;
  job_description?: string;
  created_at: string;
  cover_letter?: string;
}
interface CoverLetterHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  gradientColors: string;
}
const CoverLetterHistoryModal = ({
  isOpen,
  onClose,
  gradientColors
}: CoverLetterHistoryModalProps) => {
  const {
    user
  } = useUser();
  const {
    toast
  } = useToast();
  const {
    userProfile
  } = useUserProfile();
  const [historyData, setHistoryData] = useState<CoverLetterItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CoverLetterItem | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  
  
  useEffect(() => {
    if (isOpen) {
      console.log('[CoverLetterHistory] Modal opened, userProfile:', !!userProfile, 'user:', !!user);
      
      if (user && userProfile) {
        // Profile is ready, fetch immediately
        fetchHistory();
      } else {
        // Start loading state while waiting for profile
        setIsLoading(true);
        
        // Set up a polling mechanism to check for profile availability
        const pollForProfile = () => {
          if (user && userProfile) {
            console.log('[CoverLetterHistory] Profile now available, fetching data');
            fetchHistory();
          } else {
            // Continue polling every 500ms for up to 10 seconds
            setTimeout(pollForProfile, 500);
          }
        };
        
        // Start polling after a short delay
        setTimeout(pollForProfile, 500);
        
        // Set a maximum timeout to stop loading if profile never becomes available
        const maxTimeout = setTimeout(() => {
          console.log('[CoverLetterHistory] Max timeout reached, stopping loading');
          setIsLoading(false);
        }, 10000); // 10 seconds max wait
        
        return () => clearTimeout(maxTimeout);
      }
    } else {
      // Reset state when modal closes
      setIsLoading(false);
      setHistoryData([]);
      setShowDetails(false);
      setSelectedItem(null);
    }
  }, [isOpen, user, userProfile]);
  const fetchHistory = async () => {
    if (!user || !userProfile) return;
    setIsLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.from('job_cover_letters').select('id, company_name, job_title, job_description, created_at, cover_letter').eq('user_id', userProfile.id).order('created_at', {
        ascending: false
      }).limit(20);
      if (error) {
        console.error('Error fetching history:', error);
        throw error;
      }

      // Transform the data to match our interface
      const transformedData = (data || []).map((item: any) => ({
        id: item.id,
        company_name: item.company_name,
        job_title: item.job_title,
        job_description: item.job_description,
        created_at: item.created_at,
        cover_letter: item.cover_letter
      }));
      setHistoryData(transformedData);
    } catch (err) {
      console.error('Failed to fetch history:', err);
      toast({
        title: "Error",
        description: "Failed to load history. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleCopyResult = async (item: CoverLetterItem) => {
    const result = item.cover_letter;
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      toast({
        title: "Copied!",
        description: "Cover letter copied to clipboard successfully."
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
      console.log(`Attempting to delete cover letter item with ID: ${itemId} for user profile: ${userProfile.id}`);
      const {
        error
      } = await supabase.from('job_cover_letters').delete().eq('id', itemId).eq('user_id', userProfile.id);
      if (error) {
        console.error('Supabase delete error:', error);
        throw error;
      }
      console.log('Delete operation completed successfully');

      // Remove from local state
      setHistoryData(prev => prev.filter(item => item.id !== itemId));
      toast({
        title: "Deleted",
        description: "Cover letter deleted successfully."
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
  const hasResult = (item: CoverLetterItem) => {
    return item.cover_letter && item.cover_letter.trim().length > 0;
  };
  if (showDetails && selectedItem) {
    return <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl h-[90vh] overflow-hidden bg-black border-white/20 flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-white font-inter flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5" />
              Cover Letter Details
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
                    Cover Letter
                  </div>
                </h3>

                <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-3">
                    <h4 className="text-lime-400 font-semibold">Cover Letter</h4>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <Button onClick={() => handleCopyResult(selectedItem)} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto">
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Result
                      </Button>
                      {selectedItem.cover_letter && <div className="w-full sm:w-auto">
                          <CoverLetterDownloadActions coverLetter={selectedItem.cover_letter} companyName={selectedItem.company_name || 'Company'} jobTitle={selectedItem.job_title || 'Position'} />
                        </div>}
                    </div>
                  </div>
                  
                  <div className="text-black bg-white rounded p-4 font-inter text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {selectedItem.cover_letter}
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
              Cover Letter History
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
            </div> : !user || !userProfile ? <div className="flex items-center justify-center py-8">
              <div className="text-white/70 text-center">
                <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Please wait for your profile to load...</p>
              </div>
            </div> : historyData.length === 0 ? <div className="flex items-center justify-center py-8">
              <div className="text-white/70 text-center">
                <History className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No cover letters found.</p>
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
                    
                    <div className="flex flex-col gap-2 pt-2 w-full">
                      <Button onClick={() => {
                  setSelectedItem(item);
                  setShowDetails(true);
                }} size="sm" className="w-full bg-blue-600/80 hover:bg-blue-600 text-white text-xs px-2 py-1">
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      
                      <Button onClick={() => handleDelete(item.id)} size="sm" className="w-full bg-red-600/80 hover:bg-red-600 text-white text-xs px-2 py-1">
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
                }} size="sm" className="bg-blue-600/80 hover:bg-blue-600 text-white text-xs px-3 py-1">
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      
                      <Button onClick={() => handleDelete(item.id)} size="sm" className="bg-red-600/80 hover:bg-red-600 text-white text-xs px-3 py-1">
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
export default CoverLetterHistoryModal;