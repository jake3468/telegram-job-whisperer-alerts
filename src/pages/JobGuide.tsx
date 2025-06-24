import { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, FileText, Sparkles, Loader2, CheckCircle, Trash2, Building, Briefcase, Copy, History } from 'lucide-react';
import AuthHeader from '@/components/AuthHeader';
import { useUserCompletionStatus } from '@/hooks/useUserCompletionStatus';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import JobAnalysisHistory from '@/components/JobAnalysisHistory';
import { PercentageMeter } from '@/components/PercentageMeter';
import { useCreditCheck } from '@/hooks/useCreditCheck';
import { useCreditWarnings } from '@/hooks/useCreditWarnings';
import { SafeHTMLRenderer } from '@/components/SafeHTMLRenderer';
import { validateInput, sanitizeText } from '@/utils/sanitize';

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
    loading
  } = useUserCompletionStatus();
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
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const loadingMessages = ["🔍 Analyzing job requirements...", "✨ Crafting personalized insights...", "🚀 Tailoring advice to your profile...", "🎯 Generating strategic recommendations..."];
  const {
    hasCredits,
    showInsufficientCreditsPopup
  } = useCreditCheck(1.5);
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
    const pollForResults = async () => {
      try {
        const {
          data,
          error
        } = await supabase.from('job_analyses').select('job_match, match_score').eq('id', jobAnalysisId).single();
        if (error) {
          console.error('Error polling for results:', error);
          return;
        }
        if (data?.job_match) {
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
        console.error('Polling error:', err);
      }
    };
    pollingIntervalRef.current = setInterval(pollForResults, 3000);
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
    }, 300000);
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      clearTimeout(timeout);
    };
  }, [jobAnalysisId, isGenerating, toast]);
  const handleInputChange = (field: string, value: string) => {
    // Sanitize input to prevent XSS
    const sanitizedValue = sanitizeText(value);
    
    // Validate input length and content
    if (field === 'jobDescription' && !validateInput(sanitizedValue, 5000)) {
      toast({
        title: "Invalid Input",
        description: "Job description contains invalid characters or is too long.",
        variant: "destructive"
      });
      return;
    } else if ((field === 'companyName' || field === 'jobTitle') && !validateInput(sanitizedValue, 200)) {
      toast({
        title: "Invalid Input",
        description: `${field === 'companyName' ? 'Company name' : 'Job title'} contains invalid characters or is too long.`,
        variant: "destructive"
      });
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: sanitizedValue
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

    // Check credits first
    if (!hasCredits) {
      showInsufficientCreditsPopup();
      return;
    }
    if (!isComplete) {
      toast({
        title: "Complete your profile first",
        description: "Please upload your resume and add your bio in the Home page before using Job Analysis.",
        variant: "destructive"
      });
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
    try {
      setIsSubmitting(true);
      setError(null);
      setIsSuccess(false);
      setJobAnalysisResult(null);
      console.log('✅ Starting job analysis submission process');
      const {
        data: userData,
        error: userError
      } = await supabase.from('users').select('id').eq('clerk_id', user?.id).single();
      if (userError || !userData) {
        console.error('❌ User not found:', userError);
        throw new Error('User not found in database');
      }
      console.log('✅ Found user in users table:', userData.id);
      const {
        data: profileData,
        error: profileError
      } = await supabase.from('user_profile').select('id').eq('user_id', userData.id).single();
      if (profileError || !profileData) {
        console.error('❌ User profile not found:', profileError);
        throw new Error('User profile not found. Please complete your profile first.');
      }
      console.log('✅ Found user profile:', profileData.id);
      // Check for existing analysis (now fetch match_score as well)
      const {
        data: existingAnalysis,
        error: checkError
      } = await supabase.from('job_analyses').select('id, job_match, match_score').eq('user_id', profileData.id).eq('company_name', formData.companyName).eq('job_title', formData.jobTitle).eq('job_description', formData.jobDescription).not('job_match', 'is', null).order('created_at', {
        ascending: false
      }).limit(1);
      if (!checkError && existingAnalysis && existingAnalysis.length > 0) {
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
      // Insert new, clear matchScore (will be fetched when ready)
      setMatchScore(null);
      const insertData = {
        user_id: profileData.id,
        company_name: formData.companyName,
        job_title: formData.jobTitle,
        job_description: formData.jobDescription
      };
      console.log('📝 Inserting job analysis data:', insertData);
      const {
        data: insertedData,
        error: insertError
      } = await supabase.from('job_analyses').insert(insertData).select('id').single();
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
  }, [formData, isComplete, user, toast, isSubmitting, isGenerating, hasCredits, showInsufficientCreditsPopup]);
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
  const isFormValid = formData.companyName && formData.jobTitle && formData.jobDescription;
  const hasAnyData = isFormValid || jobAnalysisResult;
  const isButtonDisabled = !isComplete || !isFormValid || isSubmitting || isGenerating;
  if (!isLoaded || !user) {
    return <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-slate-400 text-xs">Loading...</div>
      </div>;
  }
  return <Layout>
      <div className="min-h-screen w-full flex flex-col">
        <div className="max-w-4xl mx-auto w-full px-2 py-8 sm:px-6 sm:py-12 mt-4">
          <div className="text-center mb-8 px-2">
            <h1 className="font-orbitron bg-gradient-to-r from-sky-400 via-blue-500 to-blue-600 bg-clip-text text-transparent mb-2 drop-shadow text-5xl font-bold">
              Job Analysis
            </h1>
            <p className="text-lg text-slate-300 font-inter font-light">
              In-depth breakdown and <span className="italic text-slate-400">insights</span> for your ideal jobs
            </p>
          </div>
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
                      Company Name *
                    </label>
                    <Input 
                      id="companyName" 
                      placeholder="Google, Microsoft" 
                      value={formData.companyName} 
                      onChange={e => handleInputChange('companyName', e.target.value)} 
                      required 
                      maxLength={200}
                      className="bg-slate-900 text-slate-100 border border-slate-700 shadow-inner focus:border-blue-400 placeholder:text-slate-400 font-semibold" 
                    />
                  </div>
                  {/* Job Title */}
                  <div className="space-y-2">
                    <label htmlFor="jobTitle" className="text-slate-200 font-semibold text-base">
                      Job Title *
                    </label>
                    <Input 
                      id="jobTitle" 
                      placeholder="Software Engineer, Marketing Manager" 
                      value={formData.jobTitle} 
                      onChange={e => handleInputChange('jobTitle', e.target.value)} 
                      required 
                      maxLength={200}
                      className="bg-slate-900 text-slate-100 border border-slate-700 shadow-inner focus:border-blue-400 placeholder:text-slate-400 font-semibold" 
                    />
                  </div>
                </div>
                {/* Job Description */}
                <div className="space-y-2">
                  <label htmlFor="jobDescription" className="text-slate-200 font-semibold text-base">
                    Job Description *
                  </label>
                  <span className="text-slate-400 font-normal text-xs block mb-2">
                    Paste in the job description or key requirements
                  </span>
                  <Textarea 
                    id="jobDescription" 
                    placeholder="Paste the job description here..." 
                    value={formData.jobDescription} 
                    onChange={e => handleInputChange('jobDescription', e.target.value)} 
                    required 
                    maxLength={5000}
                    className="min-h-[100px] bg-slate-900 text-slate-100 border border-slate-700 shadow-inner focus:border-blue-400 placeholder:text-slate-400 font-semibold" 
                  />
                </div>
                {/* Action Buttons */}
                <div className="flex flex-col md:flex-row gap-3 pt-4">
                  <Button onClick={handleSubmit} disabled={isButtonDisabled} className={`flex-1 bg-gradient-to-r from-sky-700 via-blue-600 to-blue-800 hover:from-blue-500 hover:to-sky-700 text-white font-semibold text-base h-12 shadow-none border border-blue-600 transition-all duration-150
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

            {/* Result Display - Updated to use SafeHTMLRenderer */}
            {jobAnalysisResult && <Card className="bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-900 border border-blue-700 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-slate-200 font-orbitron text-xl flex items-center gap-2">
                    <FileText className="w-5 h-5 text-slate-400" />
                    Your Job Analysis
                  </CardTitle>
                  <CardDescription className="text-slate-300 font-inter">
                    Personalized result for <span className="font-bold text-slate-200">{sanitizeText(formData.jobTitle)}</span> at <span className="font-bold text-slate-200">{sanitizeText(formData.companyName)}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Percentage Meter (Match Score) */}
                  {matchScore && <div className="mb-4 max-w-full">
                      <div className="w-full sm:max-w-[350px] md:max-w-[280px] mx-auto">
                        <div className="shadow-md rounded-xl bg-slate-900/90 p-3 border border-slate-700">
                          <PercentageMeter score={parseInt(matchScore)} label="Match Score" />
                        </div>
                      </div>
                    </div>}

                  <SafeHTMLRenderer
                    content={jobAnalysisResult}
                    className="whitespace-pre-wrap font-inter text-slate-100 bg-gradient-to-br from-slate-900/95 via-slate-900/85 to-blue-900/90 rounded-xl p-4 sm:p-5 shadow-inner mb-3 border border-slate-700 max-w-full overflow-x-hidden break-words"
                    maxLength={15000}
                  />
                  
                  <div className="flex flex-col md:flex-row gap-2">
                    <Button 
                      onClick={handleCopyResult}
                      variant="outline" 
                      size="sm" 
                      className="flex-none min-w-[120px] bg-slate-900/70 border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-200 h-10 px-4"
                    >
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
