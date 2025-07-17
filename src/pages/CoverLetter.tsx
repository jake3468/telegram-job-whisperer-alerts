import { useUser } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { FileText, History, Copy, Sparkles, Menu, BadgeDollarSign, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useUserCompletionStatus } from '@/hooks/useUserCompletionStatus';
import { useEnterpriseAuth } from '@/hooks/useEnterpriseAuth';
import CoverLetterHistoryModal from '@/components/CoverLetterHistoryModal';
import LoadingMessages from '@/components/LoadingMessages';
import { ScrollArea } from '@/components/ui/scroll-area';
import CoverLetterDownloadActions from '@/components/CoverLetterDownloadActions';
import { useCreditCheck } from '@/hooks/useCreditCheck';
import { useCreditWarnings } from '@/hooks/useCreditWarnings';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { ProfileCompletionWarning } from '@/components/ProfileCompletionWarning';
import { useCachedCoverLetters } from '@/hooks/useCachedCoverLetters';
const CoverLetter = () => {
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
    userProfile
  } = useUserProfile();
  const {
    isComplete,
    loading: completionLoading,
    refetchStatus
  } = useUserCompletionStatus();
  const {
    executeWithRetry,
    isAuthReady,
    isRefreshing
  } = useEnterpriseAuth();

  // Use credit check for 1.5 credits required for cover letters
  const {
    hasCredits,
    showInsufficientCreditsPopup
  } = useCreditCheck(1.5);
  useCreditWarnings(); // This shows the warning popups

  const [formData, setFormData] = useState({
    job_title: '',
    company_name: '',
    job_description: ''
  });
  const [validationErrors, setValidationErrors] = useState({
    job_title: '',
    company_name: '',
    job_description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentCoverLetterId, setCurrentCoverLetterId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Use cached cover letters hook for instant data display
  const {
    data: coverLetterHistory,
    isLoading: historyLoading,
    isShowingCachedData,
    connectionIssue,
    refetch: refetchHistory
  } = useCachedCoverLetters();
  useEffect(() => {
    if (isLoaded && !user) {
      navigate('/');
    }
  }, [user, isLoaded, navigate]);

  // Auto-populate form data if passed via navigation state
  useEffect(() => {
    if (location.state?.companyName || location.state?.jobTitle || location.state?.jobDescription) {
      const {
        companyName,
        jobTitle,
        jobDescription
      } = location.state;
      setFormData({
        company_name: companyName || '',
        job_title: jobTitle || '',
        job_description: jobDescription || ''
      });
      // Clear the navigation state after using it
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Enhanced real-time subscription for cover letter updates with improved detection
  useEffect(() => {
    if (!currentCoverLetterId || !isAuthReady) return;
    console.log('Setting up real-time subscription for cover letter ID:', currentCoverLetterId);
    let channel: any;
    const setupRealTime = async () => {
      try {
        await executeWithRetry(async () => {
          channel = supabase.channel(`cover-letter-${currentCoverLetterId}`).on('postgres_changes', {
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
                // Clean the content to remove any metadata or extra information
                const cleanContent = coverLetterContent.split('\n\n').find(paragraph => paragraph.includes('Dear') || paragraph.match(/^\w+\s+\d{1,2},\s+\d{4}/) || paragraph.includes('Sincerely') || paragraph.length > 100) ? coverLetterContent.split('\n\n').filter(paragraph => !paragraph.toLowerCase().includes('generate cover letter') && !paragraph.toLowerCase().includes('usage fee') && !paragraph.toLowerCase().includes('credits') && !paragraph.toLowerCase().includes('bio data') && !paragraph.toLowerCase().includes('profile') && paragraph.trim().length > 20).join('\n\n') : coverLetterContent;
                setResult(cleanContent);
                setIsGenerating(false);
                toast({
                  title: "Cover Letter Generated!",
                  description: "Your cover letter has been created successfully."
                });
              }
            }
          }).subscribe(status => {
            console.log('Subscription status:', status);
          });
        }, 3, 'setup real-time subscription');
      } catch (error) {
        console.error('Error setting up real-time subscription:', error);
      }
    };
    setupRealTime();

    // Cleanup function
    return () => {
      if (channel) {
        console.log('Cleaning up real-time subscription');
        supabase.removeChannel(channel);
      }
    };
  }, [currentCoverLetterId, isAuthReady, executeWithRetry, toast]);

  // Polling fallback - check for updates every 5 seconds when generating
  useEffect(() => {
    if (!isGenerating || !currentCoverLetterId || !isAuthReady) return;
    const pollInterval = setInterval(async () => {
      console.log('Polling for cover letter updates...');
      try {
        await executeWithRetry(async () => {
          const {
            data,
            error
          } = await supabase.from('job_cover_letters').select('cover_letter').eq('id', currentCoverLetterId).single();
          if (error) {
            console.error('Error polling for updates:', error);
            return;
          }
          if (data?.cover_letter && data.cover_letter.trim().length > 0) {
            console.log('Cover letter found via polling, updating UI');
            // Clean the content to remove any metadata or extra information
            const coverLetterContent = data.cover_letter.trim();
            const cleanContent = coverLetterContent.split('\n\n').find(paragraph => paragraph.includes('Dear') || paragraph.match(/^\w+\s+\d{1,2},\s+\d{4}/) || paragraph.includes('Sincerely') || paragraph.length > 100) ? coverLetterContent.split('\n\n').filter(paragraph => !paragraph.toLowerCase().includes('generate cover letter') && !paragraph.toLowerCase().includes('usage fee') && !paragraph.toLowerCase().includes('credits') && !paragraph.toLowerCase().includes('bio data') && !paragraph.toLowerCase().includes('profile') && paragraph.trim().length > 20).join('\n\n') : coverLetterContent;
            setResult(cleanContent);
            setIsGenerating(false);
            toast({
              title: "Cover Letter Generated!",
              description: "Your cover letter has been created successfully."
            });
          }
        }, 3, 'poll for cover letter updates');
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 5000);
    return () => {
      console.log('Cleaning up polling interval');
      clearInterval(pollInterval);
    };
  }, [isGenerating, currentCoverLetterId, isAuthReady, executeWithRetry, toast]);
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Updated handleSubmit to check credits before allowing submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if user has sufficient credits
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

    // Refresh completion status before checking
    await refetchStatus();

    // Wait a moment for the status to update
    setTimeout(async () => {
      if (!isComplete && !completionLoading) {
        toast({
          title: "Profile Incomplete",
          description: "Please complete both your resume upload and bio in your profile before creating a cover letter. The system will auto-refresh.",
          variant: "destructive",
          duration: 8000 // Show for 8 seconds
        });
        return;
      }
      if (!formData.job_title.trim() || !formData.company_name.trim() || !formData.job_description.trim()) {
        // Set individual field validation errors
        setValidationErrors({
          job_title: !formData.job_title.trim() ? 'Please fill in this field.' : '',
          company_name: !formData.company_name.trim() ? 'Please fill in this field.' : '',
          job_description: !formData.job_description.trim() ? 'Please fill in this field.' : ''
        });
        return;
      }

      // Clear validation errors if all fields are filled
      setValidationErrors({
        job_title: '',
        company_name: '',
        job_description: ''
      });
      setIsSubmitting(true);
      setIsGenerating(true);
      setResult('');
      setCurrentCoverLetterId(null);
      try {
        console.log('Submitting cover letter request...');

        // Insert into database with enterprise auth
        await executeWithRetry(async () => {
          const {
            data,
            error
          } = await supabase.from('job_cover_letters').insert({
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
          refetchHistory(); // Update cache with new entry
          toast({
            title: "Request Submitted!",
            description: "Your cover letter is being generated. Credits will be deducted when ready."
          });
        }, 3, 'create cover letter');
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
    }, 1000); // Wait 1 second for status to update
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
  };
  if (!isLoaded || !user) {
    return <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-fuchsia-900 text-xs">Loading...</div>
      </div>;
  }

  // Show professional authentication loading state within the page layout
  if (!isAuthReady && !isRefreshing) {
    return <SidebarProvider defaultOpen={true}>
      {/* Header for mobile */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-sky-900/90 via-fuchsia-900/90 to-indigo-900/85 backdrop-blur-2xl shadow-2xl border-b border-fuchsia-400/30">
        <div className="flex items-center justify-between p-3">
          <SidebarTrigger className="h-12 w-12 border-fuchsia-400/30 ring-2 ring-fuchsia-400/10 text-fuchsia-200 rounded-2xl shadow-lg transition-all flex items-center justify-center bg-stone-900 hover:bg-stone-800">
            <Menu className="w-7 h-7" strokeWidth={2.4} />
            <span className="sr-only">Toggle navigation menu</span>
          </SidebarTrigger>
          <div className="flex items-center gap-2">
            <img alt="JobBots Logo" className="h-8 w-8 drop-shadow-lg" src="/lovable-uploads/dad64682-0078-40c3-9d4a-ca375a807903.jpg" />
            <span className="font-orbitron bg-gradient-to-r from-sky-300 via-fuchsia-400 to-indigo-300 bg-clip-text drop-shadow-sm tracking-wider select-none relative whitespace-nowrap text-lg font-bold text-white">
              Aspirely.ai
            </span>
          </div>
        </div>
      </header>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col pt-28 lg:pt-0 lg:pl-6 bg-zinc-950">
          <main className="flex-1 w-full bg-transparent">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fuchsia-400 mx-auto"></div>
                <div className="text-fuchsia-200 text-sm font-medium">Preparing authentication...</div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>;
  }

  // Check if form is valid and user has credits
  const isFormValid = formData.job_title.trim() && formData.company_name.trim() && formData.job_description.trim();
  const canSubmit = isFormValid && hasCredits && !isSubmitting && !isGenerating;
  return <SidebarProvider defaultOpen={true}>
      {/* Header for mobile */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-sky-900/90 via-fuchsia-900/90 to-indigo-900/85 backdrop-blur-2xl shadow-2xl border-b border-fuchsia-400/30 text-left">
        <div className="flex items-center justify-between p-3">
          <SidebarTrigger className="h-12 w-12 border-fuchsia-400/30 ring-2 ring-fuchsia-400/10 text-fuchsia-200 rounded-2xl shadow-lg transition-all flex items-center justify-center bg-stone-900 hover:bg-stone-800">
            <Menu className="w-7 h-7" strokeWidth={2.4} />
            <span className="sr-only">Toggle navigation menu</span>
          </SidebarTrigger>
          <div className="flex items-center gap-2">
            <img alt="JobBots Logo" className="h-8 w-8 drop-shadow-lg" src="/lovable-uploads/dad64682-0078-40c3-9d4a-ca375a807903.jpg" />
            <span className="font-orbitron bg-gradient-to-r from-sky-300 via-fuchsia-400 to-indigo-300 bg-clip-text drop-shadow-sm tracking-wider select-none relative whitespace-nowrap text-lg font-bold text-white">
              Aspirely.ai
            </span>
          </div>
        </div>
      </header>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col pt-28 lg:pt-0 lg:pl-6 bg-zinc-950">
          <main className="flex-1 w-full bg-transparent">
            <div className="min-h-screen w-full flex flex-col">
              {/* Header Section */}
              <div className="max-w-4xl mx-auto w-full px-3 py-4 sm:px-6 sm:py-6 mt-4">
                {/* Gradient Heading */}
                <div className="mb-8 text-center">
                  <h1 className="text-4xl font-bold mb-2 drop-shadow font-orbitron animate-fade-in md:text-4xl">
                    📝 <span className="bg-gradient-to-r from-pink-600 via-fuchsia-600 to-rose-600 bg-clip-text text-transparent">Cover Letter</span>
                  </h1>
                  <p className="font-inter font-light text-white/90 mb-3 text-sm text-center">
                    Instantly create stunning <span className="italic text-white/85">Cover Letters</span> for every job
                  </p>
                  <Badge className="bg-gradient-to-r from-pink-500/20 to-fuchsia-500/20 text-pink-200 border-pink-400/30 text-sm px-3 py-1 font-inter">
                    <BadgeDollarSign className="w-4 h-4 mr-2" />
                    Usage Fee: 1.5 credits
                  </Badge>
                </div>

                {/* Profile Completion Warning */}
                <ProfileCompletionWarning />

                <div className="space-y-8">
                  {/* Input Form in Gradient Box */}
                  <Card className="rounded-2xl border-0 bg-gradient-to-br from-pink-600 via-fuchsia-600 to-rose-600 shadow-xl">
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
                        <div className="flex items-center gap-2">
                          {connectionIssue && <Button onClick={() => window.location.reload()} variant="outline" size="sm" className="border-orange-400/30 bg-orange-100/10 text-orange-300 hover:bg-orange-200/20" title="Connection issue detected. Click to refresh the page.">
                              <RefreshCw className="w-4 h-4" />
                            </Button>}
                          <Button onClick={() => setShowHistory(true)} variant="outline" size="sm" className="border-white/20 bg-zinc-50 text-gray-950">
                            <History className="w-4 h-4 mr-2" />
                            History
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Inputs Row: Company Name and Job Title in one line for desktop, stacked on mobile */}
                        <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
                          {/* Company Name */}
                           <div className="flex-1 space-y-2">
                             <Label htmlFor="company_name" className="text-white font-medium text-base">
                               🏬 Company Name *
                             </Label>
                             <Input id="company_name" placeholder="e.g. Google, Microsoft" value={formData.company_name} onChange={e => handleInputChange('company_name', e.target.value)} required className="text-base bg-black text-white placeholder:text-white/60 border-white/15" disabled={isGenerating} />
                             {validationErrors.company_name && <div className="flex items-center gap-2 text-orange-400 text-sm bg-orange-100/10 border border-orange-400/30 rounded px-3 py-2">
                                 <span className="text-orange-400">⚠</span>
                                 {validationErrors.company_name}
                               </div>}
                           </div>
                          {/* Job Title */}
                           <div className="flex-1 space-y-2">
                             <Label htmlFor="job_title" className="text-white font-medium text-base">
                               👩🏻‍💻 Job Title *
                             </Label>
                             <Input id="job_title" placeholder="e.g. Software Engineer, Marketing Manager" value={formData.job_title} onChange={e => handleInputChange('job_title', e.target.value)} required className="text-base bg-black text-white placeholder:text-white/60 border-white/15" disabled={isGenerating} />
                             {validationErrors.job_title && <div className="flex items-center gap-2 text-orange-400 text-sm bg-orange-100/10 border border-orange-400/30 rounded px-3 py-2">
                                 <span className="text-orange-400">⚠</span>
                                 {validationErrors.job_title}
                               </div>}
                           </div>
                        </div>

                        {/* Job Description */}
                         <div className="space-y-2">
                           <Label htmlFor="job_description" className="text-white font-medium text-base">
                             💼 Job Description *
                           </Label>
                           <Label htmlFor="job_description" className="text-gray-300 font-normal text-sm block">
                             Paste the job description or key requirements
                           </Label>
                           <Textarea id="job_description" placeholder="Paste the job description here..." value={formData.job_description} onChange={e => handleInputChange('job_description', e.target.value)} required className="min-h-[150px] resize-none text-base bg-black text-white placeholder:text-white/60 border-white/15" disabled={isGenerating} />
                           {validationErrors.job_description && <div className="flex items-center gap-2 text-orange-400 text-sm bg-orange-100/10 border border-orange-400/30 rounded px-3 py-2">
                               <span className="text-orange-400">⚠</span>
                               {validationErrors.job_description}
                             </div>}
                         </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                          {/* Generate Cover Letter - disabled if no credits */}
                          <Button type="submit" disabled={!canSubmit} className="flex-[3] font-semibold text-base h-12 rounded-lg bg-gradient-to-r from-white via-white to-white hover:from-white/90 hover:via-white/90 hover:to-white/90 text-black font-orbitron shadow-2xl shadow-gray-300/50 border-0 disabled:opacity-50 disabled:cursor-not-allowed">
                            {isSubmitting ? "Submitting..." : isGenerating ? "Generating..." : "Generate Cover Letter"}
                          </Button>
                          <Button type="button" onClick={resetForm} variant="outline" disabled={isGenerating} className="flex-1 border-red-500 text-white shadow-lg text-base h-12 px-6 max-sm:w-full bg-indigo-900 hover:bg-indigo-800">
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
                            <CoverLetterDownloadActions coverLetter={result} jobTitle={formData.job_title} companyName={formData.company_name} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>}
                </div>
              </div>

              {/* History Modal */}
              <CoverLetterHistoryModal isOpen={showHistory} onClose={() => setShowHistory(false)} gradientColors="from-pink-400 to-fuchsia-400" />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>;
};
export default CoverLetter;