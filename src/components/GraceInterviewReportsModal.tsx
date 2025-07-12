import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { History, Phone, Calendar, Trash2, Eye, X, AlertCircle, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
interface GraceInterviewRequest {
  id: string;
  phone_number: string;
  company_name: string;
  job_title: string;
  job_description: string;
  status: string;
  created_at: string;
  interview_status?: string;
  completion_percentage?: number;
  time_spent?: string;
  feedback_message?: string;
  feedback_suggestion?: string;
  feedback_next_action?: string;
  report_generated?: boolean;
  report_data?: any;
  actionable_plan?: any;
  next_steps_priority?: any;
}
interface GraceInterviewReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
}
const GraceInterviewReportsModal = ({
  isOpen,
  onClose
}: GraceInterviewReportsModalProps) => {
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
  const [historyData, setHistoryData] = useState<GraceInterviewRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<GraceInterviewRequest | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  useEffect(() => {
    if (isOpen && isLoaded && user && userProfile) {
      fetchHistory();
    }
  }, [isOpen, isLoaded, user, userProfile]);
  const fetchHistory = async () => {
    if (!isLoaded || !user || !userProfile) {
      return;
    }
    setIsLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.from('grace_interview_requests').select('*').eq('user_id', userProfile.id).order('created_at', {
        ascending: false
      }).limit(20);
      if (error) {
        throw error;
      }
      setHistoryData(data || []);
    } catch (err) {
      console.error('Failed to fetch interview history:', err);
      toast({
        title: "Error",
        description: "Failed to load interview history. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
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
      const {
        error
      } = await supabase.from('grace_interview_requests').delete().eq('id', itemId).eq('user_id', userProfile.id);
      if (error) {
        throw error;
      }
      setHistoryData(prev => prev.filter(item => item.id !== itemId));
      toast({
        title: "Deleted",
        description: "Interview request deleted successfully."
      });
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
  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'FULL_COMPLETION':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'SUBSTANTIAL_COMPLETION':
        return <CheckCircle className="w-4 h-4 text-blue-400" />;
      case 'PARTIAL_COMPLETION':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'EARLY_TERMINATION':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'FULL_COMPLETION':
        return 'text-green-400';
      case 'SUBSTANTIAL_COMPLETION':
        return 'text-blue-400';
      case 'PARTIAL_COMPLETION':
        return 'text-yellow-400';
      case 'EARLY_TERMINATION':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };
  const formatStatusText = (status?: string) => {
    if (!status) return 'Pending';
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  };
  if (showDetails && selectedItem) {
    return <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl h-[90vh] overflow-hidden bg-black border-white/20 flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-white font-inter flex items-center gap-2 text-lg">
              <Phone className="w-5 h-5" />
              Interview Report Details
              <Button onClick={() => setShowDetails(false)} size="sm" className="ml-auto bg-white/20 hover:bg-white/30 text-white border-white/20 text-sm mx-[15px]">
                <X className="w-4 h-4 mr-1" />
                Back to List
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-6 mt-4">
            {/* Request Details */}
            <div className="rounded-lg p-4 border border-white/10 bg-blue-800">
              <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Interview Request Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-cyan-200 text-sm font-semibold">Company:</label>
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
                  <label className="text-cyan-200 text-sm font-semibold">Phone Number:</label>
                  <div className="rounded p-3 mt-1 bg-black/80 border border-cyan-300/20">
                    <p className="text-white text-sm">{selectedItem.phone_number}</p>
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

            {/* Interview Status */}
            {selectedItem.interview_status && <div className="rounded-lg p-4 border border-white/10 bg-purple-800">
                <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Interview Status
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-purple-200 text-sm font-semibold">Status:</label>
                    <div className="rounded p-3 mt-1 bg-black/80 border border-purple-300/20 flex items-center gap-2">
                      {getStatusIcon(selectedItem.interview_status)}
                      <span className={`text-sm ${getStatusColor(selectedItem.interview_status)}`}>
                        {formatStatusText(selectedItem.interview_status)}
                      </span>
                    </div>
                  </div>
                  {selectedItem.completion_percentage !== null && <div>
                      <label className="text-purple-200 text-sm font-semibold">Completion:</label>
                      <div className="rounded p-3 mt-1 bg-black/80 border border-purple-300/20">
                        <p className="text-white text-sm">{selectedItem.completion_percentage}%</p>
                      </div>
                    </div>}
                  {selectedItem.time_spent && <div>
                      <label className="text-purple-200 text-sm font-semibold">Time Spent:</label>
                      <div className="rounded p-3 mt-1 bg-black/80 border border-purple-300/20">
                        <p className="text-white text-sm">{selectedItem.time_spent}</p>
                      </div>
                    </div>}
                </div>
              </div>}

            {/* Feedback Section */}
            {(selectedItem.feedback_message || selectedItem.feedback_suggestion || selectedItem.feedback_next_action) && <div className="rounded-lg p-4 border border-white/10 bg-green-800">
                <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Feedback
                </h3>
                <div className="space-y-4">
                  {selectedItem.feedback_message && <div>
                      <label className="text-green-200 text-sm font-semibold">Message:</label>
                      <div className="rounded p-3 mt-1 bg-black/80 border border-green-300/20">
                        <p className="text-white text-sm">{selectedItem.feedback_message}</p>
                      </div>
                    </div>}
                  {selectedItem.feedback_suggestion && <div>
                      <label className="text-green-200 text-sm font-semibold">Suggestion:</label>
                      <div className="rounded p-3 mt-1 bg-black/80 border border-green-300/20">
                        <p className="text-white text-sm">{selectedItem.feedback_suggestion}</p>
                      </div>
                    </div>}
                  {selectedItem.feedback_next_action && <div>
                      <label className="text-green-200 text-sm font-semibold">Next Action:</label>
                      <div className="rounded p-3 mt-1 bg-black/80 border border-green-300/20">
                        <p className="text-white text-sm">{selectedItem.feedback_next_action}</p>
                      </div>
                    </div>}
                </div>
              </div>}

            {/* Actionable Plan */}
            {selectedItem.actionable_plan && <div className="rounded-lg p-4 border border-white/10 bg-orange-800">
                <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Actionable Plan
                </h3>
                <div className="rounded p-3 bg-black/80 border border-orange-300/20">
                  <pre className="text-white text-sm whitespace-pre-wrap">
                    {JSON.stringify(selectedItem.actionable_plan, null, 2)}
                  </pre>
                </div>
              </div>}

            {/* Next Steps Priority */}
            {selectedItem.next_steps_priority && <div className="rounded-lg p-4 border border-white/10 bg-red-800">
                <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Next Steps Priority
                </h3>
                <div className="rounded p-3 bg-black/80 border border-red-300/20">
                  <pre className="text-white text-sm whitespace-pre-wrap">
                    {JSON.stringify(selectedItem.next_steps_priority, null, 2)}
                  </pre>
                </div>
              </div>}

            {/* Complete Report Data */}
            {selectedItem.report_data && <div className="rounded-lg p-4 border border-white/10 bg-gray-800">
                <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Complete Report Data
                </h3>
                <div className="rounded p-3 bg-black/80 border border-gray-300/20 max-h-96 overflow-y-auto">
                  <pre className="text-white text-xs whitespace-pre-wrap">
                    {JSON.stringify(selectedItem.report_data, null, 2)}
                  </pre>
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
              AI Mock Interview Reports
            </DialogTitle>
            <Button onClick={onClose} size="sm" variant="ghost" className="text-white/70 hover:text-white h-8 w-8 p-0 hover:bg-white/10">
              <X className="w-4 h-4" />
            </Button>
          </div>
          <DialogDescription className="text-white/70 font-inter text-xs sm:text-sm">
            Your interview history and reports. Found {historyData.length} interviews.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
          {isLoading ? <div className="flex items-center justify-center py-8">
              <div className="text-white/70 text-sm flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white/70"></div>
                Loading interview history...
              </div>
            </div> : historyData.length === 0 ? <div className="flex flex-col items-center justify-center py-8">
              <div className="text-white/70 text-center">
                <Phone className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No interview requests found.</p>
                <Button onClick={() => fetchHistory()} size="sm" className="mt-2 bg-blue-600 hover:bg-blue-700">
                  Retry Loading
                </Button>
              </div>
            </div> : <div className="space-y-2 sm:space-y-3 pb-4">
              {historyData.map(item => <div key={item.id} className="rounded-lg p-3 sm:p-4 border border-white/10 transition-colors bg-purple-700">
                  {/* Mobile Layout */}
                  <div className="block sm:hidden space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-white font-medium text-sm">
                          <Phone className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{item.company_name}</span>
                        </div>
                        <div className="text-white/80 text-sm mt-1 truncate">{item.job_title}</div>
                        <div className="flex items-center gap-2 text-white/60 text-xs mt-1">
                          <Calendar className="w-3 h-3 flex-shrink-0" />
                          <span>{formatDate(item.created_at)}</span>
                        </div>
                        {item.interview_status && <div className="flex items-center gap-2 mt-1">
                            {getStatusIcon(item.interview_status)}
                            <span className={`text-xs ${getStatusColor(item.interview_status)}`}>
                              {formatStatusText(item.interview_status)}
                            </span>
                            {item.completion_percentage !== null && <span className="text-xs text-white/60">
                                ({item.completion_percentage}%)
                              </span>}
                          </div>}
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
                          <Phone className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{item.company_name}</span>
                        </div>
                        <div className="text-white/80 truncate">{item.job_title}</div>
                        <div className="flex items-center gap-2 text-white/60 text-sm">
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          <span className="whitespace-nowrap">{formatDate(item.created_at)}</span>
                        </div>
                        {item.interview_status && <div className="flex items-center gap-2">
                            {getStatusIcon(item.interview_status)}
                            <span className={`text-sm ${getStatusColor(item.interview_status)}`}>
                              {formatStatusText(item.interview_status)}
                            </span>
                            {item.completion_percentage !== null && <span className="text-sm text-white/60">
                                ({item.completion_percentage}%)
                              </span>}
                          </div>}
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
export default GraceInterviewReportsModal;