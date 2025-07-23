import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableFooter,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { useUser } from "@clerk/clerk-react"
import { useEffect, useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { supabase, makeAuthenticatedRequest } from "@/integrations/supabase/client"
import { useUserProfile } from "@/hooks/useUserProfile"
import { Loader2 } from "lucide-react"
import { format } from 'date-fns';

interface GraceInterviewReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface HistoryItem {
  id: string;
  phone_number: string;
  company_name: string;
  job_title: string;
  job_description: string;
  status: string;
  created_at: string;
  interview_status?: string;
  completion_percentage?: number;
  time_spent?: number;
  feedback_message?: string;
  feedback_suggestion?: string;
  feedback_next_action?: string;
  report_generated?: boolean;
  executive_summary?: string;
  overall_scores?: any;
  strengths?: string;
  areas_for_improvement?: string;
  detailed_feedback?: string;
  motivational_message?: string;
  actionable_plan?: string;
  next_steps_priority?: string;
}

const GraceInterviewReportsModal = ({ isOpen, onClose }: GraceInterviewReportsModalProps) => {
  const { user, isLoaded } = useUser();
  const { userProfile } = useUserProfile();
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, user?.id, userProfile?.user_id]);

  const fetchHistory = async () => {
    if (!isLoaded || !user || !userProfile) {
      console.log('[GraceInterviewReportsModal] Missing dependencies:', { isLoaded, user: !!user, userProfile: !!userProfile });
      return;
    }
    
    console.log('[GraceInterviewReportsModal] Fetching history for user profile:', userProfile.id);
    setIsLoading(true);
    
    try {
      console.log('[GraceInterviewReportsModal] Making authenticated request to grace_interview_requests');
      
      // CRITICAL FIX: Use makeAuthenticatedRequest for proper JWT token handling
      const { data, error } = await makeAuthenticatedRequest(async () => {
        return await supabase
          .from('grace_interview_requests')
          .select(`
            id,
            phone_number,
            company_name,
            job_title,
            job_description,
            status,
            created_at,
            interview_status,
            completion_percentage,
            time_spent,
            feedback_message,
            feedback_suggestion,
            feedback_next_action,
            report_generated,
            executive_summary,
            overall_scores,
            strengths,
            areas_for_improvement,
            detailed_feedback,
            motivational_message,
            actionable_plan,
            next_steps_priority
          `)
          .eq('user_id', userProfile.id)
          .order('created_at', { ascending: false })
          .limit(20);
      }, { operationType: 'fetch_grace_interview_history' });

      if (error) {
        console.error('[GraceInterviewReportsModal] Supabase error:', error);
        throw error;
      }

      console.log('[GraceInterviewReportsModal] Successfully fetched data:', data?.length || 0, 'records');
      setHistoryData(data || []);
      
    } catch (err) {
      console.error('[GraceInterviewReportsModal] Failed to fetch interview history:', err);
      toast({
        title: "Error",
        description: "Failed to load interview history. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">
      <div className="flex items-center justify-center min-h-screen">
        <div className="relative w-full max-w-4xl mx-auto my-12 bg-white rounded-lg shadow-lg">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">Interview History</h2>
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
            </div>
            
            {isLoading ? (
              <div className="flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="ml-2">Loading history...</span>
              </div>
            ) : (
              <ScrollArea className="rounded-md border h-[400px] w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Date</TableHead>
                      <TableHead>Job Title</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{format(new Date(item.created_at), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>{item.job_title}</TableCell>
                        <TableCell>{item.company_name}</TableCell>
                        <TableCell>{item.interview_status || item.status}</TableCell>
                      </TableRow>
                    ))}
                    {historyData.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center">No interview history found.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GraceInterviewReportsModal;
