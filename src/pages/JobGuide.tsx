
import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Briefcase, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCreditCheck } from '@/hooks/useCreditCheck';
import { useDeferredCreditDeduction } from '@/hooks/useDeferredCreditDeduction';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { PremiumAnalysisResults } from '@/components/PremiumAnalysisResults';
import LoadingMessages from '@/components/LoadingMessages';
import { useUser } from '@clerk/clerk-react';
import { useClerkSupabaseSync } from '@/hooks/useClerkSupabaseSync';
import JobAnalysisHistoryModal from '@/components/JobAnalysisHistoryModal';
import { ProfileCompletionWarning } from '@/components/ProfileCompletionWarning';

const JobGuide = () => {
  // Ensure Clerk JWT is synced with Supabase
  useClerkSupabaseSync();
  
  const { user } = useUser();
  const [companyName, setCompanyName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<any>(null);
  const [jobAnalysisResult, setJobAnalysisResult] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasCreditBeenDeducted, setHasCreditBeenDeducted] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  
  const { toast } = useToast();
  const { hasCredits, showInsufficientCreditsPopup } = useCreditCheck(1);
  const { deductCredits } = useDeferredCreditDeduction();
  const { userProfile } = useUserProfile();

  // Query for existing job analysis data
  const { data: jobHistory, refetch: refetchHistory } = useQuery({
    queryKey: ['job-analysis-history', userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id) return [];
      
      const { data, error } = await supabase
        .from('job_analyses')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!userProfile?.id,
  });

  // Real-time subscription for job analysis results
  useEffect(() => {
    if (!currentAnalysis?.id) return;

    const channel = supabase
      .channel('job-analysis-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'job_analyses',
          filter: `id=eq.${currentAnalysis.id}`,
        },
        (payload) => {
          console.log('Job analysis updated:', payload);
          if (payload.new.job_match) {
            try {
              const parsedData = typeof payload.new.job_match === 'string' 
                ? payload.new.job_match 
                : JSON.stringify(payload.new.job_match);

              if (parsedData && parsedData.trim().length > 0) {
                setJobAnalysisResult(parsedData);
                setIsGenerating(false);
                toast({
                  title: "Job Analysis Ready!",
                  description: "Your personalized job analysis has been generated."
                });
              }
            } catch (error) {
              console.error('Error processing job analysis:', error);
              setIsGenerating(false);
              toast({
                title: "Error Processing Results",
                description: "There was an error processing your job analysis results.",
                variant: "destructive"
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentAnalysis?.id, toast]);

  // Deferred credit deduction when job analysis results are displayed
  useEffect(() => {
    if (jobAnalysisResult && !hasCreditBeenDeducted && currentAnalysis?.id) {
      const deductCreditsForJobAnalysis = async () => {
        const success = await deductCredits(1, 'job_analysis', 'Job Analysis - Company match and insights');
        if (success) {
          setHasCreditBeenDeducted(true);
          console.log('Successfully deducted 1 credit for job analysis display');
        }
      };
      
      deductCreditsForJobAnalysis();
    }
  }, [jobAnalysisResult, hasCreditBeenDeducted, currentAnalysis?.id, deductCredits]);

  const handleGenerate = async () => {
    console.log('🚀 Job Analysis Generate Button Clicked');

    // Check credits first
    if (!hasCredits) {
      showInsufficientCreditsPopup();
      return;
    }

    if (!companyName.trim() || !jobTitle.trim() || !jobDescription.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields before generating job analysis.",
        variant: "destructive"
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Authentication Error", 
        description: "Please sign in to generate job analysis.",
        variant: "destructive"
      });
      return;
    }

    if (!userProfile?.id) {
      toast({
        title: "Profile Error",
        description: "User profile not found. Please refresh the page and try again.",
        variant: "destructive"
      });
      return;
    }

    if (isSubmitting || isGenerating) {
      toast({
        title: "Please wait",
        description: "Your job analysis is already being generated.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setJobAnalysisResult(null);
      setHasCreditBeenDeducted(false);
      console.log('✅ Starting job analysis submission process');
      console.log('✅ User profile ID:', userProfile.id);

      // Check for existing analysis first
      const { data: existingAnalysis, error: checkError } = await supabase
        .from('job_analyses')
        .select('id, job_match')
        .eq('user_id', userProfile.id)
        .eq('company_name', companyName.trim())
        .eq('job_title', jobTitle.trim())
        .eq('job_description', jobDescription.trim())
        .not('job_match', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!checkError && existingAnalysis && existingAnalysis.length > 0) {
        const existing = existingAnalysis[0];
        console.log('✅ Found existing job analysis:', existing.id);
        
        try {
          const parsedData = typeof existing.job_match === 'string' 
            ? existing.job_match 
            : JSON.stringify(existing.job_match);
          setJobAnalysisResult(parsedData);
          setCurrentAnalysis({ id: existing.id });
          setHasCreditBeenDeducted(false); // Allow credit deduction for existing results
          setIsSubmitting(false);
          toast({
            title: "Previous Analysis Found",
            description: "Using your previous job analysis for this job posting."
          });
          return;
        } catch (error) {
          console.error('Error parsing existing job analysis:', error);
          // Continue with new generation if parsing fails
        }
      }

      // Insert new job analysis record using the profile ID directly
      const insertData = {
        user_id: userProfile.id, // Use the profile ID directly  
        company_name: companyName.trim(),
        job_title: jobTitle.trim(),
        job_description: jobDescription.trim()
      };

      console.log('📝 Inserting job analysis data:', insertData);

      const { data: insertedData, error: insertError } = await supabase
        .from('job_analyses')
        .insert(insertData)
        .select('id')
        .single();

      if (insertError) {
        console.error('❌ INSERT ERROR:', insertError);
        throw new Error(`Database insert failed: ${insertError.message}`);
      }

      if (insertedData?.id) {
        console.log('✅ Job analysis record inserted:', insertedData.id);
        setCurrentAnalysis(insertedData);
        setIsGenerating(true);
        setHasCreditBeenDeducted(false);
        refetchHistory();
        
        toast({
          title: "Job Analysis Started!",
          description: "Your personalized job analysis is being generated. Please wait for the results."
        });
      }

    } catch (error) {
      console.error('❌ SUBMISSION ERROR:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate job analysis';
      toast({
        title: "Generation Failed", 
        description: errorMessage,
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
    setJobAnalysisResult(null);
    setCurrentAnalysis(null);
    setIsGenerating(false);
    setHasCreditBeenDeducted(false);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 pt-2 pb-2 max-w-5xl">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8 px-2">
            <div className="inline-flex items-center gap-3 mb-4">
              {/* Icon can be added here if needed */}
            </div>
            <h1 className="mb-4 bg-gradient-to-r from-[#ddd6f3] to-[#faaca8] bg-clip-text text-red-200 font-extrabold sm:text-4xl text-4xl">💼 Job Analysis</h1>
            <p className="text-gray-300 max-w-2xl mx-auto text-sm sm:text-lg font-light px-4">Get AI-powered insights on how well you match with any job posting. Discover your strengths, areas for improvement, and strategic advice.</p>
          </div>

          {/* Profile Completion Warning */}
          <ProfileCompletionWarning />

          {/* Form - Always visible */}
          <Card className="mb-6 sm:mb-8 bg-gradient-to-r from-[#ddd6f3] to-[#faaca8] border-0 mx-2 sm:mx-0">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="text-black text-lg sm:text-xl">Job Analysis Details</CardTitle>
                <div className="flex-shrink-0">
                  <JobAnalysisHistoryModal 
                    isOpen={isHistoryModalOpen}
                    onClose={() => setIsHistoryModalOpen(false)}
                    gradientColors="from-purple-600 to-blue-600"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Company Name and Job Title in horizontal layout for desktop */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-black flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Company Name
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
                    <Briefcase className="w-4 h-4" />
                    Job Title
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
                  <AlertCircle className="w-4 h-4" />
                  Job Description
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
                  disabled={isGenerating || isSubmitting}
                  className="w-full sm:flex-1 text-white font-medium bg-rose-600 hover:bg-rose-500"
                >
                  {isGenerating || isSubmitting ? 'Generating...' : 'Generate Job Analysis'}
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
            <div className="text-center py-8">
              <LoadingMessages type="job_analysis" />
            </div>
          )}

          {/* Results - Show below form when available */}
          {jobAnalysisResult && (
            <div className="w-full">
              <PremiumAnalysisResults 
                analysis={{
                  id: currentAnalysis?.id || '',
                  company_name: companyName,
                  location: 'Remote/Various Locations',
                  job_title: jobTitle,
                  research_date: new Date().toISOString(),
                  local_role_market_context: jobAnalysisResult,
                  company_news_updates: null,
                  role_security_score: null,
                  role_security_score_breakdown: null,
                  role_security_outlook: null,
                  role_security_automation_risks: null,
                  role_security_departmental_trends: null,
                  role_experience_score: null,
                  role_experience_score_breakdown: null,
                  role_experience_specific_insights: null,
                  role_compensation_analysis: null,
                  role_workplace_environment: null,
                  career_development: null,
                  role_specific_considerations: null,
                  interview_and_hiring_insights: null,
                  sources: null,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }}
              />
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default JobGuide;
