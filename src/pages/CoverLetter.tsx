
import { useUser } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthHeader from '@/components/AuthHeader';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { FileText, History, Copy, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useUserCompletionStatus } from '@/hooks/useUserCompletionStatus';
import HistoryModal from '@/components/HistoryModal';
import LoadingMessages from '@/components/LoadingMessages';
import { ScrollArea } from '@/components/ui/scroll-area';

const CoverLetter = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userProfile } = useUserProfile();
  const { isComplete } = useUserCompletionStatus();

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

  useEffect(() => {
    if (isLoaded && !user) {
      navigate('/');
    }
  }, [user, isLoaded, navigate]);

  // Enhanced real-time subscription for cover letter updates
  useEffect(() => {
    if (!currentCoverLetterId) return;

    console.log('Setting up real-time subscription for cover letter ID:', currentCoverLetterId);

    const channel = supabase
      .channel(`cover-letter-${currentCoverLetterId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'job_cover_letters',
          filter: `id=eq.${currentCoverLetterId}`
        },
        (payload) => {
          console.log('Real-time update received:', payload);
          
          if (payload.new && payload.new.cover_letter) {
            const coverLetterContent = payload.new.cover_letter.trim();
            if (coverLetterContent.length > 0) {
              console.log('Cover letter content received, updating UI');
              setResult(coverLetterContent);
              setIsGenerating(false);

              toast({
                title: "Cover Letter Generated!",
                description: "Your cover letter has been created successfully."
              });
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    // Cleanup function
    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [currentCoverLetterId, toast]);

  // Polling fallback - check for updates every 5 seconds when generating
  useEffect(() => {
    if (!isGenerating || !currentCoverLetterId) return;

    const pollInterval = setInterval(async () => {
      console.log('Polling for cover letter updates...');
      
      try {
        const { data, error } = await supabase
          .from('job_cover_letters')
          .select('cover_letter')
          .eq('id', currentCoverLetterId)
          .single();

        if (error) {
          console.error('Error polling for updates:', error);
          return;
        }

        if (data?.cover_letter && data.cover_letter.trim().length > 0) {
          console.log('Cover letter found via polling, updating UI');
          setResult(data.cover_letter);
          setIsGenerating(false);

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
  }, [isGenerating, currentCoverLetterId, toast]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

    try {
      console.log('Submitting cover letter request...');
      
      // Insert into database
      const { data, error } = await supabase
        .from('job_cover_letters')
        .insert({
          user_id: userProfile.id,
          job_title: formData.job_title,
          company_name: formData.company_name,
          job_description: formData.job_description
        })
        .select()
        .single();

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
  };

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-neutral-900 to-black flex items-center justify-center">
        <div className="text-fuchsia-900 text-xs">Loading...</div>
      </div>
    );
  }

  return (
    <Layout>
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
            <Card
              className="rounded-2xl border-0 bg-gradient-to-br from-rose-700/90 via-fuchsia-800/80 to-pink-700/90 shadow-xl"
              style={{
                boxShadow: '0 2px 32px 0 rgba(150,97,255,0.12)'
              }}
            >
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
                  <Button 
                    onClick={() => setShowHistory(true)} 
                    variant="outline" 
                    size="sm" 
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <History className="w-4 h-4 mr-2" />
                    History
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Job Title */}
                  <div className="space-y-2">
                    <Label htmlFor="job_title" className="text-white font-medium text-base">
                      Job Title *
                    </Label>
                    <Input 
                      id="job_title"
                      placeholder="e.g. Software Engineer, Marketing Manager"
                      value={formData.job_title}
                      onChange={(e) => handleInputChange('job_title', e.target.value)}
                      required
                      className="text-base bg-black text-white placeholder:text-white/60 border-white/15"
                      disabled={isGenerating}
                    />
                  </div>

                  {/* Company Name */}
                  <div className="space-y-2">
                    <Label htmlFor="company_name" className="text-white font-medium text-base">
                      Company Name *
                    </Label>
                    <Input 
                      id="company_name"
                      placeholder="e.g. Google, Microsoft"
                      value={formData.company_name}
                      onChange={(e) => handleInputChange('company_name', e.target.value)}
                      required
                      className="text-base bg-black text-white placeholder:text-white/60 border-white/15"
                      disabled={isGenerating}
                    />
                  </div>

                  {/* Job Description */}
                  <div className="space-y-2">
                    <Label htmlFor="job_description" className="text-white font-medium text-base">
                      Job Description *
                    </Label>
                    <Label htmlFor="job_description" className="text-gray-300 font-normal text-sm block">
                      Paste the job description or key requirements
                    </Label>
                    <Textarea 
                      id="job_description"
                      placeholder="Paste the job description here..."
                      value={formData.job_description}
                      onChange={(e) => handleInputChange('job_description', e.target.value)}
                      required
                      className="min-h-[150px] resize-none text-base bg-black text-white placeholder:text-white/60 border-white/15"
                      disabled={isGenerating}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button 
                      type="submit" 
                      disabled={isSubmitting || !formData.job_title.trim() || !formData.company_name.trim() || !formData.job_description.trim() || isGenerating} 
                      className="flex-1 bg-gradient-to-r from-pink-400 to-fuchsia-500 hover:from-pink-400/80 hover:to-fuchsia-500/80 text-white font-semibold text-base h-12 rounded-lg"
                    >
                      {isSubmitting ? 'Submitting...' : isGenerating ? 'Generating...' : 'Generate Cover Letter'}
                    </Button>
                    
                    <Button 
                      type="button" 
                      onClick={resetForm} 
                      variant="outline" 
                      className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20 text-base h-12 px-6"
                      disabled={isGenerating}
                    >
                      Reset
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Loading State */}
            {isGenerating && !result && (
              <Card className="bg-[#33203a]/80 border-0 shadow">
                <CardContent className="py-8">
                  <LoadingMessages type="cover_letter" />
                </CardContent>
              </Card>
            )}

            {/* Result Display */}
            {result && (
              <Card className="bg-[#33203a]/80 border-0 shadow">
                <CardHeader className="pb-6">
                  <CardTitle className="text-white font-inter text-xl flex items-center gap-2">
                    <FileText className="w-5 h-5 text-fuchsia-300" />
                    Your Cover Letter
                  </CardTitle>
                  <CardDescription className="text-gray-300 font-inter">
                    Your generated cover letter for {formData.job_title} at {formData.company_name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Card className="bg-black border-white/20 p-6">
                      <ScrollArea className="h-[400px] w-full pr-4">
                        <div className="whitespace-pre-wrap font-inter text-white text-base">
                          {result}
                        </div>
                      </ScrollArea>
                    </Card>
                    <Button 
                      onClick={handleCopyResult} 
                      className="w-full bg-gradient-to-r from-pink-400 to-fuchsia-500 hover:from-pink-400/80 hover:to-fuchsia-500/80 text-white flex items-center gap-2 text-base h-12"
                    >
                      <Copy className="w-4 h-4" />
                      Copy Cover Letter
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* History Modal */}
        <HistoryModal 
          type="cover_letter" 
          isOpen={showHistory} 
          onClose={() => setShowHistory(false)} 
          gradientColors="from-pink-400 to-fuchsia-400" 
        />
      </div>
    </Layout>
  );
};

export default CoverLetter;
