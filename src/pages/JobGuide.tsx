import { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, FileText, Sparkles, Loader2, CheckCircle, Trash2, Building, Briefcase, Copy, History, RefreshCw } from 'lucide-react';
import AuthHeader from '@/components/AuthHeader';
import { useUserCompletionStatus } from '@/hooks/useUserCompletionStatus';
import { supabase } from '@/integrations/supabase/client';
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
import { useCachedJobAnalyses } from '@/hooks/useCachedJobAnalyses';
import { useEnterpriseAuth } from '@/hooks/useEnterpriseAuth';
const JobGuide = () => {
  const {
    user,
    isLoaded
  } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
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
  const { isAuthReady, executeWithRetry } = useEnterpriseAuth();
  const [formData, setFormData] = useState({
    companyName: '',
    jobTitle: '',
    jobDescription: ''
  });
  const [validationErrors, setValidationErrors] = useState({
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
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const loadingMessages = ["🔍 Analyzing job requirements...", "✨ Crafting personalized insights...", "🚀 Tailoring advice to your profile...", "🎯 Generating strategic recommendations..."];

  // Use cached job analyses hook for instant data display
  const {
    data: jobAnalysisHistory,
    isLoading: historyLoading,
    isShowingCachedData,
    connectionIssue,
    refetch: refetchHistory
  } = useCachedJobAnalyses();

  // Use feature credit check specifically for job analysis
  const {
    hasCredits,
    isLoading: creditsLoading,
    showInsufficientCreditsPopup
  } = useFeatureCreditCheck({
    feature: 'JOB_ANALYSIS',
    onInsufficientCredits: () => {
      console.log('Insufficient credits for job analysis');
    }
  });
  useCreditWarnings();
  
  // Handle pre-populated data from job tracker
  useEffect(() => {
    if (location.state?.companyName) {
      setFormData(prev => ({ ...prev, companyName: location.state.companyName }));
    }
    if (location.state?.jobTitle) {
      setFormData(prev => ({ ...prev, jobTitle: location.state.jobTitle }));
    }
    if (location.state?.jobDescription) {
      setFormData(prev => ({ ...prev, jobDescription: location.state.jobDescription }));
    }
  }, [location.state]);

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

        // Use enterprise auth for bulletproof polling
        const data = await executeWithRetry(async () => {
          const { data, error } = await supabase.from('job_analyses').select('job_match, match_score').eq('id', jobAnalysisId).maybeSingle();
          if (error) throw error;
          return data;
        }, 3, 'poll job analysis results');
        
        // Reset retry count on successful response
        retryCount = 0;
        console.log('📊 Polling response:', {
          hasJobMatch: !!data?.job_match,
          jobMatchLength: data?.job_match?.length,
          matchScore: data?.match_score,
          retryCount
        });

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
          toast({
            title: "Job Analysis Generated!",
            description: "Your personalized job analysis is ready."
          });
        }
      } catch (err) {
        console.error('❌ Polling error:', err);
        retryCount++;
        
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
  }, [jobAnalysisId, isGenerating, toast]);
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
    toast({
      title: "Data Cleared",
      description: "All form data and results have been cleared."
    });
  }, [toast]);
  const handleSubmit = useCallback(async () => {
    console.log('🚀 Job Guide Submit Button Clicked');

    // Check auth readiness first
    if (!isAuthReady) {
      toast({
        title: "Preparing Authentication",
        description: "Please wait while we prepare your session...",
        variant: "default"
      });
      return;
    }

    // Check credits first
    if (!hasCredits) {
      showInsufficientCreditsPopup();
      return;
    }
    if (!formData.companyName || !formData.jobTitle || !formData.jobDescription) {
      // Set individual field validation errors
      setValidationErrors({
        companyName: !formData.companyName.trim() ? 'Please fill in this field.' : '',
        jobTitle: !formData.jobTitle.trim() ? 'Please fill in this field.' : '',
        jobDescription: !formData.jobDescription.trim() ? 'Please fill in this field.' : ''
      });
      return;
    }

    // Clear validation errors if all fields are filled
    setValidationErrors({
      companyName: '',
      jobTitle: '',
      jobDescription: ''
    });
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
      setMatchScore(null);
      console.log('✅ Starting job analysis submission process');
      console.log('✅ Using user profile:', userProfile?.id);

      // Check for existing analysis using enterprise auth
      const existingAnalysis = await executeWithRetry(async () => {
        const { data, error } = await supabase.from('job_analyses').select('id, job_match, match_score').eq('user_id', userProfile?.id).eq('company_name', formData.companyName).eq('job_title', formData.jobTitle).eq('job_description', formData.jobDescription).not('job_match', 'is', null).order('created_at', {
          ascending: false
        }).limit(1);
        if (error) throw error;
        return data;
      }, 3, 'check existing analysis');
      if (existingAnalysis && existingAnalysis.length > 0) {
        const existing = existingAnalysis[0];
        console.log('✅ Found existing job analysis:', existing.id);
        setJobAnalysisResult(existing.job_match);
        setMatchScore(existing.match_score || null);
        setJobAnalysisId(existing.id);
        setIsSubmitting(false);
        toast({
          title: "Previous Job Analysis Found",
          description: "Using your previous job analysis for this job posting."
        });
        return;
      }

      // Insert new analysis record using enterprise auth
      const insertData = {
        user_id: userProfile?.id,
        company_name: formData.companyName,
        job_title: formData.jobTitle,
        job_description: formData.jobDescription
      };
      console.log('📝 Inserting job analysis data:', insertData);
      
      const insertedData = await executeWithRetry(async () => {
        const { data, error } = await supabase.from('job_analyses').insert(insertData).select('id').single();
        if (error) throw error;
        return data;
      }, 3, 'insert job analysis');
      if (insertedData?.id) {
        console.log('✅ Job analysis record inserted:', insertedData.id);
        setJobAnalysisId(insertedData.id);
        setIsSuccess(true);
        setIsGenerating(true);
        
        // Update cache with enterprise auth
        await executeWithRetry(async () => {
          refetchHistory();
        }, 2, 'refetch job analysis history');
        
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
        description: "Please refresh the page to continue",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, isComplete, completionLoading, profileLoading, hasResume, hasBio, user, toast, isSubmitting, isGenerating, hasCredits, showInsufficientCreditsPopup, userProfile, isAuthReady, executeWithRetry]);
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

  // Button should be disabled if: form invalid, submitting, generating, no credits, credits loading, or auth not ready
  const isButtonDisabled = !isFormValid || isSubmitting || isGenerating || !hasCredits || creditsLoading || !isAuthReady;

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
    creditsLoading,
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

  // Show loading state while auth is preparing
  if (!isAuthReady) {
    return <Layout>
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
          <div className="text-lg text-white font-orbitron">Preparing authentication...</div>
          <div className="text-sm text-gray-400">Setting up secure access to your job analysis</div>
        </div>
      </div>
    </Layout>;
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
            <Card className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 border border-blue-400/60 shadow-2xl shadow-blue-400/40 backdrop-blur-sm ring-1 ring-blue-300/20">
              <CardHeader className="bg-blue-700">
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
                  <div className="flex items-center gap-2">
                    {connectionIssue && <Button onClick={() => window.location.reload()} variant="outline" size="sm" className="border-orange-400/30 bg-orange-100/10 text-orange-300 hover:bg-orange-200/20" title="Connection issue detected. Click to refresh the page.">
                        <RefreshCw className="w-4 h-4" />
                      </Button>}
                    <JobAnalysisHistory type="job_analysis" gradientColors="from-slate-200 via-slate-300 to-slate-200" borderColors="border-slate-600/30" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 bg-blue-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {/* Company Name */}
                   <div className="space-y-2">
                     <label htmlFor="companyName" className="text-slate-200 font-semibold text-base">
                       🏬 Company Name *
                     </label>
                     <Input id="companyName" placeholder="Google, Microsoft" value={formData.companyName} onChange={e => handleInputChange('companyName', e.target.value)} required maxLength={200} className="text-slate-100 border border-slate-700 shadow-inner focus:border-blue-400 placeholder:text-slate-400 font-semibold bg-gray-950" />
                     {validationErrors.companyName && <div className="flex items-center gap-2 text-orange-400 text-sm bg-orange-100/10 border border-orange-400/30 rounded px-3 py-2">
                         <span className="text-orange-400">⚠</span>
                         {validationErrors.companyName}
                       </div>}
                   </div>
                   {/* Job Title */}
                   <div className="space-y-2">
                     <label htmlFor="jobTitle" className="text-slate-200 font-semibold text-base">
                       👨🏻‍💼 Job Title *
                     </label>
                     <Input id="jobTitle" placeholder="Software Engineer, Marketing Manager" value={formData.jobTitle} onChange={e => handleInputChange('jobTitle', e.target.value)} required maxLength={200} className="text-slate-100 border border-slate-700 shadow-inner focus:border-blue-400 placeholder:text-slate-400 font-semibold bg-gray-950" />
                     {validationErrors.jobTitle && <div className="flex items-center gap-2 text-orange-400 text-sm bg-orange-100/10 border border-orange-400/30 rounded px-3 py-2">
                         <span className="text-orange-400">⚠</span>
                         {validationErrors.jobTitle}
                       </div>}
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
                   {validationErrors.jobDescription && <div className="flex items-center gap-2 text-orange-400 text-sm bg-orange-100/10 border border-orange-400/30 rounded px-3 py-2">
                       <span className="text-orange-400">⚠</span>
                       {validationErrors.jobDescription}
                     </div>}
                 </div>
                {/* Action Buttons */}
                <div className="flex flex-col md:flex-row gap-3 pt-4">
                  <Button onClick={handleSubmit} disabled={isButtonDisabled} className="flex-1 bg-gradient-to-r from-white via-white to-white hover:from-white/90 hover:via-white/90 hover:to-white/90 text-black font-orbitron font-bold text-base h-12 shadow-2xl shadow-gray-300/50 border-0 disabled:opacity-50 disabled:cursor-not-allowed">
                    {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    {isGenerating ? loadingMessage || 'Analyzing...' : 'Generate Job Analysis'}
                  </Button>
                  <Button onClick={handleClearData} variant="outline" size="sm" className="flex-none min-w-[120px] bg-gradient-to-r from-red-900/80 to-red-800/80 border border-red-500/50 text-red-200 hover:bg-gradient-to-r hover:from-red-800 hover:to-red-700 hover:text-red-100 h-10 px-4 ml-0 md:ml-2 shadow-lg shadow-red-500/10" disabled={!hasAnyData}>
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

            {/* Result Display */}
            {jobAnalysisResult && <Card className="bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900 border border-emerald-500/50 shadow-2xl shadow-emerald-500/20 w-full max-w-full overflow-hidden">
                <CardHeader className="pb-4 bg-indigo-500">
                  <CardTitle className="text-slate-200 font-orbitron text-xl flex items-center gap-2">
                    <FileText className="w-5 h-5 text-slate-400" />
                    Your Job Analysis
                  </CardTitle>
                  <CardDescription className="text-slate-300 font-inter">
                    Personalized result for <span className="font-bold text-slate-200">{sanitizeText(formData.jobTitle)}</span> at <span className="font-bold text-slate-200">{sanitizeText(formData.companyName)}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="w-full max-w-full p-4 bg-indigo-500">
                  {/* Percentage Meter (Match Score) */}
                  {matchScore && <div className="mb-4 w-full">
                      <div className="w-full max-w-sm mx-auto">
                        <div className="shadow-md rounded-xl bg-slate-900/90 p-3 border border-slate-700">
                          <PercentageMeter score={parseInt(matchScore)} label="Match Score" />
                        </div>
                      </div>
                    </div>}

                  <div className="w-full overflow-hidden">
                    <SafeHTMLRenderer content={jobAnalysisResult} className="whitespace-pre-wrap font-inter text-slate-100 bg-gradient-to-br from-slate-900/95 via-slate-900/85 to-blue-900/90 rounded-xl p-3 sm:p-4 md:p-5 shadow-inner mb-3 border border-slate-700 w-full overflow-hidden break-words hyphens-auto [word-break:break-word]" maxLength={15000} />
                  </div>
                  
                  <div className="flex flex-col md:flex-row gap-2">
                    <Button onClick={handleCopyResult} variant="outline" size="sm" className="flex-none min-w-[120px] bg-gradient-to-r from-emerald-900/80 to-teal-900/80 border border-emerald-500/50 text-emerald-200 hover:bg-gradient-to-r hover:from-emerald-800 hover:to-teal-800 hover:text-emerald-100 h-10 px-4 shadow-lg shadow-emerald-500/10">
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