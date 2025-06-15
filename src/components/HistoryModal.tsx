import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { History, FileText, Briefcase, Building, Calendar, Trash2, Eye, X, AlertCircle, Copy, Share2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import PercentageMeter from '@/components/PercentageMeter';
import CoverLetterDownloadActions from '@/components/CoverLetterDownloadActions';

interface HistoryItem {
  id: string;
  company_name?: string;
  job_title?: string;
  job_description?: string;
  topic?: string;
  opinion?: string;
  personal_story?: string;
  audience?: string;
  tone?: string;
  created_at: string;
  job_match?: string;
  match_score?: string;
  cover_letter?: string;
  linkedin_post?: string;
}
interface HistoryModalProps {
  type: 'job_guide' | 'cover_letter' | 'linkedin_posts';
  isOpen: boolean;
  onClose: () => void;
  gradientColors: string;
}
const HistoryModal = ({
  type,
  isOpen,
  onClose,
  gradientColors
}: HistoryModalProps) => {
  const {
    user
  } = useUser();
  const {
    toast
  } = useToast();
  const {
    userProfile
  } = useUserProfile();
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  useEffect(() => {
    if (isOpen && user && userProfile) {
      fetchHistory();
    }
  }, [isOpen, user, userProfile]);
  const fetchHistory = async () => {
    if (!user || !userProfile) return;
    setIsLoading(true);
    try {
      let query;
      if (type === 'job_guide') {
        query = supabase.from('job_analyses').select('id, company_name, job_title, job_description, created_at, job_match, match_score').eq('user_id', userProfile.id).order('created_at', {
          ascending: false
        }).limit(20);
      } else if (type === 'cover_letter') {
        query = supabase.from('job_cover_letters').select('id, company_name, job_title, job_description, created_at, cover_letter').eq('user_id', userProfile.id).order('created_at', {
          ascending: false
        }).limit(20);
      } else {
        query = supabase.from('job_linkedin').select('id, topic, opinion, personal_story, audience, tone, created_at, linkedin_post').eq('user_id', userProfile.id).order('created_at', {
          ascending: false
        }).limit(20);
      }
      const {
        data,
        error
      } = await query;
      if (error) {
        console.error('Error fetching history:', error);
        throw error;
      }
      setHistoryData(data || []);
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
  const handleCopyResult = async (item: HistoryItem) => {
    const result = getResult(item);
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      toast({
        title: "Copied!",
        description: `${type === 'job_guide' ? 'Job analysis' : type === 'cover_letter' ? 'Cover letter' : 'LinkedIn post'} copied to clipboard successfully.`
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
      console.log(`Attempting to delete ${type} item with ID: ${itemId} for user profile: ${userProfile.id}`);
      let query;
      let tableName;
      if (type === 'job_guide') {
        tableName = 'job_analyses';
        query = supabase.from('job_analyses').delete().eq('id', itemId).eq('user_id', userProfile.id);
      } else if (type === 'cover_letter') {
        tableName = 'job_cover_letters';
        query = supabase.from('job_cover_letters').delete().eq('id', itemId).eq('user_id', userProfile.id);
      } else {
        tableName = 'job_linkedin';
        query = supabase.from('job_linkedin').delete().eq('id', itemId).eq('user_id', userProfile.id);
      }
      console.log(`Deleting from table: ${tableName}, item ID: ${itemId}, user_id: ${userProfile.id}`);
      const {
        error,
        data
      } = await query;
      if (error) {
        console.error('Supabase delete error:', error);
        throw error;
      }
      console.log('Delete operation completed successfully');

      // Remove from local state
      setHistoryData(prev => prev.filter(item => item.id !== itemId));
      let itemType: string;
      if (type === 'job_guide') {
        itemType = 'Job analysis';
      } else if (type === 'cover_letter') {
        itemType = 'Cover letter';
      } else {
        itemType = 'LinkedIn post';
      }
      toast({
        title: "Deleted",
        description: `${itemType} deleted successfully.`
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
  const getResult = (item: HistoryItem) => {
    if (type === 'job_guide') {
      return item.job_match;
    } else if (type === 'cover_letter') {
      return item.cover_letter;
    } else {
      return item.linkedin_post;
    }
  };
  const hasResult = (item: HistoryItem) => {
    const result = getResult(item);
    return result && result.trim().length > 0;
  };
  const getItemTitle = (item: HistoryItem) => {
    if (type === 'linkedin_posts') {
      return item.topic || 'LinkedIn Post';
    }
    return item.company_name || 'Unknown Company';
  };
  const getItemSubtitle = (item: HistoryItem) => {
    if (type === 'linkedin_posts') {
      return item.tone || 'No tone specified';
    }
    return item.job_title || 'Unknown Position';
  };
  const getHistoryTitle = () => {
    if (type === 'job_guide') {
      return 'Job Analysis History';
    } else if (type === 'cover_letter') {
      return 'Cover Letter History';
    } else {
      return 'LinkedIn Posts History';
    }
  };
  const getHistoryDescription = () => {
    if (type === 'job_guide') {
      return 'job analyses';
    } else if (type === 'cover_letter') {
      return 'cover letters';
    } else {
      return 'LinkedIn posts';
    }
  };
  const getDetailTitle = () => {
    if (type === 'job_guide') {
      return 'Job Analysis Details';
    } else if (type === 'cover_letter') {
      return 'Cover Letter Details';
    } else {
      return 'LinkedIn Post Details';
    }
  };
  const getResultTitle = () => {
    if (type === 'job_guide') {
      return 'Job Analysis Result';
    } else if (type === 'cover_letter') {
      return 'Cover Letter';
    } else {
      return 'LinkedIn Post';
    }
  };
  if (showDetails && selectedItem) {
    return <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl h-[90vh] overflow-hidden bg-black border-white/20 flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-white font-inter flex items-center gap-2 text-lg">
              {type === 'linkedin_posts' ? <Share2 className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
              {getDetailTitle()}
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
                {type === 'linkedin_posts' ? <>
                      <div>
                        <label className="text-white/70 text-sm">Topic:</label>
                        <p className="text-white">{selectedItem.topic}</p>
                      </div>
                      {selectedItem.opinion && <div>
                          <label className="text-white/70 text-sm">Opinion:</label>
                          <p className="text-white">{selectedItem.opinion}</p>
                        </div>}
                      {selectedItem.personal_story && <div>
                          <label className="text-white/70 text-sm">Personal Story:</label>
                          <p className="text-white">{selectedItem.personal_story}</p>
                        </div>}
                      {selectedItem.audience && <div>
                          <label className="text-white/70 text-sm">Audience:</label>
                          <p className="text-white">{selectedItem.audience}</p>
                        </div>}
                      {selectedItem.tone && <div>
                          <label className="text-white/70 text-sm">Tone:</label>
                          <p className="text-white">{selectedItem.tone}</p>
                        </div>}
                    </> : <>
                      <div>
                        <label className="text-white/70 text-sm">Company Name:</label>
                        <p className="text-white">{selectedItem.company_name}</p>
                      </div>
                      <div>
                        <label className="text-white/70 text-sm">Job Title:</label>
                        <p className="text-white">{selectedItem.job_title}</p>
                      </div>
                      <div>
                        <label className="text-white/70 text-sm">Job Description:</label>
                        <div className="rounded p-3 max-h-32 overflow-y-auto bg-gray-800">
                          <p className="text-white text-sm">{selectedItem.job_description}</p>
                        </div>
                      </div>
                    </>}
                <div>
                  <label className="text-white/70 text-sm">Created:</label>
                  <p className="text-white">{formatDate(selectedItem.created_at)}</p>
                </div>
              </div>
            </div>
            {/* --- Result Section --- */}
            {hasResult(selectedItem) && <div className="rounded-lg p-4 border border-white/10 shadow-inner bg-red-700">
                <h3 className="text-white font-medium mb-3 flex items-center gap-2 justify-between">
                  <div className="flex items-center gap-2">
                    {type === 'linkedin_posts' ? <Share2 className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                    {getResultTitle()}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Copy button removed for 'job_guide' type */}
                    {type !== 'job_guide' && <Button onClick={() => handleCopyResult(selectedItem)} size="sm" className="bg-gray-950 hover:bg-gray-800 text-white flex items-center gap-1">
                        <Copy className="w-3 h-3" />
                        <span className="hidden sm:inline">Copy</span>
                      </Button>}
                    {/* Download buttons for cover letter type */}
                    {type === 'cover_letter' && selectedItem.cover_letter && (
                      <CoverLetterDownloadActions 
                        coverLetter={selectedItem.cover_letter}
                        jobTitle={selectedItem.job_title || 'Unknown Position'}
                        companyName={selectedItem.company_name || 'Unknown Company'}
                        contrast // highlight with black/white
                      />
                    )}
                  </div>
                </h3>
                {/* MATCH SCORE shown for job_guide */}
                {type === 'job_guide' && selectedItem.match_score && <div className="mb-4 max-w-full">
                    <div className="w-full sm:max-w-[350px] md:max-w-[280px] mx-auto">
                      <div className="shadow-md rounded-xl bg-gray-900/90 p-3 border border-gray-700">
                        <PercentageMeter percentage={selectedItem.match_score} />
                      </div>
                    </div>
                  </div>}
                <div className="rounded-lg p-4 border-2 border-blue-200 max-h-96 overflow-y-auto mt-1 bg-slate-900">
                  <div style={{
                fontFamily: 'serif'
              }} className="text-gray-100 text-sm md:text-base leading-relaxed whitespace-pre-wrap break-words bg-gray-900">
                    {/* Only use job_match for job_guide, but fallback to existing for other types */}
                    {type === 'job_guide' ? selectedItem.job_match : getResult(selectedItem)}
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
          <DialogTitle className="text-white font-inter flex items-center gap-2 text-base sm:text-lg">
            {type === 'linkedin_posts' ? <Share2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <History className="w-4 h-4 sm:w-5 sm:h-5" />}
            {getHistoryTitle()}
          </DialogTitle>
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
              <div className="text-white/70 text-sm">Loading history...</div>
            </div> : historyData.length === 0 ? <div className="flex items-center justify-center py-8">
              <div className="text-white/70 text-center">
                {type === 'linkedin_posts' ? <Share2 className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 opacity-50" /> : <History className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 opacity-50" />}
                <p className="text-sm">No {getHistoryDescription()} found.</p>
              </div>
            </div> : <div className="space-y-2 sm:space-y-3 pb-4">
              {historyData.map(item => <div key={item.id} className="rounded-lg p-3 sm:p-4 border border-white/10 transition-colors bg-indigo-800">
                  {/* Mobile Layout */}
                  <div className="block sm:hidden space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-white font-medium text-sm">
                          {type === 'linkedin_posts' ? <Share2 className="w-3 h-3 flex-shrink-0" /> : <Building className="w-3 h-3 flex-shrink-0" />}
                          <span className="truncate">{getItemTitle(item)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/80 text-sm mt-1">
                          {type === 'linkedin_posts' ? <FileText className="w-3 h-3 flex-shrink-0" /> : <Briefcase className="w-3 h-3 flex-shrink-0" />}
                          <span className="truncate">{getItemSubtitle(item)}</span>
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
                          {type === 'linkedin_posts' ? <Share2 className="w-4 h-4 flex-shrink-0" /> : <Building className="w-4 h-4 flex-shrink-0" />}
                          <span className="truncate">{getItemTitle(item)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/80 truncate">
                          {type === 'linkedin_posts' ? <FileText className="w-4 h-4 flex-shrink-0" /> : <Briefcase className="w-4 h-4 flex-shrink-0" />}
                          <span className="truncate">{getItemSubtitle(item)}</span>
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
export default HistoryModal;
