import { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Share2, History, Copy, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useUserCompletionStatus } from '@/hooks/useUserCompletionStatus';
import HistoryModal from '@/components/HistoryModal';
import LinkedInPostDisplay from '@/components/LinkedInPostDisplay';
import LoadingMessages from '@/components/LoadingMessages';

const LinkedInPosts = () => {
  const { user } = useUser();
  const { toast } = useToast();
  const { userProfile } = useUserProfile();
  const { isComplete } = useUserCompletionStatus();

  const [formData, setFormData] = useState({
    topic: '',
    opinion: '',
    personal_story: '',
    audience: '',
    tone: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPostId, setCurrentPostId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const toneOptions = [
    { value: 'professional', label: 'Professional & Insightful' },
    { value: 'conversational', label: 'Conversational & Friendly' },
    { value: 'bold', label: 'Bold & Opinionated' },
    { value: 'thoughtful', label: 'Thoughtful & Reflective' }
  ];

  // Real-time subscription for LinkedIn post updates
  useEffect(() => {
    if (!currentPostId) return;

    const channel = supabase
      .channel('linkedin-post-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'job_linkedin',
          filter: `id=eq.${currentPostId}`
        },
        (payload) => {
          console.log('LinkedIn post updated:', payload);
          if (payload.new.linkedin_post) {
            setResult(payload.new.linkedin_post);
            setIsGenerating(false);
            toast({
              title: "LinkedIn Post Generated!",
              description: "Your LinkedIn post has been created successfully."
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentPostId, toast]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !userProfile) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create LinkedIn posts.",
        variant: "destructive"
      });
      return;
    }

    if (!isComplete) {
      toast({
        title: "Profile Incomplete",
        description: "Please complete your profile before creating LinkedIn posts.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.topic.trim()) {
      toast({
        title: "Topic Required",
        description: "Please enter a topic for your LinkedIn post.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    setIsGenerating(true);
    setResult('');

    try {
      console.log('Creating LinkedIn post with user_profile.id:', userProfile.id);
      console.log('Clerk user ID:', user.id);

      // Insert into database - RLS policies are permissive so no special auth needed
      const { data, error } = await supabase
        .from('job_linkedin')
        .insert({
          user_id: userProfile.id,
          topic: formData.topic,
          opinion: formData.opinion || null,
          personal_story: formData.personal_story || null,
          audience: formData.audience || null,
          tone: formData.tone || null
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

      console.log('LinkedIn post created successfully:', data);
      setCurrentPostId(data.id);

      toast({
        title: "Request Submitted!",
        description: "Your LinkedIn post is being generated. Please wait..."
      });
    } catch (err: any) {
      console.error('Error creating LinkedIn post:', err);
      setIsGenerating(false);
      
      let errorMessage = "Failed to create LinkedIn post. Please try again.";
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

  const handleCopyResult = async () => {
    if (!result) return;

    try {
      await navigator.clipboard.writeText(result);
      toast({
        title: "Copied!",
        description: "LinkedIn post copied to clipboard successfully."
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
      topic: '',
      opinion: '',
      personal_story: '',
      audience: '',
      tone: ''
    });
    setResult('');
    setIsGenerating(false);
    setCurrentPostId(null);
  };

  return (
    <Layout>
      {/* Consistent dark background */}
      <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-slate-800 pt-0 flex flex-col">
        <div className="container mx-auto px-2 sm:px-4 py-8 bg-transparent rounded-3xl mt-4 mb-8 max-w-3xl w-full">
          {/* Header Section */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-orbitron font-extrabold bg-gradient-to-r from-teal-300 via-teal-400 to-cyan-400 bg-clip-text text-transparent drop-shadow mb-4 tracking-tight">
              LinkedIn <span className="italic">Posts</span>
            </h1>
            <p className="text-cyan-200 max-w-2xl mx-auto font-inter text-lg font-light shadow-sm">
              Create engaging LinkedIn posts that showcase your expertise and connect with your professional network
            </p>
          </div>
          <div className="max-w-3xl mx-auto">
            {/* Input Form */}
            <Card className="bg-gradient-to-br from-teal-900 via-cyan-900 to-gray-900 border-white/10 backdrop-blur-md mb-8 shadow-xl">
              <CardHeader className="pb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="font-inter text-xl flex items-center gap-2 text-white font-bold">
                      <Sparkles className="w-5 h-5 text-teal-400 drop-shadow" />
                      <span>Create Your Post</span>
                    </CardTitle>
                    <CardDescription className="text-cyan-300/90 font-inter mb-0">
                      Fill in the details to generate your LinkedIn post
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={() => setShowHistory(true)} 
                    variant="outline" 
                    size="sm" 
                    className="bg-teal-600/10 border-teal-400/30 text-teal-200 hover:bg-teal-700/20"
                  >
                    <History className="w-4 h-4 mr-2" />
                    History
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Inputs Row: Topic + Opinion (side-by-side on desktop) */}
                  <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                    {/* Topic (left) */}
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="topic" className="text-cyan-200 font-semibold text-base">Topic or Theme *</Label>
                      <Label htmlFor="topic" className="text-cyan-300/80 font-normal text-sm block">What is the main topic you want to write about?</Label>
                      <Textarea 
                        id="topic"
                        placeholder="e.g. AI in customer service, Layoffs in tech, Remote work trends"
                        value={formData.topic}
                        onChange={(e) => handleInputChange('topic', e.target.value)}
                        required
                        className="min-h-[60px] resize-none text-base bg-gray-950 border-teal-400/25 text-white placeholder:text-white/60 font-medium"
                      />
                    </div>
                    {/* Opinion (right) */}
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="opinion" className="text-cyan-200 font-semibold text-base">Your Key Point or Opinion</Label>
                      <Label htmlFor="opinion" className="text-cyan-300/80 font-normal text-sm block">What is your main insight, opinion, or message?</Label>
                      <Textarea 
                        id="opinion"
                        placeholder="I believe hybrid AI + human support is the future."
                        value={formData.opinion}
                        onChange={(e) => handleInputChange('opinion', e.target.value)}
                        className="min-h-[60px] resize-none text-base bg-gray-950 border-teal-400/25 text-white placeholder:text-white/60 font-medium"
                      />
                    </div>
                  </div>

                  {/* Inputs Row: Personal Story + Audience */}
                  <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                    {/* Personal Story (left) */}
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="personal_story" className="text-cyan-200 font-semibold text-base">Personal Experience or Story</Label>
                      <Label htmlFor="personal_story" className="text-cyan-300/80 font-normal text-sm block">Do you have a story, data point, or personal experience to include?</Label>
                      <Textarea 
                        id="personal_story"
                        placeholder="We reduced response time by 40% after implementing AI chat."
                        value={formData.personal_story}
                        onChange={(e) => handleInputChange('personal_story', e.target.value)}
                        className="min-h-[60px] resize-none text-base bg-gray-950 border-teal-400/25 text-white placeholder:text-white/60 font-medium"
                      />
                    </div>
                    {/* Audience (right) */}
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="audience" className="text-cyan-200 font-semibold text-base">Target Audience</Label>
                      <Label htmlFor="audience" className="text-cyan-300/80 font-normal text-sm block">Who are you writing this for?</Label>
                      <Textarea 
                        id="audience"
                        placeholder="Startup founders, product managers, working moms, new grads…"
                        value={formData.audience}
                        onChange={(e) => handleInputChange('audience', e.target.value)}
                        className="min-h-[60px] resize-none text-base bg-gray-950 border-teal-400/25 text-white placeholder:text-white/60 font-medium"
                      />
                    </div>
                  </div>

                  {/* Tone: full width */}
                  <div className="space-y-2">
                    <Label htmlFor="tone" className="text-cyan-200 font-semibold text-base">Tone/Style Preference</Label>
                    <Label htmlFor="tone" className="text-cyan-300/80 font-normal text-sm block">What tone do you prefer?</Label>
                    <Select onValueChange={(value) => handleInputChange('tone', value)}>
                      <SelectTrigger className="text-base bg-gray-950 text-white border-teal-400/25 font-medium">
                        <SelectValue placeholder="Select a tone..." />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-950 border-teal-400/25 text-white">
                        {toneOptions.map((option) => (
                          <SelectItem 
                            key={option.value} 
                            value={option.value}
                            className="text-white font-medium hover:bg-cyan-100/10 focus:bg-cyan-200/10 data-[highlighted]:bg-cyan-100/10"
                          >
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Button row: Generate (flex-1, more prominent), Reset (smaller) */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button 
                      type="submit" 
                      disabled={isSubmitting || !formData.topic.trim() || isGenerating} 
                      className="flex-1 bg-gradient-to-r from-teal-500 via-cyan-400 to-teal-500 hover:from-teal-600 hover:via-cyan-500 hover:to-teal-600 text-black font-semibold text-base h-12 shadow-md"
                    >
                      {isSubmitting ? 'Submitting...' : 'Generate LinkedIn Post'}
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
            {isGenerating && !result && (
              <Card className="bg-gray-900 border-teal-400/20 backdrop-blur-sm mb-8">
                <CardContent className="py-8 flex items-center justify-center">
                  <LoadingMessages type="linkedin" />
                </CardContent>
              </Card>
            )}

            {/* Result Display */}
            {result && (
              <Card className="bg-gray-900 border-teal-400/20 backdrop-blur-sm">
                <CardHeader className="pb-6">
                  <CardTitle className="font-inter text-xl flex items-center gap-2 bg-gradient-to-r from-teal-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent drop-shadow font-bold">
                    <Share2 className="w-5 h-5 text-teal-400 drop-shadow" />
                    <span>Your LinkedIn Post</span>
                  </CardTitle>
                  <CardDescription className="text-cyan-300/90 font-inter">
                    Your generated LinkedIn post is ready!
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <LinkedInPostDisplay 
                      content={result} 
                      userProfile={userProfile}
                    />
                    
                    <Button 
                      onClick={handleCopyResult} 
                      className="w-full bg-teal-700 hover:bg-teal-600 text-black flex items-center gap-2 text-base h-12 font-semibold"
                    >
                      <Copy className="w-4 h-4" />
                      Copy LinkedIn Post
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* History Modal */}
        <HistoryModal 
          type="linkedin_posts" 
          isOpen={showHistory} 
          onClose={() => setShowHistory(false)} 
          gradientColors="from-cyan-400 to-teal-400" 
        />
      </div>
    </Layout>
  );
};

export default LinkedInPosts;
