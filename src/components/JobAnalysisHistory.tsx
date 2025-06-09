
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { History, Trash2, Eye, Clock, Building, Briefcase, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface JobAnalysis {
  id: string;
  company_name: string;
  job_title: string;
  job_description: string;
  job_match: string | null;
  cover_letter: string | null;
  created_at: string;
}

interface JobAnalysisHistoryProps {
  type: 'job_guide' | 'cover_letter';
  gradientColors: string;
  borderColors: string;
}

const JobAnalysisHistory = ({ type, gradientColors, borderColors }: JobAnalysisHistoryProps) => {
  const { user } = useUser();
  const { toast } = useToast();
  const [history, setHistory] = useState<JobAnalysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<JobAnalysis | null>(null);

  const fetchHistory = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', user.id)
        .single();

      if (userError || !userData) {
        throw new Error('User not found');
      }

      let query = supabase
        .from('job_analyses')
        .select('*')
        .eq('user_id', userData.id)
        .order('created_at', { ascending: false });

      if (type === 'job_guide') {
        query = query.not('job_match', 'is', null);
      } else {
        query = query.not('cover_letter', 'is', null);
      }

      const { data, error } = await query;

      if (error) throw error;

      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
      toast({
        title: "Error",
        description: "Failed to load history. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteAnalysis = async (id: string) => {
    try {
      const { error } = await supabase
        .from('job_analyses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setHistory(prev => prev.filter(item => item.id !== id));
      setSelectedAnalysis(null);
      
      toast({
        title: "Deleted",
        description: "Analysis deleted successfully."
      });
    } catch (error) {
      console.error('Error deleting analysis:', error);
      toast({
        title: "Error",
        description: "Failed to delete analysis. Please try again.",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Content copied to clipboard."
      });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast({
        title: "Error",
        description: "Failed to copy content.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const getResultContent = (analysis: JobAnalysis) => {
    return type === 'job_guide' ? analysis.job_match : analysis.cover_letter;
  };

  const getTitle = () => {
    return type === 'job_guide' ? 'Job Guide History' : 'Cover Letter History';
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          onClick={fetchHistory}
          variant="outline"
          className="w-full font-inter font-medium py-3 px-4 text-sm bg-transparent hover:bg-white/10 text-white border-2 border-white/30 hover:border-white/50 transition-all"
        >
          <History className="w-4 h-4 mr-2" />
          View History
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-4xl h-[85vh] overflow-hidden bg-black border-2 border-white/20 p-0">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-black border-b border-white/20 p-6">
          <DialogHeader>
            <DialogTitle className="text-white font-inter text-lg">
              {getTitle()}
            </DialogTitle>
            <DialogDescription className="text-gray-300 font-inter text-sm">
              View your past analyses from the last 60 days. Older records are automatically deleted.
            </DialogDescription>
          </DialogHeader>
        </div>
        
        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 p-6 pt-0">
          <div className="space-y-4 mt-4">
            {loading ? (
              <div className="text-white text-center py-8">Loading history...</div>
            ) : history.length === 0 ? (
              <div className="text-gray-300 text-center py-8">
                No history found. Complete an analysis to see it here.
              </div>
            ) : (
              history.map((analysis) => (
                <Card key={analysis.id} className={`${gradientColors} ${borderColors} shadow-lg w-full`}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white font-inter flex flex-col sm:flex-row sm:items-center justify-between text-sm gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Building className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{analysis.company_name}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              className="bg-white/20 hover:bg-white/30 text-white text-xs px-2 py-1"
                              onClick={() => setSelectedAnalysis(analysis)}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="w-[95vw] max-w-4xl h-[85vh] overflow-hidden bg-black border-2 border-white/20 p-0">
                            {/* Sticky Header for Detail View */}
                            <div className="sticky top-0 z-10 bg-black border-b border-white/20 p-6">
                              <DialogHeader>
                                <DialogTitle className="text-white font-inter text-lg break-words">
                                  {selectedAnalysis?.company_name} - {selectedAnalysis?.job_title}
                                </DialogTitle>
                              </DialogHeader>
                            </div>
                            
                            {/* Scrollable Detail Content */}
                            <div className="overflow-y-auto flex-1 p-6 pt-0">
                              {selectedAnalysis && (
                                <div className="space-y-4 mt-4">
                                  <div className="bg-white/10 rounded-lg p-4">
                                    <h4 className="text-white font-medium mb-2">Job Description:</h4>
                                    <p className="text-gray-300 text-sm whitespace-pre-wrap break-words">
                                      {selectedAnalysis.job_description}
                                    </p>
                                  </div>
                                  <div className="bg-white rounded-lg p-4 relative">
                                    <div className="flex items-center justify-between mb-2">
                                      <h4 className="text-gray-900 font-medium">
                                        {type === 'job_guide' ? 'Job Match Analysis:' : 'Generated Cover Letter:'}
                                      </h4>
                                      {type === 'cover_letter' && (
                                        <Button
                                          size="sm"
                                          onClick={() => copyToClipboard(getResultContent(selectedAnalysis) || '')}
                                          className="bg-blue-500 hover:bg-blue-600 text-white"
                                        >
                                          <Copy className="w-4 h-4 mr-1" />
                                          Copy
                                        </Button>
                                      )}
                                    </div>
                                    <div className="text-gray-800 text-sm whitespace-pre-wrap break-words">
                                      {getResultContent(selectedAnalysis)}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          size="sm"
                          onClick={() => deleteAnalysis(analysis.id)}
                          className="bg-red-500/20 hover:bg-red-500/30 text-red-200 text-xs px-2 py-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardTitle>
                    <CardDescription className="text-white/70 font-inter text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <div className="flex items-center gap-1 min-w-0">
                          <Briefcase className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{analysis.job_title}</span>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Clock className="w-3 h-3" />
                          <span>{format(new Date(analysis.created_at), 'MMM dd, yyyy')}</span>
                        </div>
                      </div>
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JobAnalysisHistory;
