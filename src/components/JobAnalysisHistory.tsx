
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { History, Trash2, Eye, Clock, Building, Briefcase, Copy, X } from 'lucide-react';
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
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard.",
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
          className="w-full font-inter font-medium py-3 px-4 text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 border border-gray-300"
        >
          <History className="w-4 h-4 mr-2" />
          View History
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-4xl h-[90vh] overflow-hidden bg-black border-2 border-white/20 p-0">
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
          {/* Custom close button */}
          <button
            onClick={() => setSelectedAnalysis(null)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none bg-white/20 hover:bg-white/30 p-2"
          >
            <X className="h-4 w-4 text-white" />
            <span className="sr-only">Close</span>
          </button>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 pt-2">
          {loading ? (
            <div className="text-white text-center py-8">Loading history...</div>
          ) : history.length === 0 ? (
            <div className="text-gray-300 text-center py-8">
              No history found. Complete an analysis to see it here.
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((analysis) => (
                <Card key={analysis.id} className={`${gradientColors} ${borderColors} shadow-lg`}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white font-inter flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Building className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{analysis.company_name}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              className="bg-white/20 hover:bg-white/30 text-white text-xs px-2 py-1 h-auto"
                              onClick={() => setSelectedAnalysis(analysis)}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="w-[95vw] max-w-4xl h-[90vh] overflow-hidden bg-black border-2 border-white/20 p-0">
                            {/* Sticky Header for Detail View */}
                            <div className="sticky top-0 z-10 bg-black border-b border-white/20 p-6">
                              <DialogHeader>
                                <DialogTitle className="text-white font-inter text-lg pr-8">
                                  {selectedAnalysis?.company_name} - {selectedAnalysis?.job_title}
                                </DialogTitle>
                              </DialogHeader>
                              {/* Custom close button for detail view */}
                              <button
                                className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none bg-white/20 hover:bg-white/30 p-2"
                              >
                                <X className="h-4 w-4 text-white" />
                                <span className="sr-only">Close</span>
                              </button>
                            </div>
                            
                            {/* Scrollable Detail Content */}
                            {selectedAnalysis && (
                              <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-4">
                                <div className="bg-white/10 rounded-lg p-4">
                                  <h4 className="text-white font-medium mb-2">Job Description:</h4>
                                  <p className="text-gray-300 text-sm whitespace-pre-wrap break-words">
                                    {selectedAnalysis.job_description}
                                  </p>
                                </div>
                                <div className="bg-white rounded-lg p-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-gray-900 font-medium">
                                      {type === 'job_guide' ? 'Job Match Analysis:' : 'Generated Cover Letter:'}
                                    </h4>
                                    {type === 'cover_letter' && getResultContent(selectedAnalysis) && (
                                      <Button
                                        size="sm"
                                        onClick={() => copyToClipboard(getResultContent(selectedAnalysis) || '')}
                                        className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 h-auto"
                                      >
                                        <Copy className="w-3 h-3 mr-1" />
                                        Copy
                                      </Button>
                                    )}
                                  </div>
                                  <div className="text-gray-800 text-sm whitespace-pre-wrap break-words leading-relaxed">
                                    {getResultContent(selectedAnalysis)}
                                  </div>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        <Button
                          size="sm"
                          onClick={() => deleteAnalysis(analysis.id)}
                          className="bg-red-500/20 hover:bg-red-500/30 text-red-200 text-xs px-2 py-1 h-auto"
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
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JobAnalysisHistory;
