import { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Target, Sparkles, Loader2, CheckCircle, Trash2, Building, Briefcase, FileText } from 'lucide-react';
import AuthHeader from '@/components/AuthHeader';
import { useUserCompletionStatus } from '@/hooks/useUserCompletionStatus';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import JobAnalysisHistory from '@/components/JobAnalysisHistory';

const JobGuide = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasResume, hasBio, isComplete, loading } = useUserCompletionStatus();

  const [formData, setFormData] = useState({
    companyName: '',
    jobTitle: '',
    jobDescription: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [jobMatchResult, setJobMatchResult] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('');

  // Enhanced duplicate prevention with stronger safeguards
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestInFlightRef = useRef(false);
  const lastSubmissionTimeRef = useRef(0);
  const lastSubmissionHashRef = useRef('');
  const submissionInProgressRef = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const formLockRef = useRef(false);
  const sessionSubmissionsRef = useRef(new Set<string>());

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Enhanced intervals for better duplicate prevention
  const MIN_SUBMISSION_INTERVAL = 8000; // 8 seconds
  const DEBOUNCE_DELAY = 3000; // 3 seconds
  const FORM_LOCK_DURATION = 5000; // 5 seconds form lock

  const loadingMessages = [
    "🔍 Analyzing job requirements against your enhanced profile...",
    "📊 Calculating advanced compatibility metrics...", 
    "🎯 Evaluating comprehensive skill matches...",
    "✨ Finalizing your enhanced job match analysis..."
  ];

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
    }, 3500); // Slightly longer interval
    return () => clearInterval(messageInterval);
  }, [isGenerating]);

  useEffect(() => {
    if (!analysisId || !isGenerating) return;
    
    const pollForResults = async () => {
      try {
        const { data, error } = await supabase
          .from('job_analyses')
          .select('job_match')
          .eq('id', analysisId)
          .single();
        
        if (error) {
          console.error('Error polling for results:', error);
          return;
        }
        
        if (data?.job_match) {
          setJobMatchResult(data.job_match);
          setIsGenerating(false);
          setIsSuccess(false);
          requestInFlightRef.current = false;
          submissionInProgressRef.current = false;
          formLockRef.current = false;
          
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          
          toast({
            title: "Enhanced Analysis Complete!",
            description: "Your comprehensive job match analysis is ready."
          });
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    pollingIntervalRef.current = setInterval(pollForResults, 3500); // Slightly longer polling
    
    const timeout = setTimeout(() => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      setIsGenerating(false);
      requestInFlightRef.current = false;
      submissionInProgressRef.current = false;
      formLockRef.current = false;
      setError('Enhanced analysis timed out. Please try again.');
      toast({
        title: "Analysis Timeout",
        description: "The enhanced analysis took too long. Please try submitting again.",
        variant: "destructive"
      });
    }, 360000); // Extended timeout to 6 minutes

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      clearTimeout(timeout);
    };
  }, [analysisId, isGenerating, toast]);

  const handleInputChange = (field: string, value: string) => {
    if (formLockRef.current) {
      toast({
        title: "Form Locked",
        description: "Please wait for the current submission to complete.",
        variant: "destructive"
      });
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleClearData = useCallback(() => {
    if (formLockRef.current || submissionInProgressRef.current) {
      toast({
        title: "Cannot Clear",
        description: "Please wait for the current submission to complete.",
        variant: "destructive"
      });
      return;
    }

    // Clear all timers and controllers
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Reset all form data and state
    setFormData({
      companyName: '',
      jobTitle: '',
      jobDescription: ''
    });
    setJobMatchResult(null);
    setAnalysisId(null);
    setIsSuccess(false);
    setError(null);
    setIsGenerating(false);
    setIsSubmitting(false);
    
    // Reset all refs
    requestInFlightRef.current = false;
    submissionInProgressRef.current = false;
    formLockRef.current = false;
    lastSubmissionTimeRef.current = 0;
    lastSubmissionHashRef.current = '';
    sessionSubmissionsRef.current.clear();
    
    toast({
      title: "Data Cleared",
      description: "All form data and results have been cleared."
    });
  }, [toast]);

  const createEnhancedSubmissionHash = useCallback((data: typeof formData, userId: string) => {
    const timestamp = Date.now();
    const sessionId = crypto.randomUUID();
    
    const hashData = {
      company: data.companyName.trim().toLowerCase(),
      title: data.jobTitle.trim().toLowerCase(),
      description: data.jobDescription.trim().substring(0, 300).toLowerCase(),
      userId: userId,
      timestamp: Math.floor(timestamp / 60000), // Round to minute
      sessionId: sessionId,
      formDataLength: JSON.stringify(data).length
    };
    
    const encoder = new TextEncoder();
    const dataString = JSON.stringify(hashData, Object.keys(hashData).sort());
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    const finalHash = Math.abs(hash).toString(36) + timestamp.toString(36);
    
    // Track in session
    sessionSubmissionsRef.current.add(finalHash);
    
    return finalHash;
  }, []);

  const handleSubmit = useCallback(async () => {
    const now = Date.now();
    const requestId = crypto.randomUUID();
    
    console.log('🚀 ENHANCED SUBMIT ATTEMPT:', {
      requestId,
      isSubmissionInProgress: submissionInProgressRef.current,
      requestInFlight: requestInFlightRef.current,
      formLocked: formLockRef.current,
      timeSinceLastSubmission: now - lastSubmissionTimeRef.current,
      minInterval: MIN_SUBMISSION_INTERVAL,
      sessionSubmissions: sessionSubmissionsRef.current.size
    });

    // Enhanced validation checks
    if (submissionInProgressRef.current || requestInFlightRef.current || formLockRef.current) {
      console.log('❌ BLOCKED: Submission already in progress or form locked');
      toast({
        title: "Please wait",
        description: "Your enhanced analysis is already being processed.",
        variant: "destructive"
      });
      return;
    }

    if (now - lastSubmissionTimeRef.current < MIN_SUBMISSION_INTERVAL) {
      console.log('❌ BLOCKED: Too soon after last submission');
      toast({
        title: "Please wait",
        description: "Please wait a moment before submitting again.",
        variant: "destructive"
      });
      return;
    }

    if (!isComplete) {
      toast({
        title: "Complete your profile first",
        description: "Please upload your resume and add your bio in the Home page before using Enhanced Job Guide.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.companyName || !formData.jobTitle || !formData.jobDescription) {
      toast({
        title: "Missing information", 
        description: "Please fill in all fields to get your enhanced analysis.",
        variant: "destructive"
      });
      return;
    }

    const currentHash = createEnhancedSubmissionHash(formData, user?.id || '');
    
    // Enhanced duplicate detection
    if (currentHash === lastSubmissionHashRef.current && 
        now - lastSubmissionTimeRef.current < 600000) { // 10 minutes
      console.log('❌ BLOCKED: Duplicate submission hash');
      toast({
        title: "Duplicate submission",
        description: "You've already submitted this exact analysis recently.",
        variant: "destructive"
      });
      return;
    }

    // Check session-level duplicates
    if (sessionSubmissionsRef.current.has(currentHash)) {
      console.log('❌ BLOCKED: Session duplicate detected');
      toast({
        title: "Session duplicate",
        description: "This submission was already processed in this session.",
        variant: "destructive"
      });
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        // Triple-check before proceeding
        if (submissionInProgressRef.current || requestInFlightRef.current || formLockRef.current) {
          console.log('❌ DEBOUNCE BLOCKED: Already submitting');
          return;
        }

        // Lock everything
        submissionInProgressRef.current = true;
        requestInFlightRef.current = true;
        formLockRef.current = true;
        lastSubmissionTimeRef.current = now;
        lastSubmissionHashRef.current = currentHash;
        
        setIsSubmitting(true);
        setError(null);
        setIsSuccess(false);
        setJobMatchResult(null);

        abortControllerRef.current = new AbortController();

        console.log('✅ PROCEEDING with enhanced submission:', requestId);

        // Add form lock timeout
        setTimeout(() => {
          formLockRef.current = false;
        }, FORM_LOCK_DURATION);

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('clerk_id', user?.id)
          .single();

        if (userError || !userData) {
          throw new Error('User not found in database');
        }

        // Enhanced existing analysis check
        const { data: existingAnalysis, error: checkError } = await supabase
          .from('job_analyses')
          .select('id, job_match')
          .eq('user_id', userData.id)
          .eq('company_name', formData.companyName)
          .eq('job_title', formData.jobTitle)
          .eq('job_description', formData.jobDescription)
          .not('job_match', 'is', null)
          .order('created_at', { ascending: false })
          .limit(1);

        if (!checkError && existingAnalysis && existingAnalysis.length > 0) {
          const existing = existingAnalysis[0];
          console.log('✅ FOUND existing enhanced analysis:', existing.id);
          setJobMatchResult(existing.job_match);
          setAnalysisId(existing.id);
          setIsSubmitting(false);
          submissionInProgressRef.current = false;
          requestInFlightRef.current = false;
          toast({
            title: "Previous Enhanced Analysis Found",
            description: "Using your previous comprehensive job match analysis for this job posting."
          });
          return;
        }

        const { data: insertedData, error: insertError } = await supabase
          .from('job_analyses')
          .insert({
            user_id: userData.id,
            company_name: formData.companyName,
            job_title: formData.jobTitle,
            job_description: formData.jobDescription
          })
          .select('id')
          .single();

        if (insertError) {
          console.error('❌ INSERT ERROR:', insertError);
          throw new Error(`Database insert failed: ${insertError.message}`);
        }

        if (insertedData?.id) {
          console.log('✅ ENHANCED ANALYSIS INSERTED:', insertedData.id);
          setAnalysisId(insertedData.id);
          setIsSuccess(true);
          setIsGenerating(true);

          // Note: The webhook is now triggered by the database trigger automatically
          // No manual webhook call needed here

          toast({
            title: "Enhanced Analysis Started!",
            description: "Your comprehensive job match analysis is being processed. Please wait for the results."
          });
        }
      } catch (err) {
        console.error('❌ ENHANCED SUBMISSION ERROR:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to generate enhanced job analysis';
        setError(errorMessage);
        submissionInProgressRef.current = false;
        requestInFlightRef.current = false;
        formLockRef.current = false;
        lastSubmissionHashRef.current = '';
        
        // Remove from session tracking on error
        sessionSubmissionsRef.current.delete(currentHash);
        
        toast({
          title: "Enhanced Analysis Failed",
          description: "There was an error generating your comprehensive job analysis. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsSubmitting(false);
      }
    }, DEBOUNCE_DELAY);

  }, [formData, isComplete, user, toast, createEnhancedSubmissionHash]);

  const isFormValid = formData.companyName && formData.jobTitle && formData.jobDescription;
  const hasAnyData = isFormValid || jobMatchResult;
  const isButtonDisabled = !isComplete || !isFormValid || isSubmitting || isGenerating || 
                          submissionInProgressRef.current || requestInFlightRef.current || formLockRef.current;

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xs">Loading...</div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-black">
        <AuthHeader />
        
        <div className="max-w-4xl mx-auto px-3 py-8 sm:px-4 sm:py-12">
          <div className="text-center mb-8">
            <h1 className="sm:text-xl font-medium text-white mb-2 font-inter text-3xl md:text-3xl">
              <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent text-3xl">Enhanced Job Guide</span>
            </h1>
            <p className="text-sm text-gray-300 font-inter font-light">
              Get comprehensive job matching with advanced duplicate prevention
            </p>
          </div>

          <div className="space-y-6">
            {/* Profile Completion Status */}
            {loading ? (
              <Card className="bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 border-2 border-gray-400 shadow-2xl shadow-gray-500/20">
                <CardContent className="p-4">
                  <div className="text-white text-sm sm:text-base">Checking your enhanced profile...</div>
                </CardContent>
              </Card>
            ) : !isComplete && (
              <Card className="bg-gradient-to-br from-orange-600 via-red-600 to-pink-600 border-2 border-orange-400 shadow-2xl shadow-orange-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white font-inter flex items-center gap-2 text-sm sm:text-base">
                    <AlertCircle className="w-4 h-4 sm:w-4 sm:h-4" />
                    Complete Your Enhanced Profile
                  </CardTitle>
                  <CardDescription className="text-orange-100 font-inter text-xs sm:text-sm">
                    You need to complete your profile before using Enhanced Job Guide
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div className="space-y-2">
                    <div className={`flex items-center gap-2 ${hasResume ? 'text-green-200' : 'text-red-200'}`}>
                      <div className={`w-2 h-2 rounded-full ${hasResume ? 'bg-green-400' : 'bg-red-400'}`}></div>
                      <span className="font-inter text-xs">
                        {hasResume ? '✓ Resume uploaded' : '✗ Resume not uploaded'}
                      </span>
                    </div>
                    <div className={`flex items-center gap-2 ${hasBio ? 'text-green-200' : 'text-red-200'}`}>
                      <div className={`w-2 h-2 rounded-full ${hasBio ? 'bg-green-400' : 'bg-red-400'}`}></div>
                      <span className="font-inter text-xs">
                        {hasBio ? '✓ Bio completed' : '✗ Bio not completed'}
                      </span>
                    </div>
                  </div>
                  <Button 
                    onClick={() => navigate('/dashboard')} 
                    className="font-inter bg-white text-orange-600 hover:bg-gray-100 font-medium text-xs px-4 py-2"
                  >
                    Go to Home Page
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Enhanced Job Input Form */}
            <Card className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 border-2 border-blue-400 shadow-2xl shadow-blue-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-white font-inter flex items-center gap-2 text-base">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <Target className="w-4 h-4 text-white" />
                  </div>
                  Enhanced Job Information
                  {hasAnyData && (
                    <Button 
                      onClick={handleClearData} 
                      size="sm" 
                      disabled={formLockRef.current || submissionInProgressRef.current}
                      className="ml-auto bg-white/20 hover:bg-white/30 text-white border-white/20 text-xs px-2 py-1 disabled:opacity-50"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Clear All
                    </Button>
                  )}
                </CardTitle>
                <CardDescription className="text-blue-100 font-inter text-sm">
                  Enter job details for comprehensive analysis with advanced duplicate prevention
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="space-y-4">
                  <div>
                    <label className="block text-white font-inter font-medium mb-2 text-sm">
                      🏢 Company Name
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 w-4 h-4" />
                      <Input
                        value={formData.companyName}
                        onChange={(e) => handleInputChange('companyName', e.target.value)}
                        placeholder="Enter the company name"
                        disabled={isSubmitting || isGenerating || formLockRef.current}
                        className="pl-10 text-sm border-2 border-white/20 text-white placeholder-white/70 font-inter focus-visible:border-white/40 hover:border-white/30 placeholder:text-sm bg-gray-900 disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-inter font-medium mb-2 text-sm">
                      💼 Job Title
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 w-4 h-4" />
                      <Input
                        value={formData.jobTitle}
                        onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                        placeholder="Enter the job title"
                        disabled={isSubmitting || isGenerating || formLockRef.current}
                        className="pl-10 text-sm border-2 border-white/20 text-white placeholder-white/70 font-inter focus-visible:border-white/40 hover:border-white/30 placeholder:text-sm bg-gray-900 disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-inter font-medium mb-2 text-sm">
                      📝 Job Description
                    </label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 text-white/70 w-4 h-4" />
                      <Textarea
                        value={formData.jobDescription}
                        onChange={(e) => handleInputChange('jobDescription', e.target.value)}
                        placeholder="Paste the complete job description here..."
                        rows={4}
                        disabled={isSubmitting || isGenerating || formLockRef.current}
                        className="pl-10 text-sm border-2 border-white/20 text-white placeholder-white/70 font-inter focus-visible:border-white/40 hover:border-white/30 resize-none placeholder:text-sm bg-gray-900 disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={handleSubmit}
                    disabled={isButtonDisabled}
                    className={`w-full font-inter font-medium py-3 px-4 text-sm ${
                      !isButtonDisabled 
                        ? 'bg-white text-blue-600 hover:bg-gray-100' 
                        : 'bg-white/50 text-gray-800 border-2 border-white/70 cursor-not-allowed hover:bg-white/50'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2 w-full">
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 flex-shrink-0 animate-spin" />
                          <span className="text-center text-sm">Processing Enhanced Analysis...</span>
                        </>
                      ) : isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 flex-shrink-0 animate-spin" />
                          <span className="text-center text-sm">Analyzing Enhanced Match...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 flex-shrink-0" />
                          <span className="text-center text-sm font-bold">
                            Get Enhanced Job Analysis
                          </span>
                        </>
                      )}
                    </div>
                  </Button>

                  <JobAnalysisHistory 
                    type="job_guide" 
                    gradientColors="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600" 
                    borderColors="border-2 border-blue-400" 
                  />

                  {(!isComplete || !isFormValid) && !isSubmitting && !isGenerating && (
                    <p className="text-blue-200 text-sm font-inter text-center">
                      {!isComplete ? 'Complete your profile first to use this enhanced feature' : 'Fill in all fields to get your comprehensive analysis'}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Generating Status Display */}
            {isGenerating && (
              <Card className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 border-2 border-indigo-400 shadow-2xl shadow-indigo-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white font-inter flex items-center gap-2 text-sm">
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                      <Loader2 className="w-3 h-3 text-white animate-spin" />
                    </div>
                    Analyzing Enhanced Job Match...
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-indigo-100 font-inter text-center text-xs break-words">
                    {loadingMessage}
                  </p>
                  <div className="mt-3 text-center">
                    <p className="text-indigo-200 text-xs font-inter">
                      Enhanced analysis usually takes 2-3 minutes. Please don't close this page.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Enhanced Job Match Results Display */}
            {jobMatchResult && (
              <Card className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-600 border-2 border-slate-400 shadow-2xl shadow-slate-500/20 w-full">
                <CardHeader className="pb-3 bg-green-300">
                  <CardTitle className="font-inter flex items-center gap-2 text-sm text-gray-950">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center bg-gray-950">
                      <Target className="w-3 h-3 text-white" />
                    </div>
                    Enhanced Job Match Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 bg-green-300 p-4 w-full">
                  <div className="bg-white rounded-lg p-3 border-2 border-slate-300 w-full">
                    <div 
                      className="text-slate-800 font-inter leading-relaxed font-medium w-full text-xs" 
                      style={{
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-wrap',
                        maxWidth: '100%',
                        hyphens: 'auto',
                        lineHeight: '1.4'
                      }}
                    >
                      {jobMatchResult}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Enhanced Success Display */}
            {isSuccess && !isGenerating && !jobMatchResult && (
              <Card className="bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 border-2 border-green-400 shadow-2xl shadow-green-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white font-inter flex items-center gap-2 text-sm">
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                    Enhanced Analysis Submitted Successfully!
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-green-100 font-inter text-xs break-words">
                    Your comprehensive job analysis has been submitted and is being processed with enhanced duplicate prevention. 
                    The analysis will appear below once completed.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Enhanced Error Display */}
            {error && (
              <Card className="bg-gradient-to-br from-red-600 via-red-700 to-red-800 border-2 border-red-400 shadow-2xl shadow-red-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white font-inter flex items-center gap-2 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    Enhanced Analysis Error
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-red-100 font-inter text-xs break-words">{error}</p>
                  <Button 
                    onClick={() => {
                      setError(null);
                      submissionInProgressRef.current = false;
                      requestInFlightRef.current = false;
                      formLockRef.current = false;
                      lastSubmissionHashRef.current = '';
                      sessionSubmissionsRef.current.clear();
                    }} 
                    className="mt-3 bg-white text-red-600 hover:bg-gray-100 font-inter font-medium text-xs px-4 py-2" 
                    disabled={isSubmitting || isGenerating || !isFormValid}
                  >
                    Try Enhanced Analysis Again
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default JobGuide;
