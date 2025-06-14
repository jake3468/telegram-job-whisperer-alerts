
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Share2, History, Copy, Sparkles, Loader2, Users, MessageCircle, Heart, Repeat2, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useUserCompletionStatus } from '@/hooks/useUserCompletionStatus';
import HistoryModal from '@/components/HistoryModal';

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
  const [showHistory, setShowHistory] = useState(false);
  const [currentPostId, setCurrentPostId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const toneOptions = [
    { value: 'professional', label: 'Professional & Insightful' },
    { value: 'conversational', label: 'Conversational & Friendly' },
    { value: 'bold', label: 'Bold & Opinionated' },
    { value: 'thoughtful', label: 'Thoughtful & Reflective' }
  ];

  const loadingMessages = [
    "🚀 Generating your LinkedIn post...",
    "💡 Analyzing trending topics...",
    "✨ Crafting engaging content...",
    "📈 Optimizing for maximum engagement...",
    "🎯 Tailoring to your audience...",
    "⚡ Adding the perfect finishing touches..."
  ];

  const [currentLoadingMessage, setCurrentLoadingMessage] = useState(0);

  // Rotate loading messages
  useEffect(() => {
    if (isGenerating) {
      const interval = setInterval(() => {
        setCurrentLoadingMessage((prev) => (prev + 1) % loadingMessages.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isGenerating]);

  // Set up real-time subscription for LinkedIn post updates
  useEffect(() => {
    if (!currentPostId || !userProfile) return;

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
          if (payload.new.linkedin_post && payload.new.linkedin_post !== payload.old?.linkedin_post) {
            setResult(payload.new.linkedin_post);
            setIsGenerating(false);
            toast({
              title: "LinkedIn Post Generated!",
              description: "Your LinkedIn post has been generated successfully."
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentPostId, userProfile, toast]);

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
    setCurrentLoadingMessage(0);

    try {
      // Insert into database - this will trigger the webhook
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

      if (error) throw error;

      setCurrentPostId(data.id);
      console.log('LinkedIn post created with ID:', data.id);

      toast({
        title: "Request Submitted!",
        description: "We're generating your LinkedIn post. This may take a few moments."
      });
    } catch (err) {
      console.error('Error creating LinkedIn post:', err);
      setIsGenerating(false);
      toast({
        title: "Error",
        description: "Failed to create LinkedIn post. Please try again.",
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
    setCurrentPostId(null);
    setIsGenerating(false);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-900">
        <div className="container mx-auto px-4 py-8 bg-zinc-950">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl bg-gradient-to-r from-slate-200 via-gray-300 to-zinc-400 bg-clip-text text-transparent mb-4 font-inter md:text-4xl font-medium">
              LinkedIn Posts
            </h1>
            <p className="text-gray-300 max-w-2xl mx-auto font-inter text-sm font-light">
              Create engaging LinkedIn posts that showcase your expertise and connect with your professional network
            </p>
          </div>

          {/* Widened Form Layout - Changed from max-w-2xl to max-w-4xl to match Cover Letter page */}
          <div className="max-w-4xl mx-auto">
            {/* Input Form */}
            <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-white/20 backdrop-blur-sm mb-8">
              <CardHeader className="pb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white font-inter text-xl flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-slate-400" />
                      Create Your Post
                    </CardTitle>
                    <CardDescription className="text-gray-300 font-inter">
                      Fill in the details to generate your LinkedIn post
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
                  {/* Topic */}
                  <div className="space-y-3">
                    <Label htmlFor="topic" className="text-white font-medium text-base">
                      Topic or Theme *
                    </Label>
                    <Label htmlFor="topic" className="text-gray-300 font-normal text-sm block">
                      What is the main topic you want to write about?
                    </Label>
                    <Textarea 
                      id="topic"
                      placeholder="e.g. AI in customer service, Layoffs in tech, Remote work trends"
                      value={formData.topic}
                      onChange={(e) => handleInputChange('topic', e.target.value)}
                      required
                      className="min-h-[60px] resize-none text-base bg-gray-900"
                    />
                  </div>

                  {/* Opinion */}
                  <div className="space-y-3">
                    <Label htmlFor="opinion" className="text-white font-medium text-base">
                      Your Key Point or Opinion
                    </Label>
                    <Label htmlFor="opinion" className="text-gray-300 font-normal text-sm block">
                      What is your main insight, opinion, or message?
                    </Label>
                    <Textarea 
                      id="opinion"
                      placeholder="I believe hybrid AI + human support is the future."
                      value={formData.opinion}
                      onChange={(e) => handleInputChange('opinion', e.target.value)}
                      className="min-h-[80px] resize-none text-base bg-gray-900"
                    />
                  </div>

                  {/* Personal Story */}
                  <div className="space-y-3">
                    <Label htmlFor="personal_story" className="text-white font-medium text-base">
                      Personal Experience or Story
                    </Label>
                    <Label htmlFor="personal_story" className="text-gray-300 font-normal text-sm block">
                      Do you have a story, data point, or personal experience to include?
                    </Label>
                    <Textarea 
                      id="personal_story"
                      placeholder="We reduced response time by 40% after implementing AI chat."
                      value={formData.personal_story}
                      onChange={(e) => handleInputChange('personal_story', e.target.value)}
                      className="min-h-[80px] resize-none text-base bg-gray-900"
                    />
                  </div>

                  {/* Audience */}
                  <div className="space-y-3">
                    <Label htmlFor="audience" className="text-white font-medium text-base">
                      Target Audience
                    </Label>
                    <Label htmlFor="audience" className="text-gray-300 font-normal text-sm block">
                      Who are you writing this for?
                    </Label>
                    <Textarea 
                      id="audience"
                      placeholder="Startup founders, product managers, working moms, new grads…"
                      value={formData.audience}
                      onChange={(e) => handleInputChange('audience', e.target.value)}
                      className="min-h-[60px] resize-none text-base bg-gray-900"
                    />
                  </div>

                  {/* Tone */}
                  <div className="space-y-3">
                    <Label htmlFor="tone" className="text-white font-medium text-base">
                      Tone/Style Preference
                    </Label>
                    <Label htmlFor="tone" className="text-gray-300 font-normal text-sm block">
                      What tone do you prefer?
                    </Label>
                    <Select onValueChange={(value) => handleInputChange('tone', value)}>
                      <SelectTrigger className="text-base bg-gray-900 text-white border-white/20">
                        <SelectValue placeholder="Select a tone..." />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-white/20">
                        {toneOptions.map((option) => (
                          <SelectItem 
                            key={option.value} 
                            value={option.value}
                            className="text-white hover:bg-white/20 focus:bg-white/20 data-[highlighted]:bg-white/20"
                          >
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button 
                      type="submit" 
                      disabled={isSubmitting || !formData.topic.trim()} 
                      className="flex-1 bg-gradient-to-r from-slate-500 to-gray-600 hover:from-slate-600 hover:to-gray-700 text-white font-medium text-base h-12"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating Post...
                        </>
                      ) : (
                        'Generate LinkedIn Post'
                      )}
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
            {isGenerating && (
              <Card className="bg-white/5 border-white/20 backdrop-blur-sm mb-8">
                <CardContent className="py-12">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                    <p className="text-slate-300 text-lg font-medium">
                      {loadingMessages[currentLoadingMessage]}
                    </p>
                    <div className="flex space-x-1">
                      {loadingMessages.map((_, index) => (
                        <div
                          key={index}
                          className={`h-2 w-2 rounded-full transition-colors duration-300 ${
                            index === currentLoadingMessage ? 'bg-slate-400' : 'bg-slate-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Result Display - LinkedIn Style Post */}
            {result && !isGenerating && (
              <Card className="bg-white/5 border-white/20 backdrop-blur-sm">
                <CardHeader className="pb-6">
                  <CardTitle className="text-white font-inter text-xl flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-slate-400" />
                    Your LinkedIn Post
                  </CardTitle>
                  <CardDescription className="text-gray-300 font-inter">
                    Your generated LinkedIn post is ready!
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* LinkedIn-style post container */}
                    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                      {/* LinkedIn post header */}
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {user?.firstName} {user?.lastName}
                          </h3>
                          <p className="text-sm text-gray-500">Professional</p>
                          <p className="text-xs text-gray-400">1h • 🌐</p>
                        </div>
                      </div>
                      
                      {/* Post content */}
                      <div className="text-gray-800 text-base leading-relaxed whitespace-pre-wrap mb-4">
                        {result}
                      </div>
                      
                      {/* LinkedIn engagement buttons */}
                      <div className="border-t border-gray-200 pt-3">
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                          <span>12 reactions • 3 comments</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <button className="flex items-center space-x-2 px-4 py-2 rounded hover:bg-gray-50 transition-colors">
                            <Heart className="w-4 h-4" />
                            <span>Like</span>
                          </button>
                          <button className="flex items-center space-x-2 px-4 py-2 rounded hover:bg-gray-50 transition-colors">
                            <MessageCircle className="w-4 h-4" />
                            <span>Comment</span>
                          </button>
                          <button className="flex items-center space-x-2 px-4 py-2 rounded hover:bg-gray-50 transition-colors">
                            <Repeat2 className="w-4 h-4" />
                            <span>Repost</span>
                          </button>
                          <button className="flex items-center space-x-2 px-4 py-2 rounded hover:bg-gray-50 transition-colors">
                            <Send className="w-4 h-4" />
                            <span>Send</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={handleCopyResult} 
                      className="w-full bg-slate-700 hover:bg-slate-600 text-white flex items-center gap-2 text-base h-12"
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
          gradientColors="from-slate-400 to-gray-500" 
        />
      </div>
    </Layout>
  );
};

export default LinkedInPosts;
