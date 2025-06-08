import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, FileSearch, Sparkles, Loader2, CheckCircle, Copy, Target, Trophy } from 'lucide-react';
import AuthHeader from '@/components/AuthHeader';
import DashboardNav from '@/components/DashboardNav';
import { useUserCompletionStatus } from '@/hooks/useUserCompletionStatus';
import { supabase } from '@/integrations/supabase/client';
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
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<{
    jobMatch: string | null;
    coverLetter: string | null;
  } | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('');
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const loadingMessages = ["🔍 Carefully analyzing your profile against job requirements...", "📝 Crafting your personalized cover letter...", "🎯 Calculating your job match percentage...", "✨ Putting the finishing touches on your analysis..."];
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
        const {
          data,
          error
        } = await supabase.from('job_analyses').select('job_match, cover_letter').eq('id', analysisId).single();
        if (error) {
          console.error('Error polling for results:', error);
          return;
        }
        if (data?.job_match && data?.cover_letter) {
          setAnalysisResults({
            jobMatch: data.job_match,
            coverLetter: data.cover_letter
          });
          setIsGenerating(false);
          setIsSuccess(false);
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          toast({
            title: "Analysis Complete!",
            description: "Your job match analysis and cover letter are ready."
          });
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    // Start polling every 3 seconds
    pollingIntervalRef.current = setInterval(pollForResults, 3000);

    // Timeout after 5 minutes
    const timeout = setTimeout(() => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      setIsGenerating(false);
      setError('Analysis timed out. Please try again.');
      toast({
        title: "Analysis Timeout",
        description: "The analysis took too long. Please try submitting again.",
        variant: "destructive"
      });
    }, 300000); // 5 minutes

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      clearTimeout(timeout);
    };
  }, [analysisId, isGenerating, toast]);
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear previous results when form changes
    if (isSuccess || error || analysisResults) {
      setIsSuccess(false);
      setError(null);
      setAnalysisResults(null);
      setAnalysisId(null);
    }
  };
  const handleSubmit = async () => {
    if (!isComplete) {
      toast({
        title: "Complete your profile first",
        description: "Please upload your resume and add your bio in the Home page before using Job Guide.",
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
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);
    setAnalysisResults(null);
    try {
      const {
        data: userData,
        error: userError
      } = await supabase.from('users').select('id').eq('clerk_id', user?.id).single();
      if (userError || !userData) {
        throw new Error('User not found in database');
      }
      console.log('User data found:', userData);
      console.log('Attempting to insert job analysis with user_id:', userData.id);
      const {
        data: insertedData,
        error: insertError
      } = await supabase.from('job_analyses').insert({
        user_id: userData.id,
        company_name: formData.companyName,
        job_title: formData.jobTitle,
        job_description: formData.jobDescription
        // job_match and cover_letter will be NULL initially
      }).select('id').single();
      if (insertError) {
        console.error('Insert error:', insertError);
        throw new Error(`Database insert failed: ${insertError.message}`);
      }
      if (insertedData?.id) {
        setAnalysisId(insertedData.id);
        setIsSuccess(true);
        setIsGenerating(true);
        toast({
          title: "Analysis Started!",
          description: "Your job analysis is being processed. Please wait for the results."
        });

        // Reset form after successful submission
        setFormData({
          companyName: '',
          jobTitle: '',
          jobDescription: ''
        });
      }
    } catch (err) {
      console.error('Error generating job analysis:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate job analysis';
      setError(errorMessage);
      toast({
        title: "Analysis Failed",
        description: "There was an error generating your job analysis. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleCopyToClipboard = async () => {
    if (!analysisResults?.coverLetter) return;
    try {
      await navigator.clipboard.writeText(analysisResults.coverLetter);
      toast({
        title: "Copied!",
        description: "Cover letter copied to clipboard."
      });
    } catch (err) {
      console.error('Failed to copy:', err);
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard. Please try selecting and copying manually.",
        variant: "destructive"
      });
    }
  };
  const isFormValid = formData.companyName && formData.jobTitle && formData.jobDescription;
  if (!isLoaded || !user) {
    return <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>;
  }
  return <div className="min-h-screen bg-black">
      <AuthHeader />
      
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-semibold text-white mb-4 font-inter">
            <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">Job Guide</span>
          </h1>
          <p className="text-xl text-gray-300 font-inter font-light">
            Get your personalized job match analysis and cover letter
          </p>
        </div>

        <DashboardNav />

        <div className="space-y-8">
          {/* Profile Completion Status */}
          {loading ? <Card className="bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 border-2 border-gray-400 shadow-2xl shadow-gray-500/20">
              <CardContent className="p-6">
                <div className="text-white">Checking your profile...</div>
              </CardContent>
            </Card> : !isComplete && <Card className="bg-gradient-to-br from-orange-600 via-red-600 to-pink-600 border-2 border-orange-400 shadow-2xl shadow-orange-500/20">
              <CardHeader>
                <CardTitle className="text-white font-inter flex items-center gap-2">
                  <AlertCircle className="w-6 h-6" />
                  Complete Your Profile
                </CardTitle>
                <CardDescription className="text-orange-100 font-inter">
                  You need to complete your profile before using Job Guide
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className={`flex items-center gap-2 ${hasResume ? 'text-green-200' : 'text-red-200'}`}>
                    <div className={`w-2 h-2 rounded-full ${hasResume ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    <span className="font-inter text-sm">
                      {hasResume ? '✓ Resume uploaded' : '✗ Resume not uploaded'}
                    </span>
                  </div>
                  <div className={`flex items-center gap-2 ${hasBio ? 'text-green-200' : 'text-red-200'}`}>
                    <div className={`w-2 h-2 rounded-full ${hasBio ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    <span className="font-inter text-sm">
                      {hasBio ? '✓ Bio completed' : '✗ Bio not completed'}
                    </span>
                  </div>
                </div>
                <Button onClick={() => navigate('/dashboard')} className="font-inter bg-white text-orange-600 hover:bg-gray-100 font-medium">
                  Go to Home Page
                </Button>
              </CardContent>
            </Card>}

          {/* Job Guide Form */}
          <Card className="bg-gradient-to-br from-emerald-600 via-green-600 to-teal-600 border-2 border-emerald-400 shadow-2xl shadow-emerald-500/20">
            <CardHeader>
              <CardTitle className="text-white font-inter flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <FileSearch className="w-4 h-4 text-white" />
                </div>
                Job Guide
              </CardTitle>
              <CardDescription className="text-emerald-100 font-inter">
                Enter job details to get your personalized match analysis and cover letter
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-white font-inter font-medium mb-2">
                    Company Name
                  </label>
                  <Input value={formData.companyName} onChange={e => handleInputChange('companyName', e.target.value)} placeholder="Enter the company name for analysis" disabled={isLoading || isGenerating} className="border-2 border-white/20 text-white placeholder-white/70 font-inter focus-visible:border-white/40 hover:border-white/30 bg-emerald-900" />
                </div>

                <div>
                  <label className="block text-white font-inter font-medium mb-2">
                    Job Title
                  </label>
                  <Input value={formData.jobTitle} onChange={e => handleInputChange('jobTitle', e.target.value)} placeholder="Enter the job title for analysis" disabled={isLoading || isGenerating} className="border-2 border-white/20 text-white placeholder-white/70 font-inter focus-visible:border-white/40 hover:border-white/30 bg-emerald-900" />
                </div>

                <div>
                  <label className="block text-white font-inter font-medium mb-2">
                    Job Description
                  </label>
                  <Textarea value={formData.jobDescription} onChange={e => handleInputChange('jobDescription', e.target.value)} placeholder="Paste the complete job description here for detailed analysis including requirements, responsibilities, and qualifications..." rows={8} disabled={isLoading || isGenerating} className="min-h-[150px] border-2 border-white/20 text-white placeholder-white/70 font-inter focus-visible:border-white/40 hover:border-white/30 bg-emerald-900" />
                </div>
              </div>

              <div className="space-y-4">
                <Button onClick={handleSubmit} disabled={!isComplete || !isFormValid || isLoading || isGenerating} className={`w-full font-inter font-medium py-4 px-3 min-h-[60px] ${isComplete && isFormValid && !isLoading && !isGenerating ? 'bg-white text-emerald-600 hover:bg-gray-100' : 'bg-white/50 text-gray-800 border-2 border-white/70 cursor-not-allowed hover:bg-white/50'}`}>
                  <div className="flex items-center justify-center gap-2 w-full">
                    {isLoading ? <>
                        <Loader2 className="w-4 h-4 flex-shrink-0 animate-spin" />
                        <span className="text-center text-sm sm:text-base">Processing...</span>
                      </> : isGenerating ? <>
                        <Loader2 className="w-4 h-4 flex-shrink-0 animate-spin" />
                        <span className="text-center text-sm sm:text-base">Generating...</span>
                      </> : <>
                        <Sparkles className="w-4 h-4 flex-shrink-0" />
                        <div className="text-center leading-tight text-sm sm:text-base">
                          <div>
                            Submit for{' '}
                            <span className="font-bold bg-gradient-to-r from-emerald-800 to-teal-800 bg-clip-text text-teal-950">
                              Job match %
                            </span>
                            {' '}and{' '}
                            <span className="font-bold bg-gradient-to-r from-emerald-800 to-teal-800 bg-clip-text text-transparent">
                              Cover letter
                            </span>
                          </div>
                        </div>
                      </>}
                  </div>
                </Button>

                {(!isComplete || !isFormValid) && !isLoading && !isGenerating && <p className="text-emerald-200 text-sm font-inter text-center">
                    {!isComplete ? 'Complete your profile first to use this feature' : 'Fill in all fields to get your analysis'}
                  </p>}
              </div>
            </CardContent>
          </Card>

          {/* Generating Status Display */}
          {isGenerating && <Card className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 border-2 border-blue-400 shadow-2xl shadow-blue-500/20">
              <CardHeader>
                <CardTitle className="text-white font-inter flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  </div>
                  Generating Your Analysis...
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-100 font-inter text-center text-lg">
                  {loadingMessage}
                </p>
                <div className="mt-4 text-center">
                  <p className="text-blue-200 text-sm font-inter">
                    This usually takes 1-2 minutes. Please don't close this page.
                  </p>
                </div>
              </CardContent>
            </Card>}

          {/* Analysis Results Display */}
          {analysisResults && <div className="space-y-6">
              {/* Job Match Results */}
              <Card className="bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 border-2 border-green-400 shadow-2xl shadow-green-500/20">
                <CardHeader>
                  <CardTitle className="text-white font-inter flex items-center gap-2">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <Target className="w-4 h-4 text-white" />
                    </div>
                    Job Match Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-white/10 rounded-lg p-4">
                    <pre className="text-green-100 font-inter whitespace-pre-wrap text-sm leading-relaxed">
                      {analysisResults.jobMatch}
                    </pre>
                  </div>
                </CardContent>
              </Card>

              {/* Cover Letter Results */}
              <Card className="bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-600 border-2 border-purple-400 shadow-2xl shadow-purple-500/20">
                <CardHeader>
                  <CardTitle className="text-white font-inter flex items-center gap-2">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <Trophy className="w-4 h-4 text-white" />
                    </div>
                    Your Cover Letter
                    <Button onClick={handleCopyToClipboard} size="sm" className="ml-auto bg-white/20 hover:bg-white/30 text-white border-white/20">
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-white/10 rounded-lg p-4">
                    <pre className="text-purple-100 font-inter whitespace-pre-wrap text-sm leading-relaxed">
                      {analysisResults.coverLetter}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </div>}

          {/* Success Display */}
          {isSuccess && !isGenerating && !analysisResults && <Card className="bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 border-2 border-green-400 shadow-2xl shadow-green-500/20">
              <CardHeader>
                <CardTitle className="text-white font-inter flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  Analysis Submitted Successfully!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-green-100 font-inter">
                  Your job analysis has been submitted and the webhook has been triggered. 
                  The n8n workflow will process your request and generate the job match percentage and cover letter automatically.
                </p>
              </CardContent>
            </Card>}

          {/* Error Display */}
          {error && <Card className="bg-gradient-to-br from-red-600 via-red-700 to-red-800 border-2 border-red-400 shadow-2xl shadow-red-500/20">
              <CardHeader>
                <CardTitle className="text-white font-inter flex items-center gap-2">
                  <AlertCircle className="w-6 h-6" />
                  Analysis Error
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-100 font-inter">{error}</p>
                <Button onClick={handleSubmit} className="mt-4 bg-white text-red-600 hover:bg-gray-100 font-inter font-medium" disabled={isLoading || isGenerating || !isFormValid}>
                  Try Again
                </Button>
              </CardContent>
            </Card>}
        </div>
      </div>
    </div>;
};
export default JobGuide;