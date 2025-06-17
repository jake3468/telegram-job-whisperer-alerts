
import { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea as TTextarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Share2, History, Sparkles, Menu } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useUserCompletionStatus } from '@/hooks/useUserCompletionStatus';
import HistoryModal from '@/components/HistoryModal';
import LinkedInPostVariation from '@/components/LinkedInPostVariation';
import LoadingMessages from '@/components/LoadingMessages';
import { useFeatureCreditCheck } from '@/hooks/useFeatureCreditCheck';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';

interface LinkedInPostData {
  post_heading_1: string | null;
  post_content_1: string | null;
  post_heading_2: string | null;
  post_content_2: string | null;
  post_heading_3: string | null;
  post_content_3: string | null;
}

interface UserData {
  first_name: string | null;
  last_name: string | null;
}

const LinkedInPosts = () => {
  const { user } = useUser();
  const { toast } = useToast();
  const { userProfile } = useUserProfile();
  const { isComplete } = useUserCompletionStatus();
  useFeatureCreditCheck(1.5);

  const [formData, setFormData] = useState({
    topic: '',
    opinion: '',
    personal_story: '',
    audience: '',
    tone: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postsData, setPostsData] = useState<LinkedInPostData | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPostId, setCurrentPostId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const toneOptions = [
    { value: 'professional', label: 'Professional & Insightful' },
    { value: 'conversational', label: 'Conversational & Friendly' },
    { value: 'bold', label: 'Bold & Opinionated' },
    { value: 'thoughtful', label: 'Thoughtful & Reflective' }
  ];

  // Fetch user data when component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('users')
          .select('first_name, last_name')
          .eq('clerk_id', user.id)
          .single();
        
        if (error) {
          console.error('Error fetching user data:', error);
          return;
        }
        
        setUserData(data);
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
    };

    fetchUserData();
  }, [user?.id]);

  // Check if all posts are ready (all 6 columns have non-null values)
  const areAllPostsReady = (data: LinkedInPostData) => {
    const allFieldsPresent = data.post_heading_1 && data.post_content_1 &&
           data.post_heading_2 && data.post_content_2 &&
           data.post_heading_3 && data.post_content_3;
    
    console.log('Checking if all posts ready:', {
      post_heading_1: !!data.post_heading_1,
      post_content_1: !!data.post_content_1,
      post_heading_2: !!data.post_heading_2,
      post_content_2: !!data.post_content_2,
      post_heading_3: !!data.post_heading_3,
      post_content_3: !!data.post_content_3,
      allReady: allFieldsPresent
    });
    
    return allFieldsPresent;
  };

  // Real-time subscription for LinkedIn post updates
  useEffect(() => {
    if (!currentPostId) return;

    console.log('Setting up real-time subscription for post ID:', currentPostId);

    const channel = supabase
      .channel('linkedin-post-updates')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'job_linkedin',
        filter: `id=eq.${currentPostId}`
      }, (payload) => {
        console.log('LinkedIn post updated via real-time:', payload);
        
        const newData = payload.new as LinkedInPostData;
        console.log('New data received:', {
          post_heading_1: newData.post_heading_1,
          post_content_1: !!newData.post_content_1,
          post_heading_2: newData.post_heading_2,
          post_content_2: !!newData.post_content_2,
          post_heading_3: newData.post_heading_3,
          post_content_3: !!newData.post_content_3,
        });
        
        setPostsData(newData);

        if (areAllPostsReady(newData)) {
          console.log('All posts are ready, stopping loading state');
          setIsGenerating(false);
          toast({
            title: "LinkedIn Posts Generated!",
            description: "Your 3 LinkedIn post variations have been created successfully."
          });
        } else {
          console.log('Not all posts ready yet, continuing to wait...');
        }
      })
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
      });

    // Also check immediately for existing data
    const checkExistingData = async () => {
      try {
        const { data, error } = await supabase
          .from('job_linkedin')
          .select('post_heading_1, post_content_1, post_heading_2, post_content_2, post_heading_3, post_content_3')
          .eq('id', currentPostId)
          .single();

        if (error) {
          console.error('Error checking existing data:', error);
          return;
        }

        if (data) {
          console.log('Found existing data:', data);
          setPostsData(data);
          
          if (areAllPostsReady(data)) {
            console.log('Existing data is complete, stopping loading');
            setIsGenerating(false);
          }
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
  }, [currentPostId, toast]);

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
    setPostsData(null);

    try {
      console.log('Creating LinkedIn post with user_profile.id:', userProfile.id);
      console.log('Clerk user ID:', user.id);

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
        description: "Your LinkedIn posts are being generated. Please wait..."
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

  // Reset form
  const resetForm = () => {
    setFormData({
      topic: '',
      opinion: '',
      personal_story: '',
      audience: '',
      tone: ''
    });
    setPostsData(null);
    setIsGenerating(false);
    setCurrentPostId(null);
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
                    LinkedIn <span className="italic">Posts</span>
                  </h1>
                  <p className="text-cyan-200 max-w-2xl mx-auto font-inter text-sm sm:text-base lg:text-lg font-light shadow-sm px-4">
                    Create engaging LinkedIn posts that showcase your expertise and connect with your professional network
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
                            <span>Create Your Posts</span>
                          </CardTitle>
                          <CardDescription className="text-black/80 font-inter mb-0 text-sm sm:text-base">
                            Fill in the details to generate 3 LinkedIn post variations
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
                            <Label htmlFor="topic" className="text-black font-semibold text-base">Topic or Theme *</Label>
                            <Label htmlFor="topic" className="text-black/70 font-normal text-sm block">What is the main topic you want to write about?</Label>
                            <TTextarea
                              id="topic"
                              placeholder="e.g. AI in customer service, Layoffs in tech, Remote work trends"
                              value={formData.topic}
                              onChange={e => handleInputChange('topic', e.target.value)}
                              required
                              className="min-h-[60px] resize-none text-base bg-black/80 border-teal-300/30 text-white placeholder:text-white/80 placeholder:text-xs font-medium" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="opinion" className="text-black font-semibold text-base">Your Key Point or Opinion</Label>
                            <Label htmlFor="opinion" className="text-black/70 font-normal text-sm block">What is your main insight, opinion, or message?</Label>
                            <TTextarea
                              id="opinion"
                              placeholder="I believe hybrid AI + human support is the future."
                              value={formData.opinion}
                              onChange={e => handleInputChange('opinion', e.target.value)}
                              className="min-h-[60px] resize-none text-base bg-black/80 border-teal-300/30 text-white placeholder:text-white/80 placeholder:text-xs font-medium" />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="personal_story" className="text-black font-semibold text-base">Personal Experience or Story</Label>
                            <Label htmlFor="personal_story" className="text-black/70 font-normal text-sm block">Do you have a story, data point, or personal experience to include?</Label>
                            <TTextarea
                              id="personal_story"
                              placeholder="We reduced response time by 40% after implementing AI chat."
                              value={formData.personal_story}
                              onChange={e => handleInputChange('personal_story', e.target.value)}
                              className="min-h-[60px] resize-none text-base bg-black/80 border-teal-300/30 text-white placeholder:text-white/80 placeholder:text-xs font-medium" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="audience" className="text-black font-semibold text-base">Target Audience</Label>
                            <Label htmlFor="audience" className="text-black/70 font-normal text-sm block">Who are you writing this for?</Label>
                            <TTextarea
                              id="audience"
                              placeholder="Startup founders, product managers, working moms, new grads…"
                              value={formData.audience}
                              onChange={e => handleInputChange('audience', e.target.value)}
                              className="min-h-[60px] resize-none text-base bg-black/80 border-teal-300/30 text-white placeholder:text-white/80 placeholder:text-xs font-medium" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="tone" className="text-black font-semibold text-base">Tone/Style Preference</Label>
                          <Label htmlFor="tone" className="text-black/70 font-normal text-sm block">What tone do you prefer?</Label>
                          <Select onValueChange={value => handleInputChange('tone', value)}>
                            <SelectTrigger className="text-base bg-black/80 text-white border-teal-300/30 font-medium [&>span[data-placeholder]]:text-white/80">
                              <SelectValue placeholder="Select a tone..." />
                            </SelectTrigger>
                            <SelectContent className="bg-black/80 border-teal-200/30 text-white">
                              {toneOptions.map(option => 
                                <SelectItem key={option.value} value={option.value} className="font-medium data-[highlighted]:bg-teal-200 data-[highlighted]:text-black">
                                  {option.label}
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                          <Button 
                            type="submit" 
                            disabled={isSubmitting || !formData.topic.trim() || isGenerating} 
                            className="flex-1 bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-500 hover:from-teal-500 hover:via-cyan-500 hover:to-teal-600 text-black font-semibold text-base h-12 shadow-md"
                          >
                            {isSubmitting ? 'Submitting...' : 'Generate LinkedIn Posts'}
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

                  {/* Loading State - Fixed to show proper loading message */}
                  {isGenerating && !postsData && (
                    <Card className="bg-gray-900 border-teal-400/20 backdrop-blur-sm mb-8">
                      <CardContent className="py-8 flex items-center justify-center">
                        <LoadingMessages type="linkedin" />
                      </CardContent>
                    </Card>
                  )}

                  {/* Results Display */}
                  {postsData && areAllPostsReady(postsData) && (
                    <Card className="bg-gray-900 border-teal-400/20 backdrop-blur-sm">
                      <CardHeader className="pb-6">
                        <CardTitle className="font-inter text-lg sm:text-xl flex items-center gap-2 bg-gradient-to-r from-teal-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent drop-shadow font-bold">
                          <Share2 className="w-5 h-5 text-teal-400 drop-shadow flex-shrink-0" />
                          <span>Your LinkedIn Post Variations</span>
                        </CardTitle>
                        <CardDescription className="text-cyan-300/90 font-inter text-sm sm:text-base">
                          Choose from 3 different LinkedIn post styles and copy your favorite!
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent>
                        <div className="space-y-8">
                          <LinkedInPostVariation
                            heading={postsData.post_heading_1!}
                            content={postsData.post_content_1!}
                            userProfile={userProfile}
                            userData={userData}
                            variationNumber={1}
                            postId={currentPostId || undefined}
                          />
                          
                          <LinkedInPostVariation
                            heading={postsData.post_heading_2!}
                            content={postsData.post_content_2!}
                            userProfile={userProfile}
                            userData={userData}
                            variationNumber={2}
                            postId={currentPostId || undefined}
                          />
                          
                          <LinkedInPostVariation
                            heading={postsData.post_heading_3!}
                            content={postsData.post_content_3!}
                            userProfile={userProfile}
                            userData={userData}
                            variationNumber={3}
                            postId={currentPostId || undefined}
                          />
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
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default LinkedInPosts;
