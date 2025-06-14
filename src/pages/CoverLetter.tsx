import { useUser } from '@clerk/clerk-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthHeader from '@/components/AuthHeader';
import { Layout } from '@/components/Layout';
import { useState } from 'react';
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
    job_description: '',
    specific_skills: '',
    tone: 'professional'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentCoverLetterId, setCurrentCoverLetterId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const toneOptions = [
    { value: 'professional', label: 'Professional & Formal' },
    { value: 'conversational', label: 'Conversational & Friendly' },
    { value: 'enthusiastic', label: 'Enthusiastic & Passionate' },
    { value: 'concise', label: 'Concise & Direct' }
  ];

  useEffect(() => {
    if (isLoaded && !user) {
      navigate('/');
    }
  }, [user, isLoaded, navigate]);

  // Real-time subscription for cover letter updates
  useEffect(() => {
    if (!currentCoverLetterId) return;

    const channel = supabase
      .channel('cover-letter-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'job_cover_letters',
          filter: `id=eq.${currentCoverLetterId}`
        },
        (payload) => {
          console.log('Cover letter updated:', payload);
          if (payload.new.cover_letter) {
            setResult(payload.new.cover_letter);
            setIsGenerating(false);
            toast({
              title: "Cover Letter Generated!",
              description: "Your cover letter has been created successfully."
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentCoverLetterId, toast]);

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

    try {
      // Insert into database
      const { data, error } = await supabase
        .from('job_cover_letters')
        .insert({
          user_id: userProfile.id,
          job_title: formData.job_title,
          company_name: formData.company_name,
          job_description: formData.job_description,
          specific_skills: formData.specific_skills || null,
          tone: formData.tone
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Cover letter created successfully:', data);
      setCurrentCoverLetterId(data.id);

      toast({
        title: "Request Submitted!",
        description: "Your cover letter is being generated. Please wait..."
      });
    } catch (err: any) {
      console.error('Error creating cover letter:', err);
      setIsGenerating(false);
      
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
      console.error('Failed to copy text:', err);
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
      job_description: '',
      specific_skills: '',
      tone: 'professional'
    });
    setResult('');
    setIsGenerating(false);
    setCurrentCoverLetterId(null);
  };

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pastel-lavender via-pastel-peach to-pastel-mint flex items-center justify-center">
        <div className="text-fuchsia-900 text-xs">Loading...</div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen w-full bg-gradient-to-br from-pastel-mint/70 via-pastel-peach/80 to-pastel-blue/50 flex flex-col">
        <div className="max-w-4xl mx-auto w-full px-3 py-8 sm:px-6 sm:py-12 backdrop-blur-xl rounded-3xl bg-black/85 shadow-2xl shadow-fuchsia-200/20 mt-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-orbitron font-extrabold bg-gradient-to-r from-pastel-blue via-fuchsia-400 to-pastel-peach bg-clip-text text-transparent mb-2 drop-shadow">
              AI <span className="italic">Cover Letter</span> Generator
            </h1>
            <p className="text-lg text-fuchsia-100 font-inter font-light">
              Instantly create stunning <span className="italic text-pastel-mint">Cover Letters</span> for every job
            </p>
          </div>
          <div className="space-y-8">
            {/* Input Form */}
            <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-white/20 backdrop-blur-sm mb-8">
              <CardHeader className="pb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white font-inter text-xl flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-slate-400" />
                      Create Your Cover Letter
                    </CardTitle>
                    <CardDescription className="text-gray-300 font-inter">
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
                      className="text-base bg-gray-900"
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
                      className="text-base bg-gray-900"
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
                      className="min-h-[150px] resize-none text-base bg-gray-900"
                    />
                  </div>

                  {/* Specific Skills */}
                  <div className="space-y-2">
                    <Label htmlFor="specific_skills" className="text-white font-medium text-base">
                      Specific Skills or Experiences to Highlight
                    </Label>
                    <Textarea 
                      id="specific_skills"
                      placeholder="e.g. Project management, React.js, Team leadership"
                      value={formData.specific_skills}
                      onChange={(e) => handleInputChange('specific_skills', e.target.value)}
                      className="min-h-[80px] resize-none text-base bg-gray-900"
                    />
                  </div>

                  {/* Tone Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="tone" className="text-white font-medium text-base">
                      Tone
                    </Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {toneOptions.map((option) => (
                        <Button
                          key={option.value}
                          type="button"
                          variant={formData.tone === option.value ? "default" : "outline"}
                          onClick={() => handleInputChange('tone', option.value)}
                          className={`h-auto py-3 ${
                            formData.tone === option.value 
                              ? "bg-gradient-to-r from-pastel-blue to-pastel-mint border-pastel-blue/50" 
                              : "bg-white/10 border-white/20 hover:bg-white/20"
                          }`}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button 
                      type="submit" 
                      disabled={isSubmitting || !formData.job_title.trim() || !formData.company_name.trim() || !formData.job_description.trim() || isGenerating} 
                      className="flex-1 bg-gradient-to-r from-pastel-blue to-pastel-mint hover:from-pastel-blue/80 hover:to-pastel-mint/80 text-black font-medium text-base h-12"
                    >
                      {isSubmitting ? 'Submitting...' : 'Generate Cover Letter'}
                    </Button>
                    
                    <Button 
                      type="button" 
                      onClick={resetForm} 
                      variant="outline" 
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-base h-12 px-6"
                    >
                      Reset
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Loading State */}
            {isGenerating && !result && (
              <Card className="bg-white/5 border-white/20 backdrop-blur-sm mb-8">
                <CardContent className="py-8">
                  <LoadingMessages />
                </CardContent>
              </Card>
            )}

            {/* Result Display */}
            {result && (
              <Card className="bg-white/5 border-white/20 backdrop-blur-sm">
                <CardHeader className="pb-6">
                  <CardTitle className="text-white font-inter text-xl flex items-center gap-2">
                    <FileText className="w-5 h-5 text-slate-400" />
                    Your Cover Letter
                  </CardTitle>
                  <CardDescription className="text-gray-300 font-inter">
                    Your generated cover letter for {formData.job_title} at {formData.company_name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Card className="bg-white/10 border-white/30 p-6">
                      <ScrollArea className="h-[400px] w-full pr-4">
                        <div className="whitespace-pre-wrap font-inter text-white">
                          {result}
                        </div>
                      </ScrollArea>
                    </Card>
                    
                    <Button 
                      onClick={handleCopyResult} 
                      className="w-full bg-gradient-to-r from-pastel-mint to-pastel-blue hover:from-pastel-mint/80 hover:to-pastel-blue/80 text-black flex items-center gap-2 text-base h-12"
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
          gradientColors="from-pastel-mint to-pastel-blue" 
        />
      </div>
    </Layout>
  );
};

export default CoverLetter;
