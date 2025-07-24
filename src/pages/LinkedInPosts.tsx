import { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea as TTextarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Share2, History, Sparkles, Menu, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useUserCompletionStatus } from '@/hooks/useUserCompletionStatus';
import { useEnterpriseAuth } from '@/hooks/useEnterpriseAuth';
import { useLinkedInPostCreditCheck } from '@/hooks/useLinkedInPostCreditCheck';
import LinkedInPostsHistoryModal from '@/components/LinkedInPostsHistoryModal';
import LinkedInPostVariation from '@/components/LinkedInPostVariation';
import LoadingMessages from '@/components/LoadingMessages';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { useLinkedInPostTimeoutFallback } from '@/hooks/useLinkedInPostTimeoutFallback';
import { useFormTokenKeepAlive } from '@/hooks/useFormTokenKeepAlive';
import { useCachedLinkedInPosts } from '@/hooks/useCachedLinkedInPosts';
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
  const {
    user
  } = useUser();
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
  const {
    hasCredits
  } = useLinkedInPostCreditCheck();
  const [formData, setFormData] = useState({
    topic: '',
    opinion: '',
    personal_story: '',
    audience: '',
    tone: ''
  });
  const [validationErrors, setValidationErrors] = useState({
    topic: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postsData, setPostsData] = useState<LinkedInPostData | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPostId, setCurrentPostId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Use cached LinkedIn posts hook for instant data display
  const {
    data: linkedInHistory,
    isLoading: historyLoading,
    isShowingCachedData,
    connectionIssue,
    refetch: refetchHistory
  } = useCachedLinkedInPosts();

  // Initialize form token keep-alive - determine if form is active
  const isFormActive = !isGenerating && !isSubmitting && Boolean(formData.topic.trim() || formData.opinion.trim() || formData.personal_story.trim() || formData.audience.trim() || formData.tone);
  const {
    updateActivity,
    silentTokenRefresh
  } = useFormTokenKeepAlive(isFormActive);
  const toneOptions = [{
    value: 'professional',
    label: 'Professional & Insightful'
  }, {
    value: 'conversational',
    label: 'Conversational & Friendly'
  }, {
    value: 'bold',
    label: 'Bold & Opinionated'
  }, {
    value: 'thoughtful',
    label: 'Thoughtful & Reflective'
  }];
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id || !isAuthReady) return;
      try {
        await executeWithRetry(async () => {
          const {
            data,
            error
          } = await supabase.from('users').select('first_name, last_name').eq('clerk_id', user.id).single();
          if (error) {
            console.error('Error fetching user data:', error);
            return;
          }
          setUserData(data);
        }, 3, 'fetch user data');
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
    };
    fetchUserData();
  }, [user?.id, isAuthReady, executeWithRetry]);
  const areAllPostsReady = (data: LinkedInPostData) => {
    // Check if data exists first - CRITICAL FIX for display issue
    if (!data) {
      console.log('No data provided to areAllPostsReady');
      return false;
    }
    const hasAllHeadings = Boolean(data.post_heading_1 && data.post_heading_1.trim() && data.post_heading_2 && data.post_heading_2.trim() && data.post_heading_3 && data.post_heading_3.trim());
    const hasAllContent = Boolean(data.post_content_1 && data.post_content_1.trim() && data.post_content_2 && data.post_content_2.trim() && data.post_content_3 && data.post_content_3.trim());

    // Enhanced logging for debugging
    console.log('Checking if posts are ready:', {
      hasAllHeadings,
      hasAllContent,
      headings: {
        h1: data.post_heading_1?.substring(0, 50) + '...',
        h2: data.post_heading_2?.substring(0, 50) + '...',
        h3: data.post_heading_3?.substring(0, 50) + '...'
      },
      contentLengths: {
        c1: data.post_content_1?.length || 0,
        c2: data.post_content_2?.length || 0,
        c3: data.post_content_3?.length || 0
      }
    });

    // More explicit return logic
    const isReady = hasAllHeadings && hasAllContent;
    console.log('Posts ready result:', isReady);
    return isReady;
  };
  useLinkedInPostTimeoutFallback({
    currentPostId,
    userProfileId: userProfile?.user_id || null,
    isGenerating,
    creditsDeducted: false,
    // No longer tracking credits in frontend
    onCreditsDeducted: () => {},
    // No longer needed
    onPostsReady: data => {
      const linkedInPostData: LinkedInPostData = {
        post_heading_1: data.post_heading_1,
        post_content_1: data.post_content_1,
        post_heading_2: data.post_heading_2,
        post_content_2: data.post_content_2,
        post_heading_3: data.post_heading_3,
        post_content_3: data.post_content_3
      };
      setPostsData(linkedInPostData);
      setIsGenerating(false);
    }
  });
  useEffect(() => {
    if (!currentPostId || !isAuthReady || !userProfile?.id) return;
    
    let channel: any;
    const setupRealTime = async () => {
      try {
        await executeWithRetry(async () => {
          channel = supabase.channel(`linkedin-post-updates-${currentPostId}`).on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'job_linkedin',
            filter: `id=eq.${currentPostId}`
          }, async payload => {
            if (payload.new) {
              const newData = payload.new as any;
              const linkedInPostData: LinkedInPostData = {
                post_heading_1: newData.post_heading_1,
                post_content_1: newData.post_content_1,
                post_heading_2: newData.post_heading_2,
                post_content_2: newData.post_content_2,
                post_heading_3: newData.post_heading_3,
                post_content_3: newData.post_content_3
              };
              setPostsData(linkedInPostData);
              if (areAllPostsReady(linkedInPostData)) {
                setIsGenerating(false);
                toast({
                  title: "LinkedIn Posts Generated!",
                  description: "Your 3 LinkedIn post variations have been created successfully."
                });
              } else {
                console.log('⏳ Posts not complete yet, keeping loading state');
              }
            }
          }).subscribe(status => {
            console.log('📡 Real-time subscription status:', status);
          });
        }, 3, 'setup LinkedIn real-time subscription');
      } catch (error) {
        console.error('Error setting up real-time subscription:', error);
      }
    };
    setupRealTime();

    // Cleanup function
    return () => {
      if (channel) {
        console.log('🧹 Cleaning up real-time subscription');
        supabase.removeChannel(channel);
      }
    };
  }, [currentPostId, isAuthReady, userProfile?.id, executeWithRetry, toast]);
  useEffect(() => {
    const checkExistingData = async () => {
      if (!currentPostId || !isAuthReady) return;
      console.log('🔍 Checking existing data for post ID:', currentPostId);
      try {
        await executeWithRetry(async () => {
          const {
            data,
            error
          } = await supabase.from('job_linkedin').select('*').eq('id', currentPostId).single();
          if (error) {
            console.error('❌ Error fetching existing post data:', error);
            return;
          }
          if (data) {
            console.log('📋 Found existing post data:', {
              hasHeading1: Boolean(data.post_heading_1 && data.post_heading_1.trim()),
              hasContent1: Boolean(data.post_content_1 && data.post_content_1.trim()),
              hasHeading2: Boolean(data.post_heading_2 && data.post_heading_2.trim()),
              hasContent2: Boolean(data.post_content_2 && data.post_content_2.trim()),
              hasHeading3: Boolean(data.post_heading_3 && data.post_heading_3.trim()),
              hasContent3: Boolean(data.post_content_3 && data.post_content_3.trim())
            });
            const linkedInPostData: LinkedInPostData = {
              post_heading_1: data.post_heading_1,
              post_content_1: data.post_content_1,
              post_heading_2: data.post_heading_2,
              post_content_2: data.post_content_2,
              post_heading_3: data.post_heading_3,
              post_content_3: data.post_content_3
            };
            setPostsData(linkedInPostData);
            if (areAllPostsReady(linkedInPostData)) {
              setIsGenerating(false);
            }
          }
        }, 3, 'check existing post data');
      } catch (err) {
        console.error('❌ Error checking existing data:', err);
      }
    };
    if (currentPostId) {
      checkExistingData();
    }
  }, [currentPostId, isAuthReady, executeWithRetry]);
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Update activity timestamp to keep tokens fresh
    updateActivity();
  };
  const checkCreditsWithFallback = async (): Promise<boolean> => {
    if (hasCredits) {
      console.log('✅ Credit check passed via hook');
      return true;
    }
    console.log('⚠️ Hook credit check failed, trying direct database check...');
    try {
      if (!userProfile?.user_id) {
        console.error('❌ No user ID for direct credit check');
        return false;
      }
      const {
        data: credits,
        error
      } = await supabase.from('user_credits').select('current_balance').eq('user_id', userProfile.user_id).single();
      if (error) {
        console.error('❌ Direct credit check error:', error);
        return false;
      }
      const hasDirectCredits = credits && Number(credits.current_balance) >= 3.0;
      console.log('💳 Direct credit check result:', {
        balance: credits?.current_balance,
        hasCredits: hasDirectCredits
      });
      return hasDirectCredits;
    } catch (error) {
      console.error('❌ Exception in direct credit check:', error);
      return false;
    }
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
    if (completionLoading) {
      toast({
        title: "Checking Profile Status",
        description: "Please wait while we verify your profile completion."
      });
      return;
    }
    if (!isComplete) {
      toast({
        title: "Profile Incomplete",
        description: "Please complete your profile (upload resume and add bio) before creating LinkedIn posts. If you've just completed it, try clicking 'Refresh Status' below.",
        variant: "destructive",
        action: <button onClick={async () => {
          await refetchStatus();
          toast({
            title: "Profile Status Refreshed",
            description: "Your profile completion status has been updated."
          });
        }} className="bg-white text-black px-3 py-1 rounded text-sm hover:bg-gray-100">
            Refresh Status
          </button>
      });
      return;
    }
    if (!formData.topic.trim()) {
      setValidationErrors({
        topic: 'Please fill in this field.'
      });
      return;
    }

    // Clear validation errors if topic is filled
    setValidationErrors({
      topic: ''
    });
    const hasValidCredits = await checkCreditsWithFallback();
    if (!hasValidCredits) {
      toast({
        title: "Insufficient Credits",
        description: "You need 3 credits to generate LinkedIn posts. Please check your credit balance or purchase more credits.",
        variant: "destructive"
      });
      return;
    }
    setIsSubmitting(true);
    setIsGenerating(true);
    setPostsData(null);
    setCurrentPostId(null);

    // Proactively refresh token before submission to prevent JWT errors
    console.log('🔐 Refreshing token before form submission...');
    await silentTokenRefresh();
    try {
      console.log('🚀 Creating LinkedIn post with user_profile.id:', userProfile.id);
      await executeWithRetry(async () => {
        const {
          data,
          error
        } = await supabase.from('job_linkedin').insert({
          user_id: userProfile.id,
          topic: formData.topic,
          opinion: formData.opinion || null,
          personal_story: formData.personal_story || null,
          audience: formData.audience || null,
          tone: formData.tone || null
        }).select().single();
        if (error) {
          console.error('❌ Supabase error:', error);
          throw error;
        }
        console.log('✅ LinkedIn post created successfully:', data);
        setCurrentPostId(data.id);
        refetchHistory(); // Update cache with new entry
        toast({
          title: "Request Submitted!",
          description: "Your LinkedIn posts are being generated. Please wait..."
        });
      }, 3, 'create LinkedIn post');
    } catch (err: any) {
      console.error('❌ Error creating LinkedIn post:', err);
      setIsGenerating(false);
      toast({
        title: "Error",
        description: "Please refresh the page to continue",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
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
    setPostsData(null);
    setIsGenerating(false);
    setCurrentPostId(null);
  };
  const shouldShowResults = postsData && areAllPostsReady(postsData);
  const shouldShowLoading = isGenerating && !shouldShowResults;

  // Show professional authentication loading state within the page layout
  if (!isAuthReady && !isRefreshing) {
    return <SidebarProvider defaultOpen={true}>
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-2xl shadow-2xl border-b border-white/25">
        <div className="flex items-center justify-between p-3">
          <SidebarTrigger className="h-12 w-12 border-fuchsia-400/30 ring-2 ring-fuchsia-400/10 text-fuchsia-200 rounded-2xl shadow-lg transition-all flex items-center justify-center bg-zinc-900 hover:bg-zinc-800">
            <Menu className="w-7 h-7" strokeWidth={2.4} />
            <span className="sr-only">Toggle navigation menu</span>
          </SidebarTrigger>
          <div className="flex items-center gap-2">
            <img alt="Aspirely Logo" src="/lovable-uploads/3fabfd8d-c393-407c-a35b-e87b89bf88b6.jpg" className="max-h-8 drop-shadow-2xl object-fill" />
            <span className="font-orbitron drop-shadow bg-gradient-to-r from-sky-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-white font-bold min-w-0 truncate text-lg">Aspirely.ai</span>
          </div>
        </div>
      </header>
      <div className="min-h-screen flex w-full bg-black">
        <AppSidebar />
        <div className="flex-1 flex flex-col pt-28 lg:pt-0 lg:pl-6 min-w-0 overflow-x-hidden bg-black">
          <main className="flex-1 w-full min-w-0 bg-black">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400 mx-auto"></div>
                <div className="text-teal-200 text-sm font-medium">Preparing authentication...</div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>;
  }
  return <SidebarProvider defaultOpen={true}>
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-2xl shadow-2xl border-b border-white/25">
        <div className="flex items-center justify-between p-3">
          <SidebarTrigger className="h-12 w-12 border-fuchsia-400/30 ring-2 ring-fuchsia-400/10 text-fuchsia-200 rounded-2xl shadow-lg transition-all flex items-center justify-center bg-zinc-900 hover:bg-zinc-800">
            <Menu className="w-7 h-7" strokeWidth={2.4} />
            <span className="sr-only">Toggle navigation menu</span>
          </SidebarTrigger>
          <div className="flex items-center gap-2">
            <img alt="Aspirely Logo" src="/lovable-uploads/3fabfd8d-c393-407c-a35b-e87b89bf88b6.jpg" className="max-h-8 drop-shadow-2xl object-fill" />
            <span className="font-orbitron drop-shadow bg-gradient-to-r from-sky-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-white font-bold min-w-0 truncate text-lg">Aspirely.ai</span>
          </div>
        </div>
      </header>

      <div className="min-h-screen flex w-full bg-black">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col pt-20 lg:pt-0 lg:pl-6 min-w-0 overflow-x-hidden bg-black">
          <main className="flex-1 w-full min-w-0 bg-black">
            <div className="min-h-screen bg-black overflow-x-hidden">
              <div className="container mx-auto px-2 sm:px-4 py-4 mb-8 max-w-6xl w-full min-w-0">
                <div className="text-center mb-10">
                  <h1 className="sm:text-3xl font-orbitron bg-gradient-to-r from-teal-300 via-teal-400 to-cyan-400 bg-clip-text drop-shadow mb-4 tracking-tight font-bold lg:text-4xl text-teal-500 text-4xl">
                    ✍🏻 LinkedIn <span className="italic">Posts</span>
                  </h1>
                  <p className="max-w-2xl mx-auto font-inter text-sm sm:text-base font-light shadow-sm px-4 mb-3 text-slate-50 lg:text-base">
                    Create engaging LinkedIn posts that showcase your expertise and connect with your professional network
                  </p>
                  <div className="flex flex-col items-center gap-2">
                    <Badge variant="outline" className="bg-teal-900/30 border-teal-600/50 text-teal-300 font-semibold">
                      Usage Fee: 3 credits
                    </Badge>
                    <Badge variant="outline" className="bg-amber-900/30 border-amber-600/50 text-amber-300 font-semibold text-xs">
                      Images: 1.5 credits each
                    </Badge>
                  </div>
                </div>

                <Card className="bg-gradient-to-br from-cyan-400 via-teal-300 to-teal-500 border-white/10 backdrop-blur-md mb-8 shadow-xl max-w-full">
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
                      <div className="flex items-center gap-2">
                        {connectionIssue && <Button onClick={() => window.location.reload()} variant="outline" size="sm" className="border-orange-400/30 bg-orange-100/10 text-orange-600 hover:bg-orange-200/20" title="Connection issue detected. Click to refresh the page.">
                            <RefreshCw className="w-4 h-4" />
                          </Button>}
                        <Button onClick={() => setShowHistory(true)} variant="outline" size="sm" className="border-white/20 flex-shrink-0 bg-zinc-100 text-zinc-950">
                          <History className="w-4 h-4 mr-2 text-black" />
                          History
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6 sm:space-y-8">
                    <form onSubmit={handleSubmit} className="space-y-6 max-w-full">
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                        <div className="space-y-2 min-w-0">
                          <Label htmlFor="topic" className="text-black font-semibold text-base">💡Topic or Theme *</Label>
                          <Label htmlFor="topic" className="text-black/70 font-normal text-sm block">What is the main topic you want to write about?</Label>
                          <TTextarea id="topic" placeholder="e.g. AI in customer service, Layoffs in tech, Remote work trends" value={formData.topic} onChange={e => handleInputChange('topic', e.target.value)} required className="min-h-[60px] resize-none text-base border-teal-300/30 text-white placeholder:text-white/40 placeholder:text-xs font-medium bg-gray-950 w-full" />
                        </div>
                        <div className="space-y-2 min-w-0">
                          <Label htmlFor="opinion" className="text-black font-semibold text-base">🤔Your Key Point or Opinion</Label>
                          <Label htmlFor="opinion" className="text-black/70 font-normal text-sm block">What is your main insight, opinion, or message?</Label>
                          <TTextarea id="opinion" placeholder="I believe hybrid AI + human support is the future." value={formData.opinion} onChange={e => handleInputChange('opinion', e.target.value)} className="min-h-[60px] resize-none text-base border-teal-300/30 text-white placeholder:text-white/40 placeholder:text-xs font-medium bg-gray-950 w-full" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                        <div className="space-y-2 min-w-0">
                          <Label htmlFor="personal_story" className="text-black font-semibold text-base">📖Personal Experience or Story</Label>
                          <Label htmlFor="personal_story" className="text-black/70 font-normal text-sm block">Do you have a story/personal experience to include?</Label>
                          <TTextarea id="personal_story" placeholder="We reduced response time by 40% after implementing AI chat." value={formData.personal_story} onChange={e => handleInputChange('personal_story', e.target.value)} className="min-h-[60px] resize-none text-base border-teal-300/30 text-white placeholder:text-white/40 placeholder:text-xs font-medium bg-gray-950 w-full" />
                        </div>
                        <div className="space-y-2 min-w-0">
                          <Label htmlFor="audience" className="text-black font-semibold text-base">👥Target Audience</Label>
                          <Label htmlFor="audience" className="text-black/70 font-normal text-sm block">Who are you writing this for?</Label>
                          <TTextarea id="audience" placeholder="Startup founders, product managers, working moms, new grads…" value={formData.audience} onChange={e => handleInputChange('audience', e.target.value)} className="min-h-[60px] resize-none text-base border-teal-300/30 text-white placeholder:text-white/40 placeholder:text-xs font-medium bg-gray-950 w-full" />
                        </div>
                      </div>

                      <div className="space-y-2 max-w-full">
                        <Label htmlFor="tone" className="text-black font-semibold text-base">🗣️Tone/Style Preference</Label>
                        <Label htmlFor="tone" className="text-black/70 font-normal text-sm block">What tone do you prefer?</Label>
                        <Select onValueChange={value => handleInputChange('tone', value)}>
                          <SelectTrigger className="text-base bg-black/80 text-white border-teal-300/30 font-medium [&>span[data-placeholder]]:text-white/80 w-full">
                            <SelectValue placeholder="Select a tone..." />
                          </SelectTrigger>
                          <SelectContent className="bg-black/80 border-teal-200/30 text-white">
                            {toneOptions.map(option => <SelectItem key={option.value} value={option.value} className="font-medium data-[highlighted]:bg-teal-200 data-[highlighted]:text-black">
                                {option.label}
                              </SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 pt-4 max-w-full">
                        <Button type="submit" disabled={isSubmitting || !formData.topic.trim() || isGenerating || completionLoading} className="flex-1 bg-gradient-to-r from-white via-white to-white hover:from-white/90 hover:via-white/90 hover:to-white/90 text-black font-orbitron font-bold text-base h-12 shadow-2xl shadow-gray-300/50 border-0 disabled:opacity-50 disabled:cursor-not-allowed min-w-0">
                          {isSubmitting ? 'Submitting...' : completionLoading ? 'Checking Profile...' : 'Generate LinkedIn Posts'}
                        </Button>
                        
                        <Button type="button" onClick={resetForm} variant="outline" className="border-teal-400/25 text-base h-12 px-6 flex-shrink-0 text-zinc-50 bg-blue-800 hover:bg-blue-700">
                          Reset
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                {shouldShowLoading && <Card className="bg-gray-900 border-teal-400/20 backdrop-blur-sm mb-8 max-w-full">
                    <CardContent className="py-8 flex items-center justify-center">
                      <LoadingMessages type="linkedin" />
                    </CardContent>
                  </Card>}

                {shouldShowResults && <Card className="bg-gray-900 border-teal-400/20 backdrop-blur-sm max-w-full">
                    <CardHeader className="pb-6">
                      <CardTitle className="font-inter text-lg sm:text-xl flex items-center gap-2 bg-gradient-to-r from-teal-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent drop-shadow font-bold">
                        <Share2 className="w-5 h-5 text-teal-400 drop-shadow flex-shrink-0" />
                        <span>Your LinkedIn Post Variations</span>
                      </CardTitle>
                      <CardDescription className="text-cyan-300/90 font-inter text-sm sm:text-base">
                        Choose from 3 different LinkedIn post styles and copy your favorite!
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="max-w-full">
                      <div className="space-y-12 max-w-full">
                        <LinkedInPostVariation heading={postsData.post_heading_1!} content={postsData.post_content_1!} userProfile={userProfile} userData={userData} variationNumber={1} postId={currentPostId || undefined} />
                        
                        <LinkedInPostVariation heading={postsData.post_heading_2!} content={postsData.post_content_2!} userProfile={userProfile} userData={userData} variationNumber={2} postId={currentPostId || undefined} />
                        
                        <LinkedInPostVariation heading={postsData.post_heading_3!} content={postsData.post_content_3!} userProfile={userProfile} userData={userData} variationNumber={3} postId={currentPostId || undefined} />
                      </div>
                    </CardContent>
                  </Card>}
              </div>

              <LinkedInPostsHistoryModal isOpen={showHistory} onClose={() => setShowHistory(false)} gradientColors="from-cyan-400 to-teal-400" />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>;
};
export default LinkedInPosts;