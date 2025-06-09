import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, FileText, Sparkles, Loader2, CheckCircle, Trash2, Building, Briefcase, FileEdit } from 'lucide-react';
import AuthHeader from '@/components/AuthHeader';
import { useUserCompletionStatus } from '@/hooks/useUserCompletionStatus';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';

const CoverLetter = () => {
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
  const [coverLetterResult, setCoverLetterResult] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('');
  
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isSubmissionInProgressRef = useRef(false);
  const lastSubmissionDataRef = useRef<string>('');

  const loadingMessages = [
    "✍️ Crafting your personalized cover letter...",
    "📝 Tailoring content to match the job requirements...",
    "🎯 Highlighting your relevant skills and experience...",
    "✨ Finalizing your professional cover letter..."
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
    }, 3000);
    return () => clearInterval(messageInterval);
  }, [isGenerating]);

  useEffect(() => {
    if (!analysisId || !isGenerating) return;
    
    const pollForResults = async () => {
      try {
        const { data, error } = await supabase
          .from('job_analyses')
          .select('cover_letter')
          .eq('id', analysisId)
          .single();
        
        if (error) {
          console.error('Error polling for results:', error);
          return;
        }
        
        if (data?.cover_letter) {
          setCoverLetterResult(data.cover_letter);
          setIsGenerating(false);
          setIsSuccess(false);
          
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          
          toast({
            title: "Cover Letter Ready!",
            description: "Your personalized cover letter has been generated."
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
      setError('Cover letter generation timed out. Please try again.');
      toast({
        title: "Generation Timeout",
        description: "The cover letter generation took too long. Please try submitting again.",
        variant: "destructive"
      });
    }, 300000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      clearTimeout(timeout);
    };
  }, [analysisId, isGenerating, toast]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleClearData = () => {
    setFormData({
      companyName: '',
      jobTitle: '',
      jobDescription: ''
    });
    setCoverLetterResult(null);
    setAnalysisId(null);
    setIsSuccess(false);
    setError(null);
    setIsGenerating(false);
    setIsSubmitting(false);
    
    isSubmissionInProgressRef.current = false;
    lastSubmissionDataRef.current = '';
    
    toast({
      title: "Data Cleared",
      description: "All form data and results have been cleared."
    });
  };

  const handleSubmit = async () => {
    const submissionData = JSON.stringify({
      company: formData.companyName,
      title: formData.jobTitle,
      description: formData.jobDescription
    });

    if (isSubmissionInProgressRef.current) {
      console.log('Submission already in progress, ignoring duplicate click');
      return;
    }

    if (lastSubmissionDataRef.current === submissionData && (isSubmitting || isGenerating)) {
      console.log('Same data already being processed, ignoring duplicate click');
      return;
    }

    if (!isComplete) {
      toast({
        title: "Complete your profile first",
        description: "Please upload your resume and add your bio in the Home page before generating a cover letter.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.companyName || !formData.jobTitle || !formData.jobDescription) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields to generate your cover letter.",
        variant: "destructive"
      });
      return;
    }

    isSubmissionInProgressRef.current = true;
    lastSubmissionDataRef.current = submissionData;
    setIsSubmitting(true);
    setError(null);
    setIsSuccess(false);
    setCoverLetterResult(null);

    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', user?.id)
        .single();

      if (userError || !userData) {
        throw new Error('User not found in database');
      }

      const { data: existingAnalysis, error: checkError } = await supabase
        .from('job_analyses')
        .select('id, cover_letter')
        .eq('user_id', userData.id)
        .eq('company_name', formData.companyName)
        .eq('job_title', formData.jobTitle)
        .eq('job_description', formData.jobDescription)
        .not('cover_letter', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!checkError && existingAnalysis && existingAnalysis.length > 0) {
        const existing = existingAnalysis[0];
        setCoverLetterResult(existing.cover_letter);
        setAnalysisId(existing.id);
        
        toast({
          title: "Previous Cover Letter Found",
          description: "Using your previous cover letter for this job posting."
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
        console.error('Insert error:', insertError);
        throw new Error(`Database insert failed: ${insertError.message}`);
      }

      if (insertedData?.id) {
        setAnalysisId(insertedData.id);
        setIsSuccess(true);
        setIsGenerating(true);
        
        const webhookPayload = {
          user: {
            id: userData.id,
            clerk_id: user?.id,
            email: user?.emailAddresses[0]?.emailAddress,
            first_name: user?.firstName,
            last_name: user?.lastName
          },
          job_analysis: {
            id: insertedData.id,
            user_id: userData.id,
            company_name: formData.companyName,
            job_title: formData.jobTitle,
            job_description: formData.jobDescription,
            created_at: new Date().toISOString()
          },
          event_type: 'job_analysis_created',
          webhook_type: 'cover_letter',
          timestamp: new Date().toISOString()
        };

        await supabase.functions.invoke('job-analysis-webhook', {
          body: webhookPayload
        });
        
        toast({
          title: "Cover Letter Generation Started!",
          description: "Your personalized cover letter is being created. Please wait for the results."
        });
      }
    } catch (err) {
      console.error('Error generating cover letter:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate cover letter';
      setError(errorMessage);
      toast({
        title: "Generation Failed",
        description: "There was an error generating your cover letter. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
      isSubmissionInProgressRef.current = false;
    }
  };

  const isFormValid = formData.companyName && formData.jobTitle && formData.jobDescription;
  const hasAnyData = isFormValid || coverLetterResult;
  const isButtonDisabled = !isComplete || !isFormValid || isSubmitting || isGenerating || isSubmissionInProgressRef.current;

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
              <span className="bg-gradient-to-r from-purple-500 to-pink-600 bg-clip-text text-transparent text-3xl">Cover Letter</span>
            </h1>
            <p className="text-sm text-gray-300 font-inter font-light">
              Generate a personalized cover letter for your job application
            </p>
          </div>

          <div className="space-y-6">
            {/* Profile Completion Status */}
            {loading ? (
              <Card className="bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 border-2 border-gray-400 shadow-2xl shadow-gray-500/20">
                <CardContent className="p-4">
                  <div className="text-white text-sm sm:text-base">Checking your profile...</div>
                </CardContent>
              </Card>
            ) : !isComplete && (
              <Card className="bg-gradient-to-br from-orange-600 via-red-600 to-pink-600 border-2 border-orange-400 shadow-2xl shadow-orange-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white font-inter flex items-center gap-2 text-sm sm:text-base">
                    <AlertCircle className="w-4 h-4 sm:w-4 sm:h-4" />
                    Complete Your Profile
                  </CardTitle>
                  <CardDescription className="text-orange-100 font-inter text-xs sm:text-sm">
                    You need to complete your profile before using Cover Letter
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

            {/* Job Input Form */}
            <Card className="bg-gradient-to-br from-purple-600 via-pink-600 to-rose-600 border-2 border-purple-400 shadow-2xl shadow-purple-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-white font-inter flex items-center gap-2 text-sm">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <FileText className="w-3 h-3 text-white" />
                  </div>
                  Job Information
                  {hasAnyData && (
                    <Button 
                      onClick={handleClearData}
                      size="sm" 
                      className="ml-auto bg-white/20 hover:bg-white/30 text-white border-white/20 text-xs px-2 py-1"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Clear All
                    </Button>
                  )}
                </CardTitle>
                <CardDescription className="text-purple-100 font-inter text-xs">
                  Enter job details to generate your personalized cover letter
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="space-y-4">
                  <div>
                    <label className="block text-white font-inter font-medium mb-2 text-xs">
                      🏢 Company Name
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 w-3 h-3" />
                      <Input 
                        value={formData.companyName}
                        onChange={(e) => handleInputChange('companyName', e.target.value)}
                        placeholder="Enter the company name"
                        disabled={isSubmitting || isGenerating}
                        className="pl-8 text-xs border-2 border-white/20 text-white placeholder-white/70 font-inter focus-visible:border-white/40 hover:border-white/30 bg-purple-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-inter font-medium mb-2 text-xs">
                      💼 Job Title
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 w-3 h-3" />
                      <Input 
                        value={formData.jobTitle}
                        onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                        placeholder="Enter the job title"
                        disabled={isSubmitting || isGenerating}
                        className="pl-8 text-xs border-2 border-white/20 text-white placeholder-white/70 font-inter focus-visible:border-white/40 hover:border-white/30 bg-purple-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-inter font-medium mb-2 text-xs">
                      📝 Job Description
                    </label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 text-white/70 w-3 h-3" />
                      <Textarea 
                        value={formData.jobDescription}
                        onChange={(e) => handleInputChange('jobDescription', e.target.value)}
                        placeholder="Paste the complete job description here..."
                        rows={4}
                        disabled={isSubmitting || isGenerating}
                        className="pl-8 text-xs border-2 border-white/20 text-white placeholder-white/70 font-inter focus-visible:border-white/40 hover:border-white/30 bg-purple-900 resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button 
                    onClick={handleSubmit}
                    disabled={isButtonDisabled}
                    className={`w-full font-inter font-medium py-3 px-4 text-xs ${
                      !isButtonDisabled 
                        ? 'bg-white text-purple-600 hover:bg-gray-100' 
                        : 'bg-white/50 text-gray-800 border-2 border-white/70 cursor-not-allowed hover:bg-white/50'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2 w-full">
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-3 h-3 flex-shrink-0 animate-spin" />
                          <span className="text-center text-xs">Processing...</span>
                        </>
                      ) : isGenerating ? (
                        <>
                          <Loader2 className="w-3 h-3 flex-shrink-0 animate-spin" />
                          <span className="text-center text-xs">Generating...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3 flex-shrink-0" />
                          <span className="text-center text-xs font-bold">
                            Get your Cover Letter
                          </span>
                        </>
                      )}
                    </div>
                  </Button>

                  {(!isComplete || !isFormValid) && !isSubmitting && !isGenerating && (
                    <p className="text-purple-200 text-xs font-inter text-center">
                      {!isComplete ? 'Complete your profile first to use this feature' : 'Fill in all fields to get your cover letter'}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Generating Status Display */}
            {isGenerating && (
              <Card className="bg-gradient-to-br from-pink-600 via-rose-600 to-red-600 border-2 border-pink-400 shadow-2xl shadow-pink-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white font-inter flex items-center gap-2 text-sm">
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                      <Loader2 className="w-3 h-3 text-white animate-spin" />
                    </div>
                    Generating Cover Letter...
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-pink-100 font-inter text-center text-xs break-words">
                    {loadingMessage}
                  </p>
                  <div className="mt-3 text-center">
                    <p className="text-pink-200 text-xs font-inter">
                      This usually takes 1-2 minutes. Please don't close this page.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Cover Letter Results Display */}
            {coverLetterResult && (
              <Card className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-600 border-2 border-slate-400 shadow-2xl shadow-slate-500/20 w-full">
                <CardHeader className="pb-3 bg-green-300">
                  <CardTitle className="font-inter flex items-center gap-2 text-sm text-gray-950">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center bg-gray-950">
                      <FileText className="w-3 h-3 text-white" />
                    </div>
                    Your Cover Letter
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
                      {coverLetterResult}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Success Display */}
            {isSuccess && !isGenerating && !coverLetterResult && (
              <Card className="bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 border-2 border-green-400 shadow-2xl shadow-green-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white font-inter flex items-center gap-2 text-sm">
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                    Cover Letter Submitted Successfully!
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-green-100 font-inter text-xs break-words">
                    Your cover letter request has been submitted and is being processed. 
                    The cover letter will appear below once completed.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Error Display */}
            {error && (
              <Card className="bg-gradient-to-br from-red-600 via-red-700 to-red-800 border-2 border-red-400 shadow-2xl shadow-red-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white font-inter flex items-center gap-2 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    Generation Error
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-red-100 font-inter text-xs break-words">{error}</p>
                  <Button 
                    onClick={() => {
                      setError(null);
                      isSubmissionInProgressRef.current = false;
                      lastSubmissionDataRef.current = '';
                    }}
                    className="mt-3 bg-white text-red-600 hover:bg-gray-100 font-inter font-medium text-xs px-4 py-2"
                    disabled={isSubmitting || isGenerating || !isFormValid}
                  >
                    Try Again
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

export default CoverLetter;
