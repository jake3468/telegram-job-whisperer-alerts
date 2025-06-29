

import { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, FileText, Sparkles, Loader2, CheckCircle, Trash2, Building, Briefcase, Copy, History } from 'lucide-react';
import AuthHeader from '@/components/AuthHeader';
import { useUserCompletionStatus } from '@/hooks/useUserCompletionStatus';
import { supabase, makeAuthenticatedRequest } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import JobAnalysisHistory from '@/components/JobAnalysisHistory';
import { PercentageMeter } from '@/components/PercentageMeter';
import { useCreditCheck } from '@/hooks/useCreditCheck';
import { useCreditWarnings } from '@/hooks/useCreditWarnings';
import { SafeHTMLRenderer } from '@/components/SafeHTMLRenderer';
import { validateInput, sanitizeText, isValidForTyping } from '@/utils/sanitize';
import { useUserProfile } from '@/hooks/useUserProfile';
import { ProfileCompletionWarning } from '@/components/ProfileCompletionWarning';
import { useFeatureCreditCheck } from '@/hooks/useFeatureCreditCheck';

const JobGuide = () => {
  const {
    user,
    isLoaded
  } = useUser();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const {
    hasResume,
    hasBio,
    isComplete,
    loading: completionLoading
  } = useUserCompletionStatus();
  const {
    userProfile,
    loading: profileLoading
  } = useUserProfile();
  const [formData, setFormData] = useState({
    companyName: '',
    jobTitle: '',
    jobDescription: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobAnalysisId, setJobAnalysisId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [jobAnalysisResult, setJobAnalysisResult] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [matchScore, setMatchScore] = useState<string | null>(null);
  const [creditsDeducted, setCreditsDeducted] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const loadingMessages = ["🔍 Analyzing job requirements...", "✨ Crafting personalized insights...", "🚀 Tailoring advice to your profile...", "🎯 Generating strategic recommendations..."];
  
  const {
    hasCredits,
    checkAndDeductCredits,
    isDeducting,
    showInsufficientCreditsPopup
  } = useFeatureCreditCheck({
    feature: 'JOB_ANALYSIS',
    onSuccess: () => {
      setCreditsDeducted(true);
    },
    onInsufficientCredits: () => {
      setIsGenerating(false);
      setIsSubmitting(false);
    }
  });

  useCreditWarnings(); // This shows the warning popups

  useEffect(() => {
    if (isLoaded && !user) {
      navigate('/');
    }
  }, [user, isLoaded, navigate]);

  useEffect(() => {
    if (!isGenerating) return;
    let messageIndex = 0;
    setLoadingMessage(loadingMessages[0]);
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % loadingMessages.length;
      setLoadingMessage(loadingMessages[messageIndex]);
    }, 3000);
    return () => clearInterval(messageInterval);
  }, [isGenerating]);

  useEffect(() => {
    if (!jobAnalysisId || !isGenerating) return;
    console.log('🔄 Starting enhanced polling for job analysis results, ID:', jobAnalysisId);
    let retryCount = 0;
    const maxRetries = 3;
    const pollForResults = async () => {
      try {
        console.log('📡 Polling attempt', retryCount + 1, 'for analysis ID:', jobAnalysisId);

        // Use authenticated request for polling
        const {
          data,
          error
        } = await makeAuthenticatedRequest(async () => {
          return await supabase.from('job_analyses').select('job_match, match_score').eq('id', jobAnalysisId).maybeSingle();
        }, 'poll job analysis results');
        if (error) {
          console.error('❌ Error polling for results:', error);

          // Handle JWT expiration by retrying with a delay
          if (error.message?.includes('JWT expired') || error.code === 'PGRST301') {
            console.log('🔄 JWT expired, retrying after delay...');
            retryCount++;
            if (retryCount < maxRetries) {
              // Wait a bit longer for token refresh and retry
              setTimeout(() => {
                pollForResults();
              }, 2000);
              return;
            } else {
              console.log('❌ Max retries reached for JWT refresh');
              throw new Error('Authentication failed after retries');
            }
          }
          throw error;
        }
        console.log('📊 Polling response:', {
          hasJobMatch: !!data?.job_match,
          jobMatchLength: data?.job_match?.length,
          matchScore: data?.match_score,
          retryCount
        });

        // Reset retry count on successful response
        retryCount = 0;

        // Check if we have actual content (not just empty strings)
        if (data?.job_match && data.job_match.trim().length > 0) {
          console.log('✅ Results found! Setting job analysis result');
          setJobAnalysisResult(data.job_match);
          setIsGenerating(false);
          setIsSuccess(false);
          setMatchScore(data.match_score || null);
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }

          // Deduct credits only when results are successfully displayed
          if (!creditsDeducted) {
            console.log('🔒 Deducting credits for job analysis results');
            await checkAndDeductCredits('Job Analysis - Results Generated');
          }

          toast({
            title: "Job Analysis Generated!",
            description: "Your personalized job analysis is ready."
          });
        }
      } catch (err) {
        console.error('❌ Polling error:', err);

        // If we've exhausted retries, stop polling and show error
        if (retryCount >= maxRetries) {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          setIsGenerating(false);
          setError('Failed to load job analysis results. Please try again.');
          toast({
            title: "Loading Failed",
            description: "Unable to load your job analysis. Please try generating again.",
            variant: "destructive"
          });
        }
      }
    };

    // Start polling immediately, then every 3 seconds
    pollForResults();
    pollingIntervalRef.current = setInterval(pollForResults, 3000);

    // Set timeout to stop polling after 5 minutes
    const timeout = setTimeout(() => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      setIsGenerating(false);
      setError('Job analysis generation timed out. Please try again.');
      toast({
        title: "Generation Timeout",
        description: "The job analysis generation took too long. Please try submitting again.",
        variant: "destructive"
      });
    }, 300000); // 5 minutes timeout

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      clearTimeout(timeout);
    };
  }, [jobAnalysisId, isGenerating, toast, creditsDeducted, checkAndDeductCredits]);

  const handleInputChange = (field: string, value: string) => {
    // Use more lenient validation for real-time typing
    const maxLength = field === 'jobDescription' ? 5000 : 200;

    // Only validate for truly malicious content, allow normal editing
    if (!isValidForTyping(value, maxLength)) {
      toast({
        title: "Invalid Input",
        description: `${field === 'companyName' ? 'Company name' : field === 'jobTitle' ? 'Job title' : 'Job description'} contains invalid content or is too long.`,
        variant: "destructive"
      });
      return;
    }

    // Light sanitization - only remove actual HTML tags
    const cleanValue = value.replace(/<[^>]*>/g, '');
    setFormData(prev => ({
      ...prev,
      [field]: cleanValue
    }));
  };

  const handleClearData = useCallback(() => {
    setFormData({
      companyName: '',
      jobTitle: '',
      jobDescription: ''
    });
    setJobAnalysisResult(null);
    setJobAnalysisId(null);
    setIsSuccess(false);
    setError(null);
    setIsGenerating(false);
    setIsSubmitting(false);
    setCreditsDeducted(false);
    toast({
      title: "Data Cleared",
      description: "All form data and results have been cleared."
    });
  }, [toast]);

  const handleSubmit = useCallback(async () => {
    console.log('🚀 Job Guide Submit Button Clicked');

    // Check credits first
    if (!hasCredits) {
      showInsufficientCreditsPopup();
      return;
    }

    if (!formData.companyName || !formData.jobTitle || !formData.jobDescription) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields to get your job analysis.",
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

    // Check if userProfile is available (but allow if still loading)
    if (!profileLoading && !userProfile) {
      toast({
        title: "Profile not found",
        description: "Unable to find your profile. Please try refreshing the page.",
        variant: "destructive"
      });
      return;
    }
    try {
      setIsSubmitting(true);
      setError(null);
      setIsSuccess(false);
      setJobAnalysisResult(null);
      setMatchScore(null); // Clear previous match score
      setCreditsDeducted(false); // Reset credit deduction flag
      console.log('✅ Starting job analysis submission process');
      console.log('✅ Using user profile:', userProfile?.id);

      // Check for existing analysis using authenticated request
      const {
        data: existingAnalysis,
        error: checkError
      } = await makeAuthenticatedRequest(async () => {
        return await supabase.from('job_analyses').select('id, job_match, match_score').eq('user_id', userProfile?.id).eq('company_name', formData.companyName).eq('job_title', formData.jobTitle).eq('job_description', formData.jobDescription).not('job_match', 'is', null).order('created_at', {
          ascending: false
        }).limit(1);
      }, 'check existing analysis');
      if (!checkError && existingAnalysis && existingAnalysis.length > 0) {
        const existing = existingAnalysis[0];
        console.log('✅ Found existing job analysis:', existing.id);
        setJobAnalysisResult(existing.job_match);
        setMatchScore(existing.match_score || null);
        setJobAnalysisId(existing.id);
        setIsSubmitting(false);
        
        // Deduct credits for existing analysis display
        if (!creditsDeducted) {
          console.log('🔒 Deducting credits for existing job analysis display');
          await checkAndDeductCredits('Job Analysis - Existing Results Displayed');
        }
        
        toast({
          title: "Previous Job Analysis Found",
          description: "Using your previous job analysis for this job posting."
        });
        return;
      }

      // Insert new analysis record using authenticated request
      const insertData = {
        user_id: userProfile?.id,
        company_name: formData.companyName,
        job_title: formData.jobTitle,
        job_description: formData.jobDescription
      };
      console.log('📝 Inserting job analysis data:', insertData);
      const {
        data: insertedData,
        error: insertError
      } = await makeAuthenticatedRequest(async () => {
        return await supabase.from('job_analyses').insert(insertData).select('id').single();
      }, 'insert job analysis', 3); // 3 retries for JWT issues

      if (insertError) {
        console.error('❌ INSERT ERROR:', insertError);
        throw new Error(`Database insert failed: ${insertError.message}`);
      }
      if (insertedData?.id) {
        console.log('✅ Job analysis record inserted:', insertedData.id);
        setJobAnalysisId(insertedData.id);
        setIsSuccess(true);
        setIsGenerating(true);
        toast({
          title: "Job Analysis Started!",
          description: "Your personalized job analysis is being created. Please wait for the results."
        });
      }
    } catch (err) {
      console.error('❌ SUBMISSION ERROR:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate job analysis';
      setError(errorMessage);
      toast({
        title: "Generation Failed",
        description: "There was an error generating your job analysis. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, isComplete, completionLoading, profileLoading, hasResume, hasBio, user, toast, isSubmitting, isGenerating, hasCredits, showInsufficientCreditsPopup, userProfile, creditsDeducted, checkAndDeductCredits]);

  useEffect(() => {
    const handleHistoryData = (event: any) => {
      const {
        companyName,
        jobTitle,
        jobDescription,
        result,
        matchScore,
        // expect this from history events if supported
        type
      } = event.detail;
      if (type === 'job_guide') {
        setFormData({
          companyName,
          jobTitle,
          jobDescription
        });
        setJobAnalysisResult(result);
        setMatchScore(matchScore || null);
      }
    };
    window.addEventListener('useHistoryData', handleHistoryData);
    return () => window.removeEventListener('useHistoryData', handleHistoryData);
  }, []);

  const handleCopyResult = async () => {
    if (!jobAnalysisResult) return;
    try {
      // Sanitize before copying to clipboard
      const sanitizedText = sanitizeText(jobAnalysisResult);
      await navigator.clipboard.writeText(sanitizedText);
      toast({
        title: "Copied!",
        description: "Job analysis copied to clipboard successfully."
      });
    } catch (err) {
      console.error('Failed to copy text:', err);
      toast({
        title: "Error",
        description: "Failed to copy text to clipboard.",
        variant: "destructive"
      });
    }
  };

  // Simplified form validation - only check if fields have content
  const isFormValid = Boolean(formData.companyName?.trim() && formData.jobTitle?.trim() && formData.jobDescription?.trim());
  const hasAnyData = isFormValid || jobAnalysisResult;

  // Simplified button disable logic - remove profile completion checks
  const isButtonDisabled = !isFormValid || isSubmitting || isGenerating || !hasCredits;

  // Enhanced debug logging
  console.log('🔍 Form validation debug:', {
    companyName: `"${formData.companyName}" (length: ${formData.companyName?.length || 0})`,
    jobTitle: `"${formData.jobTitle}" (length: ${formData.jobTitle?.length || 0})`,
    jobDescription: `"${formData.jobDescription?.substring(0, 50)}..." (length: ${formData.jobDescription?.length || 0})`,
    isFormValid,
    isComplete,
    completionLoading,
    profileLoading,
    hasResume,
    hasBio,
    hasCredits,
    isSubmitting,
    isGenerating,
    isButtonDisabled,
    userProfile: !!userProfile
  });

  if (!isLoaded || !user) {
    return <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-slate-400 text-xs">Loading...</div>
      </div>;
  }

  return <Layout>
      <div className="min-h-screen w-full flex flex-col overflow-x-hidden bg-black">
        <div className="max-w-4xl mx-auto w-full px-2 pt-2 pb-2 sm:px-6">
          <div className="text-center mb-6 px-2">
            <h1 className="font-orbitron bg-gradient-to-r from-sky-400 via-blue-500 to-blue-600 bg-clip-text mb-2 drop-shadow font-bold text-blue-500 text-4xl">
              🎯 Job Analysis
            </h1>
            <p className="text-lg text-slate-300 font-inter font-light mb-3">
              In-depth breakdown and <span className="italic text-slate-400">insights</span> for your ideal jobs
            </p>
            <Badge variant="outline" className="bg-blue-900/30 border-blue-600/50 text-blue-300 font-semibold">
              Usage Fee: 1 credit
            </Badge>
          </div>

          {/* Profile Completion Warning */}
          <ProfileCompletionWarning />

          <div className="space-y-8">
            {/* Input Form */}
            <Card className="bg-gradient-to-br from-blue-900 via-blue-800 to-sky-900 border border-blue-700/70 shadow-xl drop-shadow-2xl">
              <CardHeader>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <CardTitle className="text-slate-100 font-inter text-xl flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-sky-400" />
                      Analyze a Job Posting
                    </CardTitle>
                    <CardDescription className="text-slate-300 font-inter">
                      Fill in job details to get your personalized job fit analysis
                    </CardDescription>
                  </div>
                  <div>
                    <JobAnalysisHistory type="job_analysis" gradientColors="from-slate-200 via-slate-300 to-slate-200" borderColors="border-slate-600/30" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Company Name */}
                  <div className="space-y-2">
                    <label htmlFor="companyName" className="text-slate-200 font-semibold text-base">
                      🏬 Company Name *
                    </label>
                    <Input id="companyName" placeholder="Google, Microsoft" value={formData.companyName} onChange={e => handleInputChange('companyName', e.target.value)} required maxLength={200} className="text-slate-100 border border-slate-700 shadow-inner focus:border-blue-400 placeholder:text-slate-400 font-semibold bg-gray-950" />
                  </div>
                  {/* Job Title */}
                  <div className="space-y-2">
                    <label htmlFor="jobTitle" className="text-slate-200 font-semibold text-base">
                      👨🏻‍💼 Job Title *
                    </label>
                    <Input id="jobTitle" placeholder="Software Engineer, Marketing Manager" value={formData.jobTitle} onChange={e => handleInputChange('jobTitle', e.target.value)} required maxLength={200} className="text-slate-100 border border-slate-700 shadow-inner focus:border-blue-400 placeholder:text-slate-400 font-semibold bg-gray-950" />
                  </div>
                </div>
                {/* Job Description */}
                <div className="space-y-2">
                  <label htmlFor="jobDescription" className="text-slate-200 font-semibold text-base">
                    🧾 Job Description *
                  </label>
                  <span className="text-slate-400 font-normal text-xs block mb-2">
                    Paste in the job description or key requirements
                  </span>
                  <Textarea id="jobDescription" placeholder="Paste the job description here..." value={formData.jobDescription} onChange={e => handleInputChange('jobDescription', e.target.value)} required maxLength={5000} className="min-h-[100px] text-slate-100 border border-slate-700 shadow-inner focus:border-blue-400 placeholder:text-slate-400 font-semibold bg-gray-950" />
                </div>
                {/* Action Buttons */}
                <div className="flex flex-col md:flex-row gap-3 pt-4">
                  <Button onClick={handleSubmit} disabled={isButtonDisabled} className={`flex-1 bg-gradient-to-r from-white via-white to-white hover:from-white/90 hover:to-white/90 text-black font-semibold text-base h-12 shadow-none border border-gray-300 transition-all duration-150
                      ${isButtonDisabled ? 'opacity-50 cursor-not-allowed' : 'opacity-100'}
                    `}>
                    {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    {isGenerating ? loadingMessage || 'Analyzing...' : 'Generate Job Analysis'}
                  </Button>
                  <Button onClick={handleClearData} variant="outline" size="sm" className="flex-none min-w-[120px] bg-slate-900/70 border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-200 h-10 px-4 ml-0 md:ml-2" disabled={!hasAnyData}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All
                  </Button>
                </div>
                {error && <div className="flex items-center rounded-lg p-3 bg-red-900/30 border border-red-700/50 mt-2 text-red-300 gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                  </div>}
                {isSuccess && <div className="flex items-center rounded-lg p-3 bg-green-900/20 border border-green-700/40 mt-2 text-green-300 gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>Job analysis submitted successfully!</span>
                  </div>}
              </CardContent>
            </Card>

            {/* Loading State */}
            {isGenerating && <Card className="bg-slate-800 border border-slate-700 mb-6 animate-fade-in shadow">
                <CardContent className="py-8">
                  <div className="flex flex-col items-center">
                    <Loader2 className="w-10 h-10 text-slate-400 animate-spin mb-4" />
                    <div className="text-slate-100 text-lg font-semibold mb-1 animate-pulse">
                      {loadingMessage || "Generating your job analysis..."}
                    </div>
                    <div className="text-slate-400 text-sm">
                      Please wait, this may take up to a minute for AI to process the job
                    </div>
                  </div>
                </CardContent>
              </Card>}

            {/* Result Display - Fixed for horizontal scrolling and background issues */}
            {jobAnalysisResult && <Card className="bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-900 border border-blue-700 shadow-lg w-full max-w-full overflow-hidden">
                <CardHeader className="pb-4">
                  <CardTitle className="text-slate-200 font-orbitron text-xl flex items-center gap-2">
                    <FileText className="w-5 h-5 text-slate-400" />
                    Your Job Analysis
                  </CardTitle>
                  <CardDescription className="text-slate-300 font-inter">
                    Personalized result for <span className="font-bold text-slate-200">{sanitizeText(formData.jobTitle)}</span> at <span className="font-bold text-slate-200">{sanitizeText(formData.companyName)}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="w-full max-w-full p-4">
                  {/* Percentage Meter (Match Score) */}
                  {matchScore && <div className="mb-4 w-full">
                      <div className="w-full max-w-sm mx-auto">
                        <div className="shadow-md rounded-xl bg-slate-900/90 p-3 border border-slate-700">
                          <PercentageMeter score={parseInt(matchScore)} label="Match Score" />
                        </div>
                      </div>
                    </div>}

                  <div className="w-full overflow-hidden">
                    <SafeHTMLRenderer 
                      content={jobAnalysisResult} 
                      className="whitespace-pre-wrap font-inter text-slate-100 bg-gradient-to-br from-slate-900/95 via-slate-900/85 to-blue-900/90 rounded-xl p-3 sm:p-4 md:p-5 shadow-inner mb-3 border border-slate-700 w-full overflow-hidden break-words hyphens-auto [word-break:break-word]" 
                      maxLength={15000} 
                    />
                  </div>
                  
                  <div className="flex flex-col md:flex-row gap-2">
                    <Button onClick={handleCopyResult} variant="outline" size="sm" className="flex-none min-w-[120px] bg-slate-900/70 border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-200 h-10 px-4">
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Result
                    </Button>
                  </div>
                </CardContent>
              </Card>}
          </div>
        </div>
      </div>
    </Layout>;
};

export default JobGuide;

