import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Clock, Building2, Briefcase, FileText, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCreditCheck } from '@/hooks/useCreditCheck';
import { useCreditWarnings } from '@/hooks/useCreditWarnings';
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
  const { toast } = useToast();
  
  // Use credit check for 6.0 credits required for interview prep
  const {
    hasCredits,
    showInsufficientCreditsPopup
  } = useCreditCheck(6.0);
  useCreditWarnings(); // This shows the warning popups

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
      }, 3, 'fetch interview history');
    },
    enabled: !!userProfile?.id && isAuthReady,
    retry: 2
  });

  // Function to properly parse interview questions from JSONB
  const parseInterviewQuestions = (data: any): string | null => {
    if (!data) return null;
    
    try {
      // If it's already a string, return it
      if (typeof data === 'string') {
        return data.trim().length > 0 ? data : null;
      }
      
      // If it's an object, stringify it and check if it's not empty
      if (typeof data === 'object') {
        const stringified = JSON.stringify(data);
        return stringified !== '{}' && stringified !== 'null' ? stringified : null;
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing interview questions:', error);
      return null;
    }
  };

  // Function to check for existing completed results on mount
  const checkForExistingResults = async () => {
    if (!currentAnalysis?.id || !isAuthReady) return;
    
    try {
      console.log('🔍 Checking for existing results for analysis:', currentAnalysis.id);
      
      const result = await executeWithRetry(async () => {
        const { data, error } = await supabase
          .from('interview_prep')
          .select('interview_questions')
          .eq('id', currentAnalysis.id)
          .not('interview_questions', 'is', null)
          .single();
        
        if (error) {
          if (error.code === 'PGRST116') {
            // No data found, which is fine
            return null;
          }
          throw error;
        }
        return data;
      }, 3, 'check existing results');

      if (result?.interview_questions) {
        console.log('✅ Found existing completed results');
        const parsedData = parseInterviewQuestions(result.interview_questions);
        
        if (parsedData) {
          setInterviewData(parsedData);
          setIsGenerating(false);
          
          toast({
            title: "Interview Prep Ready!",
            description: "Your interview questions are ready."
          });
        }
      }
    } catch (error) {
      console.error('❌ Error checking for existing results:', error);
    }
  };

  // Check for existing results when currentAnalysis changes
  useEffect(() => {
    if (currentAnalysis?.id && isAuthReady && !interviewData) {
      checkForExistingResults();
    }
  }, [currentAnalysis?.id, isAuthReady, interviewData]);

  // Enhanced real-time subscription with proper channel configuration
  useEffect(() => {
    if (!currentAnalysis?.id || !isAuthReady) return;
    
    console.log('🔄 Setting up real-time subscription for:', currentAnalysis.id);
    
    const channel = supabase
      .channel(`interview-prep-${currentAnalysis.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'interview_prep',
        filter: `id=eq.${currentAnalysis.id}`
      }, async (payload) => {
        console.log('📡 Interview prep updated via real-time:', payload);
        
        if (payload.new && payload.new.interview_questions) {
          const parsedData = parseInterviewQuestions(payload.new.interview_questions);
          
          if (parsedData) {
            console.log('✅ Setting interview data from real-time update');
            setInterviewData(parsedData);
            setIsGenerating(false);
            
            toast({
              title: "Interview Prep Ready!",
              description: "Your personalized interview questions have been generated."
            });
          }
        }
      })
      .subscribe((status) => {
        console.log('📡 Real-time subscription status:', status);
      });

    // Improved fallback polling mechanism
    const pollInterval = setInterval(async () => {
      if (!isGenerating || interviewData) {
        return;
      }
      
      try {
        console.log('🔄 Fallback polling for results...');
        await checkForExistingResults();
      } catch (error) {
        console.error('❌ Fallback polling error:', error);
      }
    }, 3000); // Poll every 3 seconds
    
    return () => {
      console.log('🧹 Cleaning up real-time subscription');
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [currentAnalysis?.id, isAuthReady, isGenerating, interviewData]);

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

    // Check credits first
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
            const parsedData = typeof existing.interview_questions === 'string' 
              ? existing.interview_questions 
              : JSON.stringify(existing.interview_questions);
            
            setInterviewData(parsedData);
            setCurrentAnalysis({ id: existing.id });
            setIsSubmitting(false);
            toast({
              title: "Previous Interview Prep Found",
              description: "Using your previous interview prep for this job posting."
            });
            return;
          } catch (error) {
            console.error('Error parsing existing interview questions:', error);
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
            description: "Your personalized interview questions are being generated."
          });
        }
      }, 5, 'generate interview prep');

    } catch (error) {
      console.error('❌ SUBMISSION ERROR:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate interview prep';
      
      // Provide user-friendly error messages
      let friendlyMessage = "There was an issue starting your interview prep. Please try again.";
      if (errorMessage.toLowerCase().includes('jwt') || errorMessage.toLowerCase().includes('expired')) {
        friendlyMessage = "Your session needs to be refreshed. Please try again in a moment.";
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
  };

  const renderInterviewQuestions = (content: string) => {
    if (!content) return null;

    // Parse the content if it's JSON
    let displayContent = content;
    try {
      const parsed = JSON.parse(content);
      if (typeof parsed === 'object' && parsed.content) {
        displayContent = parsed.content;
      } else if (typeof parsed === 'string') {
        displayContent = parsed;
      }
    } catch (e) {
      // If it's not JSON, use as is
      displayContent = content;
    }

    // Simple markdown parsing with smaller text sizes
    const processedContent = displayContent
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

  // Check if form is valid and user has credits
  const isFormValid = companyName.trim() && jobTitle.trim() && jobDescription.trim();
  const canSubmit = isFormValid && hasCredits && !isSubmitting && !isGenerating;

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
                Usage Fee: 6.0 credits
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
                  disabled={!canSubmit} 
                  className={`w-full sm:flex-1 text-white font-medium ${
                    canSubmit 
                      ? "bg-rose-600 hover:bg-rose-500" 
                      : "bg-gray-500 text-gray-300 cursor-not-allowed"
                  }`}
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
