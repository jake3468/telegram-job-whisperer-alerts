import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Eye, Clock, Building2, Briefcase, AlertTriangle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@clerk/clerk-react';
import { useEnterpriseAPIClient } from '@/hooks/useEnterpriseAPIClient';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useCachedInterviewPrep } from '@/hooks/useCachedInterviewPrep';
import { supabase } from '@/integrations/supabase/client';
import InterviewPrepDownloadActions from '@/components/InterviewPrepDownloadActions';
import { SafeHTMLRenderer } from '@/components/SafeHTMLRenderer';
interface InterviewPrepHistoryModalProps {
  onSelectEntry?: (entry: any) => void;
}
export const InterviewPrepHistoryModal: React.FC<InterviewPrepHistoryModalProps> = ({
  onSelectEntry
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const {
    toast
  } = useToast();
  const { user, isLoaded } = useUser();
  const { data: interviewHistory, isLoading, refetch } = useCachedInterviewPrep();
  const { makeAuthenticatedRequest } = useEnterpriseAPIClient();
  const handleRefresh = () => {
    refetch();
  };
  const handleDelete = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!user) {
      toast({
        title: "Error",
        description: "User not found. Please try again.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      
      
      const { error } = await makeAuthenticatedRequest(async () => {
        return await supabase
          .from('interview_prep')
          .delete()
          .eq('id', id);
      }, { maxRetries: 2 });

      if (error) {
        console.error('Supabase delete error:', error);
        throw error;
      }
      
      
      
      // Refresh the data after deletion
      refetch();
      toast({
        title: "Interview prep deleted",
        description: "The interview prep entry has been successfully deleted."
      });
    } catch (error) {
      console.error('Error deleting interview prep:', error);
      toast({
        title: "Error",
        description: "Failed to delete the interview prep entry.",
        variant: "destructive"
      });
    }
  };
  const handleView = (entry: any) => {
    setSelectedEntry(entry);
    setShowDetails(true);
  };
  const handleBackToList = () => {
    setSelectedEntry(null);
    setShowDetails(false);
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
  const hasResult = (item: any) => {
    return item.interview_questions && typeof item.interview_questions === 'string' && item.interview_questions.trim().length > 0;
  };
  const renderInterviewQuestions = (content: string) => {
    if (!content) return null;

    // Use SafeHTMLRenderer for secure HTML rendering
    return <SafeHTMLRenderer 
      content={content} 
      className="text-black bg-white rounded p-4 font-inter text-sm leading-relaxed whitespace-pre-wrap break-words"
    />;
  };
  if (showDetails && selectedEntry) {
    return <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-6xl h-[90vh] overflow-hidden bg-black border-white/20 flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-white font-inter flex items-center gap-2 text-lg">
              <Clock className="w-5 h-5" />
              Interview Prep Details
              <Button onClick={handleBackToList} size="sm" className="ml-auto bg-white/20 hover:bg-white/30 text-white border-white/20 text-sm mx-[15px]">
                <X className="w-4 h-4 mr-1" />
                Back to List
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-6 mt-4">
            {/* Input Details Section */}
            <div className="rounded-lg p-4 border border-white/10 bg-blue-800">
              <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Input Details
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-cyan-200 text-sm font-semibold">Company Name:</label>
                  <div className="rounded p-3 mt-1 bg-black/80 border border-cyan-300/20">
                    <p className="text-white text-sm">{selectedEntry.company_name}</p>
                  </div>
                </div>
                <div>
                  <label className="text-cyan-200 text-sm font-semibold">Job Title:</label>
                  <div className="rounded p-3 mt-1 bg-black/80 border border-cyan-300/20">
                    <p className="text-white text-sm">{selectedEntry.job_title}</p>
                  </div>
                </div>
                <div>
                  <label className="text-cyan-200 text-sm font-semibold">Job Description:</label>
                  <div className="rounded p-3 mt-1 max-h-32 overflow-y-auto bg-black/80 border border-cyan-300/20">
                    <p className="text-white text-sm">{selectedEntry.job_description}</p>
                  </div>
                </div>
                <div>
                  <label className="text-cyan-200 text-sm font-semibold">Created:</label>
                  <div className="rounded p-3 mt-1 bg-black/80 border border-cyan-300/20">
                    <p className="text-white text-sm">{formatDate(selectedEntry.created_at)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Result Section */}
            {hasResult(selectedEntry) && <div className="rounded-lg p-4 border border-white/10 shadow-inner bg-red-700">
                <h3 className="text-white font-medium mb-3 flex flex-wrap gap-2 justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Interview Prep Result
                  </div>
                  <div className="flex-shrink-0">
                    <InterviewPrepDownloadActions interviewData={selectedEntry.interview_questions} jobTitle={selectedEntry.job_title} companyName={selectedEntry.company_name} contrast={true} />
                  </div>
                </h3>

                <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-lime-400 font-semibold">Interview Questions & Answers</h4>
                  </div>
                  
                  {renderInterviewQuestions(selectedEntry.interview_questions)}
                </div>
              </div>}
          </div>
        </DialogContent>
      </Dialog>;
  }
  return <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-purple-400 transition-colors text-zinc-950 bg-slate-200 hover:bg-slate-100">
          <Clock className="w-4 h-4 mr-2" />
          History
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-5xl h-[90vh] overflow-hidden bg-black border-white/20 flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-white font-inter flex items-center gap-2 text-base sm:text-lg">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              Interview Prep History
            </DialogTitle>
            <Button onClick={() => setIsOpen(false)} size="sm" variant="ghost" className="text-white/70 hover:text-white h-8 w-8 p-0 hover:bg-white/10">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="border border-orange-500/30 rounded-lg p-2 sm:p-3 mb-4 flex-shrink-0 font-thin text-gray-950 bg-zinc-950">
          <div className="flex items-center gap-2 text-orange-200">
            <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
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
            </div> : !interviewHistory?.length ? <div className="flex flex-col items-center justify-center py-8">
              <div className="text-white/70 text-center">
                <Clock className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm mb-3">No interview prep found.</p>
                <Button 
                  onClick={handleRefresh}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white/70 mr-2"></div>
                      Retrying...
                    </>
                  ) : (
                    'Retry Loading'
                  )}
                </Button>
              </div>
            </div> : <div className="space-y-2 sm:space-y-3 pb-4">
              {interviewHistory.map(entry => <div key={entry.id} className="rounded-lg p-3 sm:p-4 border border-white/10 transition-colors bg-green-600">
                  {/* Mobile Layout */}
                  <div className="block sm:hidden space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-white font-medium text-sm">
                          <Building2 className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{entry.company_name || 'Unknown Company'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/80 text-sm mt-1">
                          <Briefcase className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{entry.job_title || 'Unknown Position'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/60 text-xs mt-1">
                          <Clock className="w-3 h-3 flex-shrink-0" />
                          <span>{formatDate(entry.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 pt-2">
                      {hasResult(entry) && <Button onClick={() => handleView(entry)} size="sm" className="flex-1 bg-blue-600/80 hover:bg-blue-600 text-white text-xs px-2 py-1">
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>}
                      
                      <Button onClick={e => handleDelete(entry.id, e)} size="sm" className="flex-1 bg-red-600/80 hover:bg-red-600 text-white text-xs px-2 py-1">
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
                          <Building2 className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{entry.company_name || 'Unknown Company'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/80 truncate">
                          <Briefcase className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{entry.job_title || 'Unknown Position'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/60 text-sm">
                          <Clock className="w-4 h-4 flex-shrink-0" />
                          <span className="whitespace-nowrap">{formatDate(entry.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {hasResult(entry) && <Button onClick={() => handleView(entry)} size="sm" className="bg-blue-600/80 hover:bg-blue-600 text-white text-xs px-3 py-1">
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>}
                      
                      <Button onClick={e => handleDelete(entry.id, e)} size="sm" className="bg-red-600/80 hover:bg-red-600 text-white text-xs px-3 py-1">
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