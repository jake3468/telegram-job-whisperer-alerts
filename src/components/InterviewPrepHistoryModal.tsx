
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Eye, Clock, Building2, Briefcase, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useUserProfile } from '@/hooks/useUserProfile';
import { InterviewPremiumDisplay } from './InterviewPremiumDisplay';

interface InterviewPrepHistoryModalProps {
  onSelectEntry?: (entry: any) => void;
}

export const InterviewPrepHistoryModal: React.FC<InterviewPrepHistoryModalProps> = ({ onSelectEntry }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'list' | 'view'>('list');
  const { toast } = useToast();
  const { userProfile } = useUserProfile();
  const queryClient = useQueryClient();

  const { data: interviewHistory, isLoading } = useQuery({
    queryKey: ['interview-prep-history', userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id) return [];
      
      const { data, error } = await supabase
        .from('interview_prep')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!userProfile?.id && isOpen
  });

  const handleDelete = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      const { error } = await supabase
        .from('interview_prep')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Interview prep deleted",
        description: "The interview prep entry has been successfully deleted."
      });

      queryClient.invalidateQueries({ queryKey: ['interview-prep-history'] });
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
    console.log('Viewing entry:', entry);
    console.log('Interview questions data:', entry.interview_questions);
    setSelectedEntry(entry);
    setViewMode('view');
  };

  const handleBackToList = () => {
    setSelectedEntry(null);
    setViewMode('list');
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

  const renderContent = () => {
    if (viewMode === 'view' && selectedEntry) {
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleBackToList}
              className="mb-4 border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              ← Back to History
            </Button>
          </div>

          {/* Original Input Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Original Request Details</h3>
            <Card className="bg-gradient-to-r from-purple-600 to-indigo-600 border-0 shadow-xl">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-white" />
                  <span className="font-medium text-white">Company:</span>
                  <span className="text-purple-100">{selectedEntry.company_name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Briefcase className="w-5 h-5 text-white" />
                  <span className="font-medium text-white">Job Title:</span>
                  <span className="text-purple-100">{selectedEntry.job_title}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-white" />
                  <span className="font-medium text-white">Created:</span>
                  <span className="text-purple-100">{formatDate(selectedEntry.created_at)}</span>
                </div>
                <div className="space-y-2">
                  <span className="font-medium text-white">Job Description:</span>
                  <div className="text-purple-100 text-sm bg-white/10 p-3 rounded-lg max-h-40 overflow-y-auto">
                    {selectedEntry.job_description}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Generated Results */}
          {selectedEntry.interview_questions ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Generated Interview Prep</h3>
              <InterviewPremiumDisplay 
                interviewData={selectedEntry.interview_questions} 
              />
            </div>
          ) : (
            <Card className="bg-gradient-to-r from-yellow-500 to-orange-500 border-0 shadow-xl">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-white" />
                  <p className="text-white font-medium">Processing Interview Prep</p>
                </div>
                <p className="text-yellow-100 text-sm">Your personalized interview questions are being generated. This usually takes 2-3 minutes.</p>
              </CardContent>
            </Card>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* 60-day retention notice */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-white flex-shrink-0" />
            <div>
              <h4 className="text-white font-semibold text-sm">Data Retention Policy</h4>
              <p className="text-orange-100 text-sm">
                Interview prep history is automatically deleted after 60 days for privacy and storage optimization.
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
            <p className="text-gray-300 text-lg">Loading interview prep history...</p>
          </div>
        ) : !interviewHistory?.length ? (
          <div className="text-center py-12">
            <div className="bg-gradient-to-r from-gray-700 to-gray-800 rounded-xl p-8">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-300 text-lg font-medium mb-2">No Interview Prep History</p>
              <p className="text-gray-400">Your interview preparation sessions will appear here once created.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {interviewHistory.map((entry) => (
              <Card key={entry.id} className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 border border-purple-500/30 hover:border-purple-400/50 transition-all duration-200 cursor-pointer group hover:shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-purple-400" />
                          <span className="font-semibold text-white">{entry.company_name}</span>
                        </div>
                        <Badge className="bg-purple-600/80 text-purple-100 border-purple-500/50 text-xs">
                          {entry.job_title}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2 text-purple-300">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(entry.created_at)}</span>
                        </div>
                        {entry.interview_questions ? (
                          <Badge className="bg-green-600/80 text-green-100 border-green-500/50 text-xs">
                            ✓ Ready
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-600/80 text-yellow-100 border-yellow-500/50 text-xs">
                            ⏳ Processing
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-gray-300 text-sm line-clamp-2 leading-relaxed">
                        {entry.job_description?.substring(0, 120)}...
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      {entry.interview_questions && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleView(entry);
                          }}
                          className="h-9 w-9 p-0 text-purple-300 hover:text-white hover:bg-purple-600/50 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDelete(entry.id, e)}
                        className="h-9 w-9 p-0 text-red-400 hover:text-white hover:bg-red-600/50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-purple-400 text-purple-300 hover:bg-purple-900/50 hover:text-white transition-colors">
          <Clock className="w-4 h-4 mr-2" />
          History
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col bg-gradient-to-br from-gray-900 via-purple-900/20 to-indigo-900/20 border-purple-500/30">
        <DialogHeader className="border-b border-purple-500/30 pb-4">
          <DialogTitle className="text-white text-xl">
            {viewMode === 'view' ? 'Interview Prep Details' : 'Interview Prep History'}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
};
