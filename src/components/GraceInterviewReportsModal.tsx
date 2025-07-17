import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { History, Phone, Calendar, Trash2, Eye, X, AlertCircle, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import { PremiumInterviewReportDisplay } from './PremiumInterviewReportDisplay';
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
        <DialogContent className="max-w-[95vw] w-full h-[95vh] overflow-hidden bg-white border-gray-200 flex flex-col p-0">
          <DialogHeader className="flex-shrink-0 px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-gray-900 font-inter flex items-center gap-2 text-lg">
                <Phone className="w-5 h-5" />
                Interview Report Details
              </DialogTitle>
              <Button 
                onClick={() => setShowDetails(false)} 
                size="sm" 
                variant="ghost"
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <X className="w-4 h-4 mr-1" />
                Back to List
              </Button>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto">
            <PremiumInterviewReportDisplay report={selectedItem} />
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