
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Layout } from '@/components/Layout';
import LinkedInPostHistoryModal from '@/components/LinkedInPostHistoryModal';
import LoadingMessages from '@/components/LoadingMessages';
import { Copy, FileText, Sparkles } from 'lucide-react';
import LinkedInPostDownloadActions from '@/components/LinkedInPostDownloadActions';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ProfileCompletionWarning } from '@/components/ProfileCompletionWarning';
import { useCreditCheck } from '@/hooks/useCreditCheck';
import { useDeferredCreditDeduction } from '@/hooks/useDeferredCreditDeduction';

interface LinkedInPostsData {
  id: string;
  user_id: string;
  post_heading_1: string | null;
  post_content_1: string | null;
  post_heading_2: string | null;
  post_content_2: string | null;
  post_heading_3: string | null;
  post_content_3: string | null;
  created_at: string;
  updated_at: string;
}

const LinkedInPosts = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userProfile } = useUserProfile();

  const [topic, setTopic] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [linkedInPosts, setLinkedInPosts] = useState<LinkedInPostsData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPostId, setCurrentPostId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const { hasCredits, showInsufficientCreditsPopup } = useCreditCheck(3.0, true);
  const { deductCredits } = useDeferredCreditDeduction();
  const [creditsDeducted, setCreditsDeducted] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      navigate('/');
    }
  }, [user, navigate]);

  // Helper function to check if all posts are ready
  const areAllPostsReady = (post: any): boolean => {
    return !!(
      post?.post_heading_1 && post?.post_content_1 &&
      post?.post_heading_2 && post?.post_content_2 &&
      post?.post_heading_3 && post?.post_content_3
    );
  };

  // Real-time subscription for LinkedIn post updates with credit deduction
  useEffect(() => {
    if (!currentPostId) return;

    console.log('Setting up real-time subscription for LinkedIn post ID:', currentPostId);
    
    const channel = supabase
      .channel(`linkedin-post-${currentPostId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'job_linkedin',
        filter: `id=eq.${currentPostId}`
      }, (payload) => {
        console.log('Real-time update received:', payload);
        
        if (payload.new && areAllPostsReady(payload.new)) {
          console.log('All posts ready, updating UI');
          setLinkedInPosts(payload.new as LinkedInPostsData);
          setIsGenerating(false);
          
          // Deduct credits only after successful result display
          if (!creditsDeducted) {
            deductCredits(3.0, 'linkedin_post', 'Credits deducted for LinkedIn post generation');
            setCreditsDeducted(true);
          }
          
          toast({
            title: "LinkedIn Posts Generated!",
            description: "Your LinkedIn posts have been created successfully."
          });
        }
      })
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [currentPostId, toast, creditsDeducted, deductCredits]);

  // Polling fallback for LinkedIn posts
  useEffect(() => {
    if (!isGenerating || !currentPostId) return;

    const pollInterval = setInterval(async () => {
      console.log('Polling for LinkedIn post updates...');
      
      try {
        const { data, error } = await supabase
          .from('job_linkedin')
          .select('*')
          .eq('id', currentPostId)
          .single();

        if (error) {
          console.error('Error polling for updates:', error);
          return;
        }

        if (data && areAllPostsReady(data)) {
          console.log('LinkedIn posts found via polling, updating UI');
          setLinkedInPosts(data as LinkedInPostsData);
          setIsGenerating(false);
          
          // Deduct credits only after successful result display
          if (!creditsDeducted) {
            deductCredits(3.0, 'linkedin_post', 'Credits deducted for LinkedIn post generation');
            setCreditsDeducted(true);
          }
          
          toast({
            title: "LinkedIn Posts Generated!",
            description: "Your LinkedIn posts have been created successfully."
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
  }, [isGenerating, currentPostId, toast, creditsDeducted, deductCredits]);

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
        description: "Please sign in to generate LinkedIn posts.",
        variant: "destructive"
      });
      return;
    }

    if (!topic.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a topic for the LinkedIn posts.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    setIsGenerating(true);
    setLinkedInPosts(null);
    setCurrentPostId(null);
    setCreditsDeducted(false); // Reset credit deduction flag

    try {
      console.log('Submitting LinkedIn post request...');

      // Insert into database
      const { data, error } = await supabase
        .from('job_linkedin')
        .insert({
          user_id: userProfile.id,
          topic: topic,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }
      
      console.log('LinkedIn post record created with ID:', data.id);
      setCurrentPostId(data.id);
      
      toast({
        title: "Posts Generation Started!",
        description: "Your LinkedIn posts are being generated. Please wait..."
      });
    } catch (err: any) {
      console.error('Error creating LinkedIn posts:', err);
      setIsGenerating(false);
      setCurrentPostId(null);
      toast({
        title: "Error",
        description: "Failed to create LinkedIn posts. Please try again.",
        variant: "destructive"
      });
      setCreditsDeducted(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyPost = async (postContent: string | null) => {
    if (!postContent) return;
    try {
      await navigator.clipboard.writeText(postContent);
      toast({
        title: "Copied!",
        description: "Post copied to clipboard successfully."
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
    setTopic('');
    setLinkedInPosts(null);
    setIsGenerating(false);
    setCurrentPostId(null);
    setCreditsDeducted(false);
  };

  const renderPost = (heading: string | null, content: string | null, index: number) => {
    if (!heading || !content) return null;

    return (
      <Card key={index} className="bg-gradient-to-br from-gray-800/70 via-gray-900/70 to-black/70 text-white shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">{heading}</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px] w-full pr-4">
            <div className="whitespace-pre-wrap font-inter text-white text-base">
              {content}
            </div>
          </ScrollArea>
          <Button onClick={() => handleCopyPost(content)} className="w-full mt-4">
            <Copy className="w-4 h-4 mr-2" />
            Copy Post
          </Button>
        </CardContent>
      </Card>
    );
  };

  if (!user) {
    return <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-fuchsia-900 text-xs">Loading...</div>
    </div>;
  }

  return (
    <Layout>
      <div className="min-h-screen bg-zinc-950 text-white">
        <div className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent mb-2 drop-shadow font-orbitron animate-fade-in">
              <Sparkles className="inline-block w-6 h-6 mr-2" />
              LinkedIn Post Generator
            </h1>
            <p className="text-lg font-inter font-light text-white/90">
              Generate engaging LinkedIn posts to boost your professional presence
            </p>
          </div>

          {/* Profile Completion Warning */}
          <ProfileCompletionWarning />

          {/* Input Form */}
          <Card className="mb-8 bg-gradient-to-br from-gray-800/70 via-gray-900/70 to-black/70 text-white shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-fuchsia-300" />
                  Generate Your Posts
                </CardTitle>
                <LinkedInPostHistoryModal isOpen={showHistory} onClose={() => setShowHistory(false)} />
              </div>
              <CardDescription className="text-gray-400">
                Enter a topic to generate three unique LinkedIn posts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="topic" className="text-white font-medium">
                    Topic *
                  </Label>
                  <Input
                    id="topic"
                    placeholder="e.g., Remote work trends, AI in marketing"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    required
                    className="bg-black text-white placeholder:text-gray-500 border-gray-700"
                    disabled={isGenerating}
                  />
                </div>
                <Button type="submit" disabled={isSubmitting || isGenerating || !topic.trim()} className="w-full bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white">
                  {isSubmitting ? "Submitting..." : isGenerating ? "Generating..." : "Generate Posts"}
                </Button>
                <Button type="button" onClick={resetForm} variant="outline" className="w-full border-gray-700 text-white" disabled={isGenerating}>
                  Reset
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Loading State */}
          {isGenerating && !linkedInPosts && (
            <Card className="bg-gradient-to-br from-gray-800/70 via-gray-900/70 to-black/70 text-white shadow-md">
              <CardContent className="py-8">
                <LoadingMessages type="linkedin_post" />
              </CardContent>
            </Card>
          )}

          {/* Result Display */}
          {linkedInPosts && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Generated LinkedIn Posts</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {renderPost(linkedInPosts.post_heading_1, linkedInPosts.post_content_1, 1)}
                {renderPost(linkedInPosts.post_heading_2, linkedInPosts.post_content_2, 2)}
                {renderPost(linkedInPosts.post_heading_3, linkedInPosts.post_content_3, 3)}
              </div>
              <LinkedInPostDownloadActions linkedInPosts={linkedInPosts} topic={topic} />
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default LinkedInPosts;
