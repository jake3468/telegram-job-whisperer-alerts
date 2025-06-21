
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Eye, Clock, Building2, Briefcase } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useUserProfile } from '@/hooks/useUserProfile';
import { PremiumInterviewDisplay } from './PremiumInterviewDisplay';

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
              className="mb-4"
            >
              ← Back to History
            </Button>
          </div>

          {/* Original Input Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Original Request Details</h3>
            <Card className="bg-gradient-to-r from-[#ddd6f3] to-[#faaca8] border-0">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-black" />
                  <span className="font-medium text-black">Company:</span>
                  <span className="text-black">{selectedEntry.company_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-black" />
                  <span className="font-medium text-black">Job Title:</span>
                  <span className="text-black">{selectedEntry.job_title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-black" />
                  <span className="font-medium text-black">Created:</span>
                  <span className="text-black">{formatDate(selectedEntry.created_at)}</span>
                </div>
                <div className="space-y-2">
                  <span className="font-medium text-black">Job Description:</span>
                  <div className="text-black text-sm bg-black/10 p-2 rounded max-h-32 overflow-y-auto">
                    {selectedEntry.job_description}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Generated Results */}
          {selectedEntry.interview_questions ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Generated Interview Prep</h3>
              <PremiumInterviewDisplay 
                interviewData={typeof selectedEntry.interview_questions === 'string' 
                  ? selectedEntry.interview_questions 
                  : JSON.stringify(selectedEntry.interview_questions)} 
              />
            </div>
          ) : (
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-4 text-center">
                <p className="text-yellow-800">Interview prep results are still being generated...</p>
              </CardContent>
            </Card>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading interview prep history...</p>
          </div>
        ) : !interviewHistory?.length ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No interview prep history found.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {interviewHistory.map((entry) => (
              <Card key={entry.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{entry.company_name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {entry.job_title}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(entry.created_at)}</span>
                        {entry.interview_questions ? (
                          <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                            Completed
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-yellow-600 border-yellow-600 text-xs">
                            Processing
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {entry.job_description?.substring(0, 100)}...
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-1 ml-4">
                      {entry.interview_questions && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleView(entry);
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDelete(entry.id, e)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
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
        <Button variant="outline" size="sm" className="border-black text-black hover:bg-gray-100">
          <Clock className="w-4 h-4 mr-2" />
          History
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
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
