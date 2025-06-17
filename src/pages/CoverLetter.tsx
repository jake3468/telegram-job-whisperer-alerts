import { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea as TTextarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { FileText, History, Sparkles, Menu } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useUserCompletionStatus } from '@/hooks/useUserCompletionStatus';
import HistoryModal from '@/components/HistoryModal';
import LoadingMessages from '@/components/LoadingMessages';
import CoverLetterDownloadActions from '@/components/CoverLetterDownloadActions';
import { useFeatureCreditCheck } from '@/hooks/useFeatureCreditCheck';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';

interface CoverLetterData {
  cover_letter: string | null;
}

const CoverLetter = () => {
  const { user } = useUser();
  const { toast } = useToast();
  const { userProfile } = useUserProfile();
  const { isComplete } = useUserCompletionStatus();
  useFeatureCreditCheck(1.5);

  const [formData, setFormData] = useState({
    company_name: '',
    job_title: '',
    job_description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coverLetterData, setCoverLetterData] = useState<CoverLetterData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Real-time subscription for cover letter updates
  useEffect(() => {
    if (!currentRequestId) return;

    console.log('Setting up real-time subscription for request ID:', currentRequestId);

    const channel = supabase
      .channel('cover-letter-updates')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'job_cover_letters',
        filter: `id=eq.${currentRequestId}`
      }, (payload) => {
        console.log('Cover letter updated via real-time:', payload);
        
        const newData = payload.new as CoverLetterData;
        console.log('New cover letter data received:', {
          cover_letter_length: newData.cover_letter?.length || 0,
          has_cover_letter: !!newData.cover_letter
        });
        
        setCoverLetterData(newData);

        if (newData.cover_letter) {
          console.log('Cover letter is ready, stopping loading state');
          setIsGenerating(false);
          toast({
            title: "Cover Letter Generated!",
            description: "Your cover letter has been created successfully."
          });
        }
      })
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
      });

    // Also check immediately for existing data
    const checkExistingData = async () => {
      try {
        const { data, error } = await supabase
          .from('job_cover_letters')
          .select('cover_letter')
          .eq('id', currentRequestId)
          .single();

        if (error) {
          console.error('Error checking existing data:', error);
          return;
        }

        if (data?.cover_letter) {
          console.log('Found existing cover letter, stopping loading');
          setCoverLetterData(data);
          setIsGenerating(false);
        }
      } catch (err) {
        console.error('Error checking existing data:', err);
      }
    };

    // Check immediately, then every 3 seconds as fallback
    checkExistingData();
    const interval = setInterval(checkExistingData, 3000);

    return () => {
      console.log('Cleaning up real-time subscription and interval');
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [currentRequestId, toast]);

  // Handle input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !userProfile) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to generate a cover letter.",
        variant: "destructive"
      });
      return;
    }

    if (!isComplete) {
      toast({
        title: "Profile Incomplete",
        description: "Please complete your profile before generating cover letters.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.company_name.trim() || !formData.job_title.trim() || !formData.job_description.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    setIsGenerating(true);
    setCoverLetterData(null);

    try {
      console.log('Creating cover letter with user_profile.id:', userProfile.id);
      console.log('Clerk user ID:', user.id);

      const { data, error } = await supabase
        .from('job_cover_letters')
        .insert({
          user_id: userProfile.id,
          company_name: formData.company_name,
          job_title: formData.job_title,
          job_description: formData.job_description
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log('Cover letter request created successfully:', data);
      setCurrentRequestId(data.id);
      
      toast({
        title: "Request Submitted!",
        description: "Your cover letter is being generated. Please wait..."
      });
    } catch (err: any) {
      console.error('Error creating cover letter:', err);
      setIsGenerating(false);
      
      let errorMessage = "Failed to generate cover letter. Please try again.";
      if (err.message) {
        errorMessage = `Error: ${err.message}`;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      company_name: '',
      job_title: '',
      job_description: ''
    });
    setCoverLetterData(null);
    setIsGenerating(false);
    setCurrentRequestId(null);
  };

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
        
        <div className="flex-1 flex flex-col bg-transparent pt-28 lg:pt-0 lg:pl-6 min-w-0">
          <main className="flex-1 w-full bg-transparent min-w-0">
            <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-slate-800 pt-0 flex flex-col">
              <div className="container mx-auto px-2 sm:px-4 py-8 bg-transparent rounded-3xl mt-4 mb-8 max-w-6xl w-full min-w-0">
                {/* Header Section */}
                <div className="text-center mb-10">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-orbitron font-extrabold bg-gradient-to-r from-teal-300 via-teal-400 to-cyan-400 bg-clip-text text-transparent drop-shadow mb-4 tracking-tight">
                    Cover <span className="italic">Letter</span>
                  </h1>
                  <p className="text-cyan-200 max-w-2xl mx-auto font-inter text-sm sm:text-base lg:text-lg font-light shadow-sm px-4">
                    Generate personalized cover letters that highlight your skills and match the job requirements
                  </p>
                </div>

                <div className="max-w-5xl mx-auto min-w-0">
                  {/* Input Form */}
                  <Card className="bg-gradient-to-br from-cyan-400 via-teal-300 to-teal-500 border-white/10 backdrop-blur-md mb-8 shadow-xl">
                    <CardHeader className="pb-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="min-w-0">
                          <CardTitle className="font-inter text-lg sm:text-xl flex items-center gap-2 text-black font-bold drop-shadow">
                            <Sparkles className="w-5 h-5 text-black drop-shadow flex-shrink-0" />
                            <span>Generate Cover Letter</span>
                          </CardTitle>
                          <CardDescription className="text-black/80 font-inter mb-0 text-sm sm:text-base">
                            Fill in the job details to create a personalized cover letter
                          </CardDescription>
                        </div>
                        <Button 
                          onClick={() => setShowHistory(true)} 
                          variant="outline" 
                          size="sm" 
                          className="border-white/20 text-black bg-teal-200 hover:bg-teal-100 flex-shrink-0"
                        >
                          <History className="w-4 h-4 mr-2 text-black" />
                          History
                        </Button>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-6 sm:space-y-8">
                      <form onSubmit={handleSubmit} className="space-y-6">
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="company_name" className="text-black font-semibold text-base">Company Name *</Label>
                            <TTextarea
                              id="company_name"
                              placeholder="e.g., Google, Microsoft, OpenAI"
                              value={formData.company_name}
                              onChange={e => handleInputChange('company_name', e.target.value)}
                              required
                              className="min-h-[60px] resize-none text-base bg-black/80 border-teal-300/30 text-white placeholder:text-white/80 placeholder:text-xs font-medium" />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="job_title" className="text-black font-semibold text-base">Job Title *</Label>
                            <TTextarea
                              id="job_title"
                              placeholder="e.g., Software Engineer, Product Manager, Data Scientist"
                              value={formData.job_title}
                              onChange={e => handleInputChange('job_title', e.target.value)}
                              required
                              className="min-h-[60px] resize-none text-base bg-black/80 border-teal-300/30 text-white placeholder:text-white/80 placeholder:text-xs font-medium" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="job_description" className="text-black font-semibold text-base">Job Description *</Label>
                          <TTextarea
                            id="job_description"
                            placeholder="Paste the full job description here..."
                            value={formData.job_description}
                            onChange={e => handleInputChange('job_description', e.target.value)}
                            required
                            rows={8}
                            className="resize-none text-base bg-black/80 border-teal-300/30 text-white placeholder:text-white/80 placeholder:text-xs font-medium" />
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                          <Button 
                            type="submit" 
                            disabled={isSubmitting || !formData.company_name.trim() || !formData.job_title.trim() || !formData.job_description.trim() || isGenerating} 
                            className="flex-1 bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-500 hover:from-teal-500 hover:via-cyan-500 hover:to-teal-600 text-black font-semibold text-base h-12 shadow-md"
                          >
                            {isSubmitting ? 'Submitting...' : 'Generate Cover Letter'}
                          </Button>
                          
                          <Button 
                            type="button" 
                            onClick={resetForm} 
                            variant="outline" 
                            className="bg-white/10 border-teal-400/25 text-black hover:bg-white/20 text-base h-12 px-6"
                          >
                            Reset
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>

                  {/* Loading State */}
                  {isGenerating && !coverLetterData?.cover_letter && (
                    <Card className="bg-gray-900 border-teal-400/20 backdrop-blur-sm mb-8">
                      <CardContent className="py-8 flex items-center justify-center">
                        <LoadingMessages type="cover_letter" />
                      </CardContent>
                    </Card>
                  )}

                  {/* Results Display */}
                  {coverLetterData?.cover_letter && (
                    <Card className="bg-gray-900 border-teal-400/20 backdrop-blur-sm">
                      <CardHeader className="pb-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="min-w-0">
                            <CardTitle className="font-inter text-lg sm:text-xl flex items-center gap-2 bg-gradient-to-r from-teal-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent drop-shadow font-bold">
                              <FileText className="w-5 h-5 text-teal-400 drop-shadow flex-shrink-0" />
                              <span>Your Cover Letter</span>
                            </CardTitle>
                            <CardDescription className="text-cyan-300/90 font-inter text-sm sm:text-base">
                              Customized for {formData.company_name} - {formData.job_title}
                            </CardDescription>
                          </div>
                          <CoverLetterDownloadActions 
                            coverLetter={coverLetterData.cover_letter}
                            jobTitle={formData.job_title}
                            companyName={formData.company_name}
                          />
                        </div>
                      </CardHeader>
                      
                      <CardContent>
                        <div className="rounded-lg p-6 border-2 border-blue-200 bg-white min-h-96">
                          <div className="text-black font-inter text-sm md:text-base leading-relaxed break-words whitespace-pre-wrap">
                            {coverLetterData.cover_letter}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>

              {/* History Modal */}
              <HistoryModal 
                type="cover_letters" 
                isOpen={showHistory} 
                onClose={() => setShowHistory(false)} 
                gradientColors="from-cyan-400 to-teal-400" 
              />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default CoverLetter;
