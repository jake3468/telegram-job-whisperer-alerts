
import { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { History, Trash2, Eye, Building, Briefcase, Calendar, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import HistoryModal from '@/components/HistoryModal';

const JobAnalysisHistory = () => {
  const { user } = useUser();
  const { toast } = useToast();
  const { userProfile } = useUserProfile();
  const [showHistory, setShowHistory] = useState(false);

  const handleShowHistory = () => {
    if (!user || !userProfile) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to view your job analysis history.",
        variant: "destructive"
      });
      return;
    }
    setShowHistory(true);
  };

  return (
    <>
      <Card className="bg-gradient-to-br from-cyan-400 via-teal-300 to-teal-500 border-white/10 backdrop-blur-md shadow-xl">
        <CardHeader className="pb-6">
          <CardTitle className="font-inter text-lg sm:text-xl flex items-center gap-2 text-black font-bold drop-shadow">
            <History className="w-5 h-5 text-black drop-shadow flex-shrink-0" />
            <span>Job Analysis History</span>
          </CardTitle>
          <CardDescription className="text-black/80 font-inter mb-0 text-sm sm:text-base">
            View and manage your previous job analyses
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Button 
            onClick={handleShowHistory} 
            className="w-full bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-500 hover:from-teal-500 hover:via-cyan-500 hover:to-teal-600 text-black font-semibold text-base h-12 shadow-md"
          >
            <History className="w-5 h-5 mr-2" />
            View History
          </Button>
        </CardContent>
      </Card>

      <HistoryModal 
        type="job_analyses" 
        isOpen={showHistory} 
        onClose={() => setShowHistory(false)} 
        gradientColors="from-cyan-400 to-teal-400" 
      />
    </>
  );
};

export default JobAnalysisHistory;
