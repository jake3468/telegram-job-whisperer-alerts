
import { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { History, FileText, Briefcase, Building, Calendar, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface JobAnalysisHistoryProps {
  type: 'job_guide' | 'cover_letter';
  gradientColors: string;
  borderColors: string;
}

const JobAnalysisHistory = ({ type, gradientColors, borderColors }: JobAnalysisHistoryProps) => {
  const { user } = useUser();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);

  const fetchHistory = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Get user's database ID first
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', user.id)
        .single();

      if (userError || !userData) {
        throw new Error('User not found in database');
      }

      // Get user profile ID
      const { data: profileData, error: profileError } = await supabase
        .from('user_profile')
        .select('id')
        .eq('user_id', userData.id)
        .single();

      if (profileError || !profileData) {
        throw new Error('User profile not found');
      }

      // Determine which table to query based on type
      const tableName = type === 'job_guide' ? 'job_analyses' : 'job_cover_letters';
      const resultField = type === 'job_guide' ? 'job_match' : 'cover_letter';
      
      const { data, error } = await supabase
        .from(tableName)
        .select(`
          id,
          company_name,
          job_title,
          job_description,
          ${resultField},
          created_at
        `)
        .eq('user_id', profileData.id)
        .not(resultField, 'is', null)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching history:', error);
        throw error;
      }

      setHistoryData(data || []);
      setIsOpen(true);
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

  const handleUseHistory = (item: any) => {
    // Emit a custom event with the history data
    const event = new CustomEvent('useHistoryData', {
      detail: {
        companyName: item.company_name,
        jobTitle: item.job_title,
        jobDescription: item.job_description,
        result: type === 'job_guide' ? item.job_match : item.cover_letter,
        type
      }
    });
    window.dispatchEvent(event);
    
    setIsOpen(false);
    toast({
      title: "History Loaded",
      description: `Previous ${type === 'job_guide' ? 'job analysis' : 'cover letter'} has been loaded.`
    });
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

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (isOpen) {
    return (
      <Card className={`${gradientColors} ${borderColors} shadow-2xl`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-white font-inter flex items-center gap-2 text-sm">
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
              <History className="w-3 h-3 text-white" />
            </div>
            {type === 'job_guide' ? 'Job Analysis History' : 'Cover Letter History'}
            <Button 
              onClick={() => setIsOpen(false)} 
              size="sm" 
              className="ml-auto bg-white/20 hover:bg-white/30 text-white border-white/20 text-xs px-2 py-1"
            >
              Close
            </Button>
          </CardTitle>
          <CardDescription className="text-white/80 font-inter text-xs">
            {historyData.length === 0 
              ? `No previous ${type === 'job_guide' ? 'job analyses' : 'cover letters'} found.`
              : `Found ${historyData.length} previous ${type === 'job_guide' ? 'job analyses' : 'cover letters'}.`
            }
          </CardDescription>
        </CardHeader>
        
        {historyData.length > 0 && (
          <CardContent className="pt-0 max-h-96 overflow-y-auto">
            <div className="space-y-3">
              {historyData.map((item) => (
                <Card key={item.id} className="bg-white/10 border-white/20">
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-white">
                        <Building className="w-3 h-3" />
                        <span className="font-medium text-xs">{item.company_name}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-white/90">
                        <Briefcase className="w-3 h-3" />
                        <span className="text-xs">{item.job_title}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-white/80">
                        <Calendar className="w-3 h-3" />
                        <span className="text-xs">{formatDate(item.created_at)}</span>
                      </div>
                      
                      <div className="text-white/70 text-xs">
                        <div className="font-medium mb-1">Job Description:</div>
                        <div className="bg-white/5 rounded p-2 text-xs">
                          {truncateText(item.job_description, 150)}
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => handleUseHistory(item)}
                        size="sm"
                        className="w-full bg-white/20 hover:bg-white/30 text-white border-white/20 text-xs"
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        Use This {type === 'job_guide' ? 'Analysis' : 'Cover Letter'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    );
  }

  return (
    <Button
      onClick={fetchHistory}
      disabled={isLoading}
      className="w-full bg-white/20 hover:bg-white/30 text-white border-white/20 text-xs px-4 py-2"
    >
      <div className="flex items-center justify-center gap-2 w-full">
        {isLoading ? (
          <>
            <Loader2 className="w-3 h-3 flex-shrink-0 animate-spin" />
            <span className="text-center text-xs">Loading...</span>
          </>
        ) : (
          <>
            <History className="w-3 h-3 flex-shrink-0" />
            <span className="text-center text-xs">
              View {type === 'job_guide' ? 'Job Analysis' : 'Cover Letter'} History
            </span>
          </>
        )}
      </div>
    </Button>
  );
};

export default JobAnalysisHistory;
