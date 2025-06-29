
import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Clock, Building2, Briefcase, FileText, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFeatureCreditCheck } from '@/hooks/useFeatureCreditCheck';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import LoadingMessages from '@/components/LoadingMessages';
import { useUser } from '@clerk/clerk-react';
import { useEnterpriseAuth } from '@/hooks/useEnterpriseAuth';
import { InterviewPrepHistoryModal } from '@/components/InterviewPrepHistoryModal';
import InterviewPrepDownloadActions from '@/components/InterviewPrepDownloadActions';
import { ProfileCompletionWarning } from '@/components/ProfileCompletionWarning';

const InterviewPrep = () => {
  // Use enterprise-level authentication
  const { isAuthReady, executeWithRetry } = useEnterpriseAuth();
  const { user } = useUser();
  const [companyName, setCompanyName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<any>(null);
  const [interviewData, setInterviewData] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [creditsDeducted, setCreditsDeducted] = useState(false);
  const { toast } = useToast();
  
  // Use the new feature credit check system
  const {
    hasCredits,
    requiredCredits,
    isLoading: isCheckingCredits,
    checkAndDeductCredits,
    showInsufficientCreditsPopup
  } = useFeatureCreditCheck({
    feature: 'INTERVIEW_PREP',
    onSuccess: () => {
      console.log('✅ Credits successfully deducted for Interview Prep');
    },
    onInsufficientCredits: () => {
      console.log('❌ Insufficient credits for Interview Prep');
    }
  });

  const { userProfile } = useUserProfile();

  // Query for existing interview prep data with retry logic
  const {
    data: interviewHistory,
    refetch: refetchHistory
  } = useQuery({
    queryKey: ['interview-prep-history', userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id || !isAuthReady) return [];
      
      return executeWithRetry(async () => {
        const { data, error } = await supabase
          .from('interview_prep')
          .select('*')
          .eq('user_id', userProfile.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data || [];
      });
    },
    enabled: !!userProfile?.id && isAuthReady,
    retry: (failureCount, error) => {
      // Retry up to 3 times for network/auth errors
      return failureCount < 3 && (
        error?.message?.toLowerCase().includes('jwt') ||
        error?.message?.toLowerCase().includes('network')
      );
    }
  });

  // Real-time subscription for interview results with enhanced error handling
  useEffect(() => {
    if (!currentAnalysis?.id || !isAuthReady) return;
    
    const channel = supabase
      .channel('interview-prep-updates')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'interview_prep',
        filter: `id=eq.${currentAnalysis.id}`
      }, async (payload) => {
        console.log('Interview prep updated:', payload);
        
        if (payload.new.interview_questions && !creditsDeducted) {
          try {
            // Handle both string and already parsed data
            const parsedData = typeof payload.new.interview_questions === 'string' 
              ? payload.new.interview_questions 
              : JSON.stringify(payload.new.interview_questions);

            // Check if the data is meaningful (not just empty or null)
            if (parsedData && parsedData.trim().length > 0) {
              // Deduct credits when results are successfully received using enterprise auth
              const creditDeductionSuccess = await executeWithRetry(async () => {
                return await checkAndDeductCredits('Interview prep questions generated');
              });
              
              if (creditDeductionSuccess) {
                setInterviewData(parsedData);
                setIsGenerating(false);
                setCreditsDeducted(true);
                toast({
                  title: "Interview Prep Ready!",
                  description: `Your personalized interview questions have been generated. ${requiredCredits} credits deducted.`
                });
              } else {
                // Handle credit deduction failure
                setIsGenerating(false);
                toast({
                  title: "Processing Complete",
                  description: "Your interview prep is ready, but there was an issue with credit processing.",
                  variant: "destructive"
                });
              }
            }
          } catch (error) {
            console.error('Error processing interview questions:', error);
            setIsGenerating(false);
            toast({
              title: "Processing Error",
              description: "Your interview prep may be ready, but there was a processing issue. Please check your history.",
              variant: "destructive"
            });
          }
        }
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentAnalysis?.id, creditsDeducted, checkAndDeductCredits, requiredCredits, toast, isAuthReady, executeWithRetry]);

  const handleGenerate = async () => {
    console.log('🚀 Interview Prep Generate Button Clicked');

    // Check authentication readiness
    if (!isAuthReady) {
      toast({
        title: "Authentication Loading",
        description: "Please wait while we prepare your session...",
        variant: "destructive"
      });
      return;
    }

    // Check credits first (but don't deduct yet)
    if (!hasCredits) {
      showInsufficientCreditsPopup();
      return;
    }

    if (!companyName.trim() || !jobTitle.trim() || !jobDescription.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields before generating interview prep."
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to generate interview prep."
      });
      return;
    }

    if (!userProfile?.id) {
      toast({
        title: "Profile Loading",
        description: "Please wait while we load your profile..."
      });
      return;
    }

    if (isSubmitting || isGenerating) {
      toast({
        title: "Please wait",
        description: "Your interview prep is already being generated."
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setInterviewData(null);
      setCreditsDeducted(false);
      console.log('✅ Starting interview prep submission process');

      // Use enterprise auth for all database operations
      await executeWithRetry(async () => {
        // Check for existing analysis first
        const { data: existingAnalysis, error: checkError } = await supabase
          .from('interview_prep')
          .select('id, interview_questions')
          .eq('user_id', userProfile.id)
          .eq('company_name', companyName.trim())
          .eq('job_title', jobTitle.trim())
          .eq('job_description', jobDescription.trim())
          .not('interview_questions', 'is', null)
          .order('created_at', { ascending: false })
          .limit(1);

        if (!checkError && existingAnalysis && existingAnalysis.length > 0) {
          const existing = existingAnalysis[0];
          console.log('✅ Found existing interview prep:', existing.id);
          
          try {
            // Handle both string and object data
            const parsedData = typeof existing.interview_questions === 'string' 
              ? existing.interview_questions 
              : JSON.stringify(existing.interview_questions);
            
            // Deduct credits for existing result as well
            const creditDeductionSuccess = await checkAndDeductCredits('Existing interview prep retrieved');
            
            if (creditDeductionSuccess) {
              setInterviewData(parsedData);
              setCurrentAnalysis({ id: existing.id });
              setCreditsDeducted(true);
              setIsSubmitting(false);
              toast({
                title: "Previous Interview Prep Found",
                description: `Using your previous interview prep for this job posting. ${requiredCredits} credits deducted.`
              });
              return;
            } else {
              toast({
                title: "Credit Processing Issue",
                description: "Found existing interview prep but had trouble processing credits. Please try again."
              });
              setIsSubmitting(false);
              return;
            }
          } catch (error) {
            console.error('Error parsing existing interview questions:', error);
            // Continue with new generation if parsing fails
          }
        }

        // Insert new interview prep record
        const insertData = {
          user_id: userProfile.id,
          company_name: companyName.trim(),
          job_title: jobTitle.trim(),
          job_description: jobDescription.trim()
        };
        
        console.log('📝 Inserting interview prep data:', insertData);
        
        const { data: insertedData, error: insertError } = await supabase
          .from('interview_prep')
          .insert(insertData)
          .select('id')
          .single();

        if (insertError) {
          console.error('❌ INSERT ERROR:', insertError);
          throw new Error(`Failed to create interview prep: ${insertError.message}`);
        }

        if (insertedData?.id) {
          console.log('✅ Interview prep record inserted:', insertedData.id);
          setCurrentAnalysis(insertedData);
          setIsGenerating(true);
          refetchHistory();
          toast({
            title: "Interview Prep Started!",
            description: `Your personalized interview questions are being generated. ${requiredCredits} credits will be deducted when ready.`
          });
        }
      });

    } catch (error) {
      console.error('❌ SUBMISSION ERROR:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate interview prep';
      
      // Provide user-friendly error messages
      let friendlyMessage = "There was an issue starting your interview prep. Please try again.";
      if (errorMessage.toLowerCase().includes('jwt') || errorMessage.toLowerCase().includes('expired')) {
        friendlyMessage = "Your session has expired. Please refresh the page and try again.";
      } else if (errorMessage.toLowerCase().includes('network')) {
        friendlyMessage = "Network connection issue. Please check your connection and try again.";
      }
      
      toast({
        title: "Generation Failed",
        description: friendlyMessage,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setCompanyName('');
    setJobTitle('');
    setJobDescription('');
    setInterviewData(null);
    setCurrentAnalysis(null);
    setIsGenerating(false);
    setCreditsDeducted(false);
  };

  const renderInterviewQuestions = (content: string) => {
    if (!content) return null;

    // Simple markdown parsing with smaller text sizes
    const processedContent = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold text
      .replace(/^# (.*$)/gim, '<h1 style="font-size: 1.125rem; font-weight: bold; margin: 0.75rem 0; color: #1e40af;">$1</h1>') // H1 headers - smaller
      .replace(/^## (.*$)/gim, '<h2 style="font-size: 1rem; font-weight: bold; margin: 0.5rem 0; color: #2563eb;">$1</h2>') // H2 headers - smaller
      .replace(/^### (.*$)/gim, '<h3 style="font-size: 0.95rem; font-weight: bold; margin: 0.375rem 0; color: #3b82f6;">$1</h3>') // H3 headers - smaller
      .replace(/\n/g, '<br>'); // Line breaks

    return (
      <div 
        className="text-gray-800 bg-white rounded p-4 font-inter text-sm leading-relaxed whitespace-pre-wrap break-words border border-gray-700" 
        dangerouslySetInnerHTML={{ __html: processedContent }} 
      />
    );
  };

  return (
    <Layout>
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-2 sm:px-4 pt-2 pb-2 max-w-5xl">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8 px-1 sm:px-2">
            <h1 className="mb-4 bg-gradient-to-r from-[#ddd6f3] to-[#faaca8] bg-clip-text text-red-200 font-extrabold sm:text-4xl text-4xl">
              👔 Interview Prep
            </h1>
            <p className="text-gray-300 max-w-2xl mx-auto text-sm sm:text-lg font-light px-2 sm:px-4">
              Your Personal Interview Coach, powered by AI. Get tailored questions with perfect answers, pro tips, and strategic questions to ask your interviewer.
            </p>
            
            {/* Usage Fee Badge */}
            <div className="mt-4 flex justify-center">
              <Badge variant="outline" className="bg-blue-900/20 border-blue-400/30 text-blue-200 px-3 py-1">
                <CreditCard className="w-4 h-4 mr-2" />
                Usage Fee: {requiredCredits} credits
              </Badge>
            </div>
          </div>

          {/* Profile Completion Warning */}
          <ProfileCompletionWarning />

          {/* Form - Always visible */}
          <Card className="mb-6 sm:mb-8 bg-gradient-to-r from-[#ddd6f3] to-[#faaca8] border-0 mx-1 sm:mx-0">
            <CardHeader className="pb-4 px-4 sm:px-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="text-black text-lg sm:text-xl">Interview Preparation Details</CardTitle>
                <div className="flex-shrink-0">
                  <InterviewPrepHistoryModal />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 px-4 sm:px-6">
              {/* Company Name and Job Title in horizontal layout for desktop */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-black flex items-center gap-2">
                    🏦 Company Name
                  </label>
                  <Input 
                    value={companyName} 
                    onChange={(e) => setCompanyName(e.target.value)} 
                    placeholder="e.g., Google, Microsoft, Amazon" 
                    disabled={isGenerating || isSubmitting} 
                    className="border-gray-300 placeholder-gray-400 bg-black text-white w-full" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-black flex items-center gap-2">
                    👨‍💼 Job Title
                  </label>
                  <Input 
                    value={jobTitle} 
                    onChange={(e) => setJobTitle(e.target.value)} 
                    placeholder="e.g., Senior Software Engineer, Product Manager" 
                    disabled={isGenerating || isSubmitting} 
                    className="border-gray-300 placeholder-gray-400 bg-black text-white w-full" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-black flex items-center gap-2">
                  📋 Job Description
                </label>
                <Textarea 
                  value={jobDescription} 
                  onChange={(e) => setJobDescription(e.target.value)} 
                  placeholder="Paste the complete job description here..." 
                  disabled={isGenerating || isSubmitting} 
                  className="border-gray-300 placeholder-gray-400 min-h-32 bg-black text-white w-full resize-none" 
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button 
                  onClick={handleGenerate} 
                  disabled={isGenerating || isSubmitting || isCheckingCredits || !isAuthReady} 
                  className="w-full sm:flex-1 text-white font-medium bg-rose-600 hover:bg-rose-500"
                >
                  {isGenerating || isSubmitting ? 'Generating...' : 'Generate Interview Prep'}
                </Button>
                <Button 
                  onClick={handleReset} 
                  variant="outline" 
                  disabled={isGenerating || isSubmitting} 
                  className="w-full sm:w-auto px-6 border-black text-black hover:bg-gray-100"
                >
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Loading */}
          {isGenerating && (
            <div className="text-center py-8 px-2">
              <LoadingMessages type="interview_prep" />
            </div>
          )}

          {/* Results - Show below form when available */}
          {interviewData && (
            <div className="w-full space-y-6 px-1 sm:px-0">
              <div className="rounded-lg p-4 border border-white/10 shadow-inner bg-red-700">
                <h3 className="text-white font-medium mb-3 flex flex-wrap gap-2 justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Interview Prep Result
                  </div>
                  <div className="flex-shrink-0">
                    <InterviewPrepDownloadActions 
                      interviewData={interviewData} 
                      jobTitle={jobTitle} 
                      companyName={companyName} 
                      contrast={true} 
                    />
                  </div>
                </h3>

                <div className="bg-gray-900 rounded-lg p-3 sm:p-4 border border-gray-700">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-lime-400 font-semibold">Interview Questions & Answers</h4>
                  </div>
                  
                  {renderInterviewQuestions(interviewData)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default InterviewPrep;
