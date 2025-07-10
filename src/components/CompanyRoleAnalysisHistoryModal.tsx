import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { History, FileText, Briefcase, Building, Calendar, Trash2, Eye, X, AlertCircle, Copy, TrendingUp, Shield, Lightbulb, DollarSign, Users, GraduationCap, AlertTriangle, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import { PremiumAnalysisResults } from '@/components/PremiumAnalysisResults';
interface CompanyRoleAnalysisItem {
  id: string;
  company_name?: string;
  location?: string;
  job_title?: string;
  created_at: string;
  research_date?: string;
  local_role_market_context?: string;
  company_news_updates?: string[];
  role_security_score?: number;
  role_security_score_breakdown?: string[];
  role_security_outlook?: string;
  role_security_automation_risks?: string;
  role_security_departmental_trends?: string;
  role_experience_score?: number;
  role_experience_score_breakdown?: string[];
  role_experience_specific_insights?: string;
  role_compensation_analysis?: any;
  role_workplace_environment?: any;
  career_development?: any;
  role_specific_considerations?: any;
  interview_and_hiring_insights?: any;
  sources?: any;
}
interface CompanyRoleAnalysisHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  gradientColors: string;
}
const CompanyRoleAnalysisHistoryModal = ({
  isOpen,
  onClose,
  gradientColors
}: CompanyRoleAnalysisHistoryModalProps) => {
  const {
    user
  } = useUser();
  const {
    toast
  } = useToast();
  const {
    userProfile
  } = useUserProfile();
  const [historyData, setHistoryData] = useState<CompanyRoleAnalysisItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CompanyRoleAnalysisItem | null>(null);
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
      const {
        data,
        error
      } = await supabase.from('company_role_analyses').select('*').eq('user_id', userProfile.id).order('created_at', {
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
        location: item.location,
        job_title: item.job_title,
        created_at: item.created_at,
        research_date: item.research_date,
        local_role_market_context: item.local_role_market_context,
        company_news_updates: item.company_news_updates,
        role_security_score: item.role_security_score,
        role_security_score_breakdown: item.role_security_score_breakdown,
        role_security_outlook: item.role_security_outlook,
        role_security_automation_risks: item.role_security_automation_risks,
        role_security_departmental_trends: item.role_security_departmental_trends,
        role_experience_score: item.role_experience_score,
        role_experience_score_breakdown: item.role_experience_score_breakdown,
        role_experience_specific_insights: item.role_experience_specific_insights,
        role_compensation_analysis: item.role_compensation_analysis,
        role_workplace_environment: item.role_workplace_environment,
        career_development: item.career_development,
        role_specific_considerations: item.role_specific_considerations,
        interview_and_hiring_insights: item.interview_and_hiring_insights,
        sources: item.sources
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
      console.log(`Attempting to delete company analysis item with ID: ${itemId} for user profile: ${userProfile.id}`);
      const {
        error
      } = await supabase.from('company_role_analyses').delete().eq('id', itemId).eq('user_id', userProfile.id);
      if (error) {
        console.error('Supabase delete error:', error);
        throw error;
      }
      console.log('Delete operation completed successfully');

      // Remove from local state
      setHistoryData(prev => prev.filter(item => item.id !== itemId));
      toast({
        title: "Deleted",
        description: "Analysis deleted successfully."
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
  const hasAnalysisResult = (item: CompanyRoleAnalysisItem) => {
    return item.local_role_market_context || item.company_news_updates?.length || item.role_security_score || item.role_experience_score || item.role_compensation_analysis || item.role_workplace_environment || item.career_development || item.role_specific_considerations || item.interview_and_hiring_insights || item.sources;
  };
  if (showDetails && selectedItem) {
    return <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl h-[90vh] overflow-hidden bg-black border-white/20 flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-white font-inter flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5" />
              Company Analysis Details
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
                  <label className="text-cyan-200 text-sm font-semibold">Location:</label>
                  <div className="rounded p-3 mt-1 bg-black/80 border border-cyan-300/20">
                    <p className="text-white text-sm">{selectedItem.location}</p>
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

            {/* Analysis Results Section */}
            {hasAnalysisResult(selectedItem) ? <div className="rounded-lg overflow-hidden">
                <h3 className="text-white font-medium mb-4 flex items-center gap-2 px-4">
                  <TrendingUp className="w-4 h-4" />
                  Analysis Results
                </h3>
                <PremiumAnalysisResults analysis={selectedItem as any} />
              </div> : <div className="rounded-lg p-4 border border-white/10 bg-yellow-800/30">
                <div className="flex items-center gap-2 text-yellow-200">
                  <AlertCircle className="w-4 h-4" />
                  <p className="text-sm">Analysis is still being processed. Please check back later.</p>
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
              Company Analysis History
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
            </div> : historyData.length === 0 ? <div className="flex items-center justify-center py-8">
              <div className="text-white/70 text-center">
                <History className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No company analyses found.</p>
              </div>
            </div> : <div className="space-y-2 sm:space-y-3 pb-4">
              {historyData.map(item => <div key={item.id} className="rounded-lg p-3 sm:p-4 border border-white/10 transition-colors bg-green-600">
                  {/* Mobile Layout */}
                  <div className="block sm:hidden space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-white font-medium text-sm mb-1">
                          <Building className="w-3 h-3 flex-shrink-0" />
                          <span className="break-words">{item.company_name || 'Unknown Company'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/80 text-sm mt-1">
                          <Briefcase className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{item.job_title || 'Unknown Position'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/60 text-xs mt-1">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{item.location || 'Unknown Location'}</span>
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
                }} size="sm" className="flex-1 bg-green-600/80 hover:bg-green-600 text-white text-xs px-2 py-1">
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
                        {/* Company Name - Given priority, no truncation */}
                        <div className="flex items-center gap-2 text-white font-medium min-w-0 flex-shrink-0">
                          <Building className="w-4 h-4 flex-shrink-0" />
                          <span className="whitespace-nowrap">{item.company_name || 'Unknown Company'}</span>
                        </div>
                        {/* Job Title - Can be truncated */}
                        <div className="flex items-center gap-2 text-white/80 min-w-0 flex-1">
                          <Briefcase className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{item.job_title || 'Unknown Position'}</span>
                        </div>
                        {/* Location */}
                        <div className="flex items-center gap-2 text-white/60 text-sm flex-shrink-0">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate max-w-24">{item.location || 'Unknown Location'}</span>
                        </div>
                        {/* Date */}
                        <div className="flex items-center gap-2 text-white/60 text-sm flex-shrink-0">
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          <span className="whitespace-nowrap">{formatDate(item.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button onClick={() => {
                  setSelectedItem(item);
                  setShowDetails(true);
                }} size="sm" className="text-white text-xs px-3 py-1 bg-blue-600 hover:bg-blue-500">
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
export default CompanyRoleAnalysisHistoryModal;