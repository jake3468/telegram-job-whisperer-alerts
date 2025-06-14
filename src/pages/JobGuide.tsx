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
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadingMessages = [
    "🔍 Analyzing job requirements...",
    "✨ Crafting personalized insights...",
    "🚀 Tailoring advice to your profile...",
    "🎯 Generating strategic recommendations..."
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
    if (!jobAnalysisId || !isGenerating) return;

    const pollForResults = async () => {
      try {
        const { data, error } = await supabase
          .from('job_analyses')
          .select('job_match')
          .eq('id', jobAnalysisId)
          .single();

        if (error) {
          console.error('Error polling for results:', error);
          return;
        }

        if (data?.job_match) {
          setJobAnalysisResult(data.job_match);
          setIsGenerating(false);
          setIsSuccess(false);
          
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

      const { data: existingAnalysis, error: checkError } = await supabase
        .from('job_analyses')
        .select('id, job_match')
        .eq('user_id', profileData.id)
        .eq('company_name', formData.companyName)
        .eq('job_title', formData.jobTitle)
        .eq('job_description', formData.jobDescription)
        .not('job_match', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!checkError && existingAnalysis && existingAnalysis.length > 0) {
        const existing = existingAnalysis[0];
        console.log('✅ Found existing job analysis:', existing.id);
        setJobAnalysisResult(existing.job_match);
        setJobAnalysisId(existing.id);
        setIsSubmitting(false);
        toast({
          title: "Previous Job Analysis Found",
          description: "Using your previous job analysis for this job posting."
        });
        return;
      }

      const insertData = {
        user_id: profileData.id,
        company_name: formData.companyName,
        job_title: formData.jobTitle,
        job_description: formData.jobDescription
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
  }, [formData, isComplete, user, toast, isSubmitting, isGenerating]);
  useEffect(() => {
    const handleHistoryData = (event: any) => {
      const { companyName, jobTitle, jobDescription, result, type } = event.detail;
      if (type === 'job_guide') {
        setFormData({ companyName, jobTitle, jobDescription });
        setJobAnalysisResult(result);
      }
    };

    window.addEventListener('useHistoryData', handleHistoryData);
    return () => window.removeEventListener('useHistoryData', handleHistoryData);
  }, []);
  const handleCopyResult = async () => {
    if (!jobAnalysisResult) return;

    try {
      await navigator.clipboard.writeText(jobAnalysisResult);
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-pastel-peach via-pastel-blue to-pastel-lavender flex items-center justify-center">
        <div className="text-indigo-900 text-xs">Loading...</div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen w-full bg-gradient-to-br from-pastel-peach/60 via-pastel-mint/50 to-pastel-lavender/70 flex flex-col">
        <div className="max-w-4xl mx-auto w-full px-3 py-8 sm:px-6 sm:py-12 backdrop-blur-xl rounded-3xl bg-black/80 shadow-2xl shadow-fuchsia-300/12 mt-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-orbitron font-extrabold bg-gradient-to-r from-pastel-blue via-fuchsia-400 to-pastel-peach bg-clip-text text-transparent mb-2 drop-shadow">
              Job <span className="italic">Analysis</span> Guide
            </h1>
            <p className="text-lg text-fuchsia-100 font-inter font-light">
              In-depth breakdown and <span className="italic text-pastel-lavender">insights</span> for your ideal jobs
            </p>
          </div>
          <div className="space-y-8">
            {/* Presume page-specific guide sections/components here */}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default JobGuide;
