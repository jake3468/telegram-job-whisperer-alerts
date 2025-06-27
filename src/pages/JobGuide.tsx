import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/Layout';
import JobAnalysisHistory from '@/components/JobAnalysisHistory';
import LoadingMessages from '@/components/LoadingMessages';
import { useCreditCheck } from '@/hooks/useCreditCheck';
import { useDeferredCreditDeduction } from '@/hooks/useDeferredCreditDeduction';
import { ProfileCompletionWarning } from '@/components/ProfileCompletionWarning';

const JobGuide = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userProfile } = useUserProfile();

  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobAnalysisResult, setJobAnalysisResult] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentJobAnalysisId, setCurrentJobAnalysisId] = useState<string | null>(null);

  // Use check-only mode for initial credit check
  const { hasCredits, showInsufficientCreditsPopup } = useCreditCheck(1.0, true);
  const { deductCredits } = useDeferredCreditDeduction();
  const [creditsDeducted, setCreditsDeducted] = useState(false);

  const { data: jobAnalysisHistory, refetch: refetchHistory } = useQuery({
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

  useEffect(() => {
    if (isLoaded && !user) {
      navigate('/');
    }
  }, [user, isLoaded, navigate]);

  // Enhanced real-time subscription for job analysis updates
  useEffect(() => {
    if (!currentJobAnalysisId) return;

    console.log('Setting up real-time subscription for job analysis ID:', currentJobAnalysisId);
    
    const channel = supabase
      .channel(`job-analysis-${currentJobAnalysisId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'job_analyses',
        filter: `id=eq.${currentJobAnalysisId}`
      }, (payload) => {
        console.log('Real-time update received:', payload);
        
        if (payload.new && payload.new.job_match) {
          const jobMatchContent = payload.new.job_match.trim();
          
          if (jobMatchContent.length > 0) {
            console.log('Job match content received, updating UI');
            setJobAnalysisResult(jobMatchContent);
            setIsGenerating(false);
            
            // Deduct credits only after successful result display
            if (!creditsDeducted) {
              deductCredits(1.0, 'job_analysis', 'Credits deducted for job analysis');
              setCreditsDeducted(true);
            }
            
            toast({
              title: "Job Analysis Complete!",
              description: "Your job analysis is ready to view."
            });
          }
        }
      })
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [currentJobAnalysisId, toast, creditsDeducted, deductCredits]);

  // Polling fallback - check for updates every 5 seconds when generating
  useEffect(() => {
    if (!isGenerating || !currentJobAnalysisId) return;

    const pollInterval = setInterval(async () => {
      console.log('Polling for job analysis updates...');
      
      try {
        const { data, error } = await supabase
          .from('job_analyses')
          .select('job_match')
          .eq('id', currentJobAnalysisId)
          .single();

        if (error) {
          console.error('Error polling for updates:', error);
          return;
        }

        if (data?.job_match && data.job_match.trim().length > 0) {
          console.log('Job analysis found via polling, updating UI');
          setJobAnalysisResult(data.job_match);
          setIsGenerating(false);
          
          // Deduct credits only after successful result display
          if (!creditsDeducted) {
            deductCredits(1.0, 'job_analysis', 'Credits deducted for job analysis');
            setCreditsDeducted(true);
          }
          
          toast({
            title: "Job Analysis Complete!",
            description: "Your job analysis is ready to view."
          });
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 5000);

    return () => {
      console.log('Cleaning up polling interval');
      clearInterval(pollInterval);
    };
  }, [isGenerating, currentJobAnalysisId, toast, creditsDeducted, deductCredits]);

  // Updated handleSubmit to only check credits, not deduct them
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Only check credits, don't deduct them yet
    if (!hasCredits) {
      showInsufficientCreditsPopup();
      return;
    }

    if (!user || !userProfile) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to analyze a job description.",
        variant: "destructive",
      });
      return;
    }

    if (!jobTitle.trim() || !jobDescription.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields before analyzing a job description.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setIsGenerating(true);
    setJobAnalysisResult('');
    setCurrentJobAnalysisId(null);
    setCreditsDeducted(false); // Reset credit deduction flag

    try {
      const { data, error } = await supabase
        .from('job_analyses')
        .insert([
          {
            user_id: userProfile.id,
            job_title: jobTitle.trim(),
            job_description: jobDescription.trim(),
          },
        ])
        .select()
        .single();
      
      console.log('Job analysis record created with ID:', data.id);
      setCurrentJobAnalysisId(data.id);
      
      toast({
        title: "Analysis Started!",
        description: "Your job analysis is being generated. Please wait..."
      });
    } catch (err: any) {
      console.error('Error creating job analysis:', err);
      setIsGenerating(false);
      setCurrentJobAnalysisId(null);
      toast({
        title: "Error",
        description: "Failed to create job analysis. Please try again.",
        variant: "destructive",
      });
      setCreditsDeducted(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setJobTitle('');
    setJobDescription('');
    setJobAnalysisResult('');
    setIsGenerating(false);
    setCurrentJobAnalysisId(null);
    setCreditsDeducted(false);
  };

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pastel-mint via-pastel-lavender to-pastel-peach flex items-center justify-center">
        <div className="text-fuchsia-900 text-xs">Loading...</div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 pt-2 pb-2 max-w-3xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-orbitron font-extrabold mb-2 drop-shadow tracking-tight flex items-center justify-center gap-2">
              <span>✨</span>
              <span
                style={{
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                }}
                className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-pink-500 text-left"
              >
                Job Description Analyzer
              </span>
            </h1>
            <p className="text-md text-purple-100 font-inter font-light">
              Analyze job descriptions to identify keywords, skills, and qualifications
            </p>
          </div>

          {/* Profile Completion Warning */}
          <ProfileCompletionWarning />

          <Card className="mb-8 bg-gradient-to-r from-purple-800 via-fuchsia-700 to-red-600 border-0">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="text-white text-lg sm:text-xl">Job Description Analysis</CardTitle>
                <JobAnalysisHistory />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="jobTitle" className="text-white">
                    Job Title
                  </Label>
                  <Input
                    id="jobTitle"
                    placeholder="e.g., Software Engineer, Marketing Manager"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    required
                    className="bg-black text-white placeholder:text-gray-400 border-gray-700"
                    disabled={isGenerating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jobDescription" className="text-white">
                    Job Description
                  </Label>
                  <Textarea
                    id="jobDescription"
                    placeholder="Paste the job description here..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    required
                    className="min-h-[150px] resize-none bg-black text-white placeholder:text-gray-400 border-gray-700"
                    disabled={isGenerating}
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting || !jobTitle.trim() || !jobDescription.trim() || isGenerating}
                    className="w-full sm:flex-1 bg-gradient-to-r from-white to-white hover:from-white/80 hover:to-white/80 text-black"
                  >
                    {isSubmitting ? "Submitting..." : isGenerating ? "Analyzing..." : "Analyze Job Description"}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleReset}
                    variant="outline"
                    className="w-full sm:w-auto px-6 border-white text-white hover:bg-white/10"
                    disabled={isGenerating}
                  >
                    Reset
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {isGenerating && !jobAnalysisResult && (
            <Card className="bg-black border-gray-700">
              <CardContent className="py-8">
                <LoadingMessages type="job_analysis" />
              </CardContent>
            </Card>
          )}

          {jobAnalysisResult && (
            <Card className="bg-black border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Job Analysis Result</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-line text-white">{jobAnalysisResult}</div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default JobGuide;
