import { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, FileText, Sparkles, Loader2, CheckCircle, Trash2, Building, Briefcase } from 'lucide-react';
import AuthHeader from '@/components/AuthHeader';
import { useUserCompletionStatus } from '@/hooks/useUserCompletionStatus';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import JobAnalysisHistory from '@/components/JobAnalysisHistory';

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
  const [coverLetterId, setCoverLetterId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [coverLetterResult, setCoverLetterResult] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('');

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadingMessages = [
    "✍️ Crafting your personalized cover letter...",
    "✨ Adding a touch of magic to your application...",
    "🚀 Tailoring your skills to the job description...",
    "🎯 Highlighting your unique qualifications..."
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
    if (!coverLetterId || !isGenerating) return;
    
    const pollForResults = async () => {
      try {
        const { data, error } = await supabase
          .from('job_cover_letters')
          .select('cover_letter')
          .eq('id', coverLetterId)
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
            title: "Cover Letter Generated!",
            description: "Your personalized cover letter is ready."
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
  }, [coverLetterId, isGenerating, toast]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleClearData = useCallback(() => {
    setFormData({
      companyName: '',
      jobTitle: '',
      jobDescription: ''
    });
    setCoverLetterResult(null);
    setCoverLetterId(null);
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
    console.log('🚀 Cover Letter Submit Button Clicked');
    
    // Basic validation
    if (!isComplete) {
      toast({
        title: "Complete your profile first",
        description: "Please upload your resume and add your bio in the Home page before using Cover Letter generator.",
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

    if (isSubmitting || isGenerating) {
      toast({
        title: "Please wait",
        description: "Your cover letter is already being generated.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setIsSuccess(false);
      setCoverLetterResult(null);

      console.log('✅ Starting cover letter submission process');

      // Get the user's database ID from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', user?.id)
        .single();

      if (userError || !userData) {
        console.error('❌ User not found:', userError);
        throw new Error('User not found in database');
      }

      console.log('✅ Found user in users table:', userData.id);

      // Get the user_profile ID - this is the correct foreign key for job_cover_letters
      const { data: profileData, error: profileError } = await supabase
        .from('user_profile')
        .select('id')
        .eq('user_id', userData.id)
        .single();

      if (profileError || !profileData) {
        console.error('❌ User profile not found:', profileError);
        throw new Error('User profile not found. Please complete your profile first.');
      }

      console.log('✅ Found user profile:', profileData.id);

      // Check for existing cover letter first
      const { data: existingCoverLetter, error: checkError } = await supabase
        .from('job_cover_letters')
        .select('id, cover_letter')
        .eq('user_id', profileData.id)
        .eq('company_name', formData.companyName)
        .eq('job_title', formData.jobTitle)
        .eq('job_description', formData.jobDescription)
        .not('cover_letter', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!checkError && existingCoverLetter && existingCoverLetter.length > 0) {
        const existing = existingCoverLetter[0];
        console.log('✅ Found existing cover letter:', existing.id);
        setCoverLetterResult(existing.cover_letter);
        setCoverLetterId(existing.id);
        setIsSubmitting(false);
        toast({
          title: "Previous Cover Letter Found",
          description: "Using your previous cover letter for this job posting."
        });
        return;
      }

      // Insert new cover letter record with ONLY the required fields
      const insertData = {
        user_id: profileData.id,
        company_name: formData.companyName,
        job_title: formData.jobTitle,
        job_description: formData.jobDescription
      };

      console.log('📝 Inserting cover letter data:', insertData);

      const { data: insertedData, error: insertError } = await supabase
        .from('job_cover_letters')
        .insert(insertData)
        .select('id')
        .single();

      if (insertError) {
        console.error('❌ INSERT ERROR:', insertError);
        throw new Error(`Database insert failed: ${insertError.message}`);
      }

      if (insertedData?.id) {
        console.log('✅ Cover letter record inserted:', insertedData.id);
        setCoverLetterId(insertedData.id);
        setIsSuccess(true);
        setIsGenerating(true);

        toast({
          title: "Cover Letter Generation Started!",
          description: "Your personalized cover letter is being created. Please wait for the results."
        });
      }
    } catch (err) {
      console.error('❌ SUBMISSION ERROR:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate cover letter';
      setError(errorMessage);
      toast({
        title: "Generation Failed",
        description: "There was an error generating your cover letter. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, isComplete, user, toast, isSubmitting, isGenerating]);

  // Listen for history data events
  useEffect(() => {
    const handleHistoryData = (event: any) => {
      const { companyName, jobTitle, jobDescription, result, type } = event.detail;
      if (type === 'cover_letter') {
        setFormData({
          companyName,
          jobTitle,
          jobDescription
        });
        setCoverLetterResult(result);
      }
    };

    window.addEventListener('useHistoryData', handleHistoryData);
    return () => window.removeEventListener('useHistoryData', handleHistoryData);
  }, []);

  const isFormValid = formData.companyName && formData.jobTitle && formData.jobDescription;
  const hasAnyData = isFormValid || coverLetterResult;
  const isButtonDisabled = !isComplete || !isFormValid || isSubmitting || isGenerating;

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
              <span className="bg-gradient-to-br from-pink-500 via-rose-500 to-red-600 border-2 border-pink-400 shadow-2xl shadow-rose-500/30">Cover Letter</span>
            </h1>
            <p className="text-sm text-gray-300 font-inter font-light">
              Generate a personalized cover letter to impress recruiters
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
                    You need to complete your profile before generating a cover letter
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

            {/* Cover Letter Input Form */}
            <Card className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 border-2 border-blue-400 shadow-2xl shadow-blue-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-white font-inter flex items-center gap-2 text-base">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  Cover Letter Information
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
                <CardDescription className="text-blue-100 font-inter text-sm">
                  Enter job details to generate a personalized cover letter
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
                        disabled={isSubmitting || isGenerating}
                        className="pl-10 text-sm border-2 border-white/20 text-white placeholder-white/70 font-inter focus-visible:border-white/40 hover:border-white/30 placeholder:text-sm bg-gray-900"
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
                        disabled={isSubmitting || isGenerating}
                        className="pl-10 text-sm border-2 border-white/20 text-white placeholder-white/70 font-inter focus-visible:border-white/40 hover:border-white/30 placeholder:text-sm bg-gray-900"
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
                        disabled={isSubmitting || isGenerating}
                        className="pl-10 text-sm border-2 border-white/20 text-white placeholder-white/70 font-inter focus-visible:border-white/40 hover:border-white/30 resize-none placeholder:text-sm bg-gray-900"
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
                          <span className="text-center text-sm">Processing...</span>
                        </>
                      ) : isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 flex-shrink-0 animate-spin" />
                          <span className="text-center text-sm">Generating...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 flex-shrink-0" />
                          <span className="text-center text-sm font-bold">
                            Generate Cover Letter
                          </span>
                        </>
                      )}
                    </div>
                  </Button>

                  {/* History Button */}
                  <JobAnalysisHistory 
                    type="cover_letter" 
                    gradientColors="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600" 
                    borderColors="border-2 border-blue-400" 
                  />

                  {(!isComplete || !isFormValid) && !isSubmitting && !isGenerating && (
                    <p className="text-blue-200 text-sm font-inter text-center">
                      {!isComplete ? 'Complete your profile first to use this feature' : 'Fill in all fields to generate your cover letter'}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Generating Status Display */}
            {isGenerating && (
              <Card className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 border-2 border-indigo-400 shadow-2xl shadow-indigo-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white font-inter flex items-center gap-2 text-sm">
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                      <Loader2 className="w-3 h-3 text-white animate-spin" />
                    </div>
                    Generating Cover Letter...
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-indigo-100 font-inter text-center text-xs break-words">
                    {loadingMessage}
                  </p>
                  <div className="mt-3 text-center">
                    <p className="text-indigo-200 text-xs font-inter">
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
                    Your cover letter has been submitted and is being generated. 
                    The result will appear below once completed.
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
