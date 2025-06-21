import { useUser } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { FileText, History, Copy, Sparkles, Menu } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useUserCompletionStatus } from '@/hooks/useUserCompletionStatus';
import CoverLetterHistoryModal from '@/components/CoverLetterHistoryModal';
import LoadingMessages from '@/components/LoadingMessages';
import { ScrollArea } from '@/components/ui/scroll-area';
import CoverLetterDownloadActions from '@/components/CoverLetterDownloadActions';
import { useCreditCheck } from '@/hooks/useCreditCheck';
import { useCreditWarnings } from '@/hooks/useCreditWarnings';
import { useDeferredCreditDeduction } from '@/hooks/useDeferredCreditDeduction';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';

const CoverLetter = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userProfile } = useUserProfile();
  const { isComplete } = useUserCompletionStatus();
  
  // Use check-only mode for initial credit check
  const { hasCredits, showInsufficientCreditsPopup } = useCreditCheck(1.5, true);
  const { deductCredits } = useDeferredCreditDeduction();
  useCreditWarnings(); // This shows the warning popups

  const [formData, setFormData] = useState({
    job_title: '',
    company_name: '',
    job_description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentCoverLetterId, setCurrentCoverLetterId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [creditsDeducted, setCreditsDeducted] = useState(false);

  useEffect(() => {
    if (isLoaded && !user) {
      navigate('/');
    }
  }, [user, isLoaded, navigate]);

  // Enhanced real-time subscription for cover letter updates
  useEffect(() => {
    if (!currentCoverLetterId) return;
    console.log('Setting up real-time subscription for cover letter ID:', currentCoverLetterId);
    const channel = supabase.channel(`cover-letter-${currentCoverLetterId}`).on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'job_cover_letters',
      filter: `id=eq.${currentCoverLetterId}`
    }, payload => {
      console.log('Real-time update received:', payload);
      if (payload.new && payload.new.cover_letter) {
        const coverLetterContent = payload.new.cover_letter.trim();
        if (coverLetterContent.length > 0) {
          console.log('Cover letter content received, updating UI');
          setResult(coverLetterContent);
          setIsGenerating(false);
          
          // Deduct credits only after successful result display
          if (!creditsDeducted) {
            deductCredits(1.5, 'cover_letter', 'Credits deducted for cover letter generation');
            setCreditsDeducted(true);
          }
          
          toast({
            title: "Cover Letter Generated!",
            description: "Your cover letter has been created successfully."
          });
        }
      }
    }).subscribe(status => {
      console.log('Subscription status:', status);
    });

    // Cleanup function
    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [currentCoverLetterId, toast, creditsDeducted, deductCredits]);

  // Polling fallback - check for updates every 5 seconds when generating
  useEffect(() => {
    if (!isGenerating || !currentCoverLetterId) return;
    const pollInterval = setInterval(async () => {
      console.log('Polling for cover letter updates...');
      try {
        const { data, error } = await supabase.from('job_cover_letters').select('cover_letter').eq('id', currentCoverLetterId).single();
        if (error) {
          console.error('Error polling for updates:', error);
          return;
        }
        if (data?.cover_letter && data.cover_letter.trim().length > 0) {
          console.log('Cover letter found via polling, updating UI');
          setResult(data.cover_letter);
          setIsGenerating(false);
          
          // Deduct credits only after successful result display
          if (!creditsDeducted) {
            deductCredits(1.5, 'cover_letter', 'Credits deducted for cover letter generation');
            setCreditsDeducted(true);
          }
          
          toast({
            title: "Cover Letter Generated!",
            description: "Your cover letter has been created successfully."
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
  }, [isGenerating, currentCoverLetterId, toast, creditsDeducted, deductCredits]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

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
        description: "Please sign in to create a cover letter.",
        variant: "destructive"
      });
      return;
    }
    if (!isComplete) {
      toast({
        title: "Profile Incomplete",
        description: "Please complete your profile before creating a cover letter.",
        variant: "destructive"
      });
      return;
    }
    if (!formData.job_title.trim() || !formData.company_name.trim() || !formData.job_description.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    setIsSubmitting(true);
    setIsGenerating(true);
    setResult('');
    setCurrentCoverLetterId(null);
    setCreditsDeducted(false); // Reset credit deduction flag
    try {
      console.log('Submitting cover letter request...');

      // Insert into database
      const { data, error } = await supabase.from('job_cover_letters').insert({
        user_id: userProfile.id,
        job_title: formData.job_title,
        company_name: formData.company_name,
        job_description: formData.job_description
      }).select().single();
      if (error) {
        throw error;
      }
      console.log('Cover letter record created with ID:', data.id);
      setCurrentCoverLetterId(data.id);
      toast({
        title: "Request Submitted!",
        description: "Your cover letter is being generated. Please wait..."
      });
    } catch (err: any) {
      console.error('Error creating cover letter:', err);
      setIsGenerating(false);
      setCurrentCoverLetterId(null);
      toast({
        title: "Error",
        description: "Failed to create cover letter. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyResult = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      toast({
        title: "Copied!",
        description: "Cover letter copied to clipboard successfully."
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy text to clipboard.",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      job_title: '',
      company_name: '',
      job_description: ''
    });
    setResult('');
    setIsGenerating(false);
    setCurrentCoverLetterId(null);
    setCreditsDeducted(false);
  };

  if (!isLoaded || !user) {
    return <div className="min-h-screen bg-gradient-to-br from-black via-neutral-900 to-black flex items-center justify-center">
        <div className="text-fuchsia-900 text-xs">Loading...</div>
      </div>;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      {/* Header for mobile */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-sky-900/90 via-fuchsia-900/90 to-indigo-900/85 backdrop-blur-2xl shadow-2xl border-b border-fuchsia-400/30">
        <div className="flex items-center justify-between p-3">
          <SidebarTrigger className="h-12 w-12 bg-white/10 border-fuchsia-400/30 ring-2 ring-fuchsia-400/10 text-fuchsia-200 rounded-2xl shadow-lg hover:bg-fuchsia-700/30 transition-all flex items-center justify-center">
            <Menu className="w-7 h-7" strokeWidth={2.4} />
            <span className="sr-only">Toggle navigation menu</span>
          </SidebarTrigger>
          <div className="flex items-center gap-2">
            <img
              src="/lovable-uploads/6239b4a7-4f3c-4902-a936-4216ae26d9af.png"
              alt="JobBots Logo"
              className="h-8 w-8 drop-shadow-lg"
            />
            <span className="font-orbitron font-extrabold text-2xl bg-gradient-to-r from-sky-300 via-fuchsia-400 to-indigo-300 bg-clip-text text-transparent drop-shadow-sm tracking-wider select-none relative whitespace-nowrap">
              JobBots
            </span>
          </div>
        </div>
      </header>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-[#0e1122] via-[#181526] to-[#21203a]">
        <AppSidebar />
        <div className="flex-1 flex flex-col bg-transparent pt-28 lg:pt-0 lg:pl-6">
          <main className="flex-1 w-full bg-transparent">
            <div className="min-h-screen w-full bg-gradient-to-br from-[#180F18] via-[#1b1421] to-[#221828] flex flex-col">
              {/* Header Section */}
              <div className="max-w-4xl mx-auto w-full px-3 py-4 sm:px-6 sm:py-6 rounded-3xl mt-4">
                {/* Gradient Heading */}
                <div className="mb-8 text-center">
                  <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-pink-400 via-fuchsia-400 to-fuchsia-600 bg-clip-text text-transparent mb-2 drop-shadow font-orbitron animate-fade-in">
                    Cover Letter
                  </h1>
                  <p className="text-lg font-inter font-light text-white/90">
                    Instantly create stunning <span className="italic text-white/85">Cover Letters</span> for every job
                  </p>
                </div>
                <div className="space-y-8">
                  {/* Input Form in Gradient Box */}
                  <Card className="rounded-2xl border-0 bg-gradient-to-br from-rose-700/90 via-fuchsia-800/80 to-pink-700/90 shadow-xl" style={{
                  boxShadow: '0 2px 32px 0 rgba(150,97,255,0.12)'
                }}>
                    <CardHeader className="pb-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-white font-inter text-xl flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-fuchsia-200" />
                            Create Your Cover Letter
                          </CardTitle>
                          <CardDescription className="text-gray-200 font-inter">
                            Fill in the details to generate your personalized cover letter
                          </CardDescription>
                        </div>
                        <Button onClick={() => setShowHistory(true)} variant="outline" size="sm" className="border-white/20 text-white bg-pink-700 hover:bg-pink-600">
                          <History className="w-4 h-4 mr-2" />
                          History
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Inputs Row: Company Name and Job Title in one line for desktop, stacked on mobile */}
                        <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
                          {/* Company Name */}
                          <div className="flex-1 space-y-2">
                            <Label htmlFor="company_name" className="text-white font-medium text-base">
                              Company Name *
                            </Label>
                            <Input id="company_name" placeholder="e.g. Google, Microsoft" value={formData.company_name} onChange={e => handleInputChange('company_name', e.target.value)} required className="text-base bg-black text-white placeholder:text-white/60 border-white/15" disabled={isGenerating} />
                          </div>
                          {/* Job Title */}
                          <div className="flex-1 space-y-2">
                            <Label htmlFor="job_title" className="text-white font-medium text-base">
                              Job Title *
                            </Label>
                            <Input id="job_title" placeholder="e.g. Software Engineer, Marketing Manager" value={formData.job_title} onChange={e => handleInputChange('job_title', e.target.value)} required className="text-base bg-black text-white placeholder:text-white/60 border-white/15" disabled={isGenerating} />
                          </div>
                        </div>

                        {/* Job Description */}
                        <div className="space-y-2">
                          <Label htmlFor="job_description" className="text-white font-medium text-base">
                            Job Description *
                          </Label>
                          <Label htmlFor="job_description" className="text-gray-300 font-normal text-sm block">
                            Paste the job description or key requirements
                          </Label>
                          <Textarea id="job_description" placeholder="Paste the job description here..." value={formData.job_description} onChange={e => handleInputChange('job_description', e.target.value)} required className="min-h-[150px] resize-none text-base bg-black text-white placeholder:text-white/60 border-white/15" disabled={isGenerating} />
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                          {/* Generate Cover Letter - takes up majority of the width, Reset is smaller */}
                          <Button type="submit" disabled={isSubmitting || !formData.job_title.trim() || !formData.company_name.trim() || !formData.job_description.trim() || isGenerating} className="flex-[3] bg-gradient-to-r from-pink-400 to-fuchsia-500 hover:from-pink-400/80 hover:to-fuchsia-500/80 text-white font-semibold text-base h-12 rounded-lg">
                            {isSubmitting ? "Submitting..." : isGenerating ? "Generating..." : "Generate Cover Letter"}
                          </Button>
                          <Button type="button" onClick={resetForm} variant="outline" className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20 text-base h-12 px-6 max-sm:w-full" disabled={isGenerating}>
                            Reset
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>

                  {/* Loading State */}
                  {isGenerating && !result && <Card className="bg-[#33203a]/80 border-0 shadow">
                      <CardContent className="py-8">
                        <LoadingMessages type="cover_letter" />
                      </CardContent>
                    </Card>}

                  {/* Result Display */}
                  {result && <Card className="bg-[#33203a]/80 border-0 shadow">
                      <CardHeader className="pb-6 bg-pink-800">
                        <CardTitle className="text-white font-inter text-xl flex items-center gap-2">
                          <FileText className="w-5 h-5 text-fuchsia-300" />
                          Your Cover Letter
                        </CardTitle>
                        <CardDescription className="text-gray-300 font-inter">
                          Your generated cover letter for {formData.job_title} at {formData.company_name}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="bg-pink-800">
                        <div className="space-y-4">
                          <Card className="bg-black border-white/20 p-6">
                            <ScrollArea className="h-[400px] w-full pr-4">
                              <div className="whitespace-pre-wrap font-inter text-white text-base">
                                {result}
                              </div>
                            </ScrollArea>
                          </Card>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <Button onClick={handleCopyResult} className="flex-1 bg-gradient-to-r from-pink-400 to-fuchsia-500 hover:from-pink-400/80 hover:to-fuchsia-500/80 text-white flex items-center gap-2 text-base h-12">
                              <Copy className="w-4 h-4" />
                              Copy Cover Letter
                            </Button>
                            <CoverLetterDownloadActions 
                              coverLetter={result}
                              jobTitle={formData.job_title}
                              companyName={formData.company_name}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>}
                </div>
              </div>

              {/* History Modal */}
              <CoverLetterHistoryModal 
                isOpen={showHistory} 
                onClose={() => setShowHistory(false)} 
                gradientColors="from-pink-400 to-fuchsia-400" 
              />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default CoverLetter;
