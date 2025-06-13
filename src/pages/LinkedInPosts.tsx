import { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
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
    isComplete
  } = useUserCompletionStatus();
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
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
    try {
      // Insert into database
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
      if (error) throw error;

      // For now, we'll just show a placeholder result
      // In a real implementation, this would trigger the AI generation
      const mockResult = `🚀 ${formData.topic}

${formData.opinion ? formData.opinion + '\n\n' : ''}${formData.personal_story ? '📊 ' + formData.personal_story + '\n\n' : ''}What are your thoughts? Drop a comment below! 👇

#LinkedIn #${formData.topic.replace(/\s+/g, '')} #Professional`;
      setResult(mockResult);
      toast({
        title: "LinkedIn Post Created!",
        description: "Your LinkedIn post has been generated successfully."
      });
    } catch (err) {
      console.error('Error creating LinkedIn post:', err);
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
  };
  return <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-900">
        <div className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="text-center mb-12">
            
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-200 via-gray-300 to-zinc-400 bg-clip-text text-transparent mb-4 font-inter">
              LinkedIn Posts
            </h1>
            <p className="text-gray-300 max-w-2xl mx-auto font-inter text-sm font-light">
              Create engaging LinkedIn posts that showcase your expertise and connect with your professional network
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Input Form */}
              <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-white/20 backdrop-blur-sm">
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
                    <Button onClick={() => setShowHistory(true)} variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
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
                      <Textarea id="topic" placeholder="e.g. AI in customer service, Layoffs in tech, Remote work trends" value={formData.topic} onChange={e => handleInputChange('topic', e.target.value)} className="min-h-[60px] resize-none text-base" required />
                    </div>

                    {/* Opinion */}
                    <div className="space-y-3">
                      <Label htmlFor="opinion" className="text-white font-medium text-base">
                        Your Key Point or Opinion
                      </Label>
                      <Label htmlFor="opinion" className="text-gray-300 font-normal text-sm block">
                        What is your main insight, opinion, or message?
                      </Label>
                      <Textarea id="opinion" placeholder="I believe hybrid AI + human support is the future." value={formData.opinion} onChange={e => handleInputChange('opinion', e.target.value)} className="min-h-[80px] resize-none text-base" />
                    </div>

                    {/* Personal Story */}
                    <div className="space-y-3">
                      <Label htmlFor="personal_story" className="text-white font-medium text-base">
                        Personal Experience or Story
                      </Label>
                      <Label htmlFor="personal_story" className="text-gray-300 font-normal text-sm block">
                        Do you have a story, data point, or personal experience to include?
                      </Label>
                      <Textarea id="personal_story" placeholder="We reduced response time by 40% after implementing AI chat." value={formData.personal_story} onChange={e => handleInputChange('personal_story', e.target.value)} className="min-h-[80px] resize-none text-base" />
                    </div>

                    {/* Audience */}
                    <div className="space-y-3">
                      <Label htmlFor="audience" className="text-white font-medium text-base">
                        Target Audience
                      </Label>
                      <Label htmlFor="audience" className="text-gray-300 font-normal text-sm block">
                        Who are you writing this for?
                      </Label>
                      <Textarea id="audience" placeholder="Startup founders, product managers, working moms, new grads…" value={formData.audience} onChange={e => handleInputChange('audience', e.target.value)} className="min-h-[60px] resize-none text-base" />
                    </div>

                    {/* Tone */}
                    <div className="space-y-3">
                      <Label htmlFor="tone" className="text-white font-medium text-base">
                        Tone/Style Preference
                      </Label>
                      <Label htmlFor="tone" className="text-gray-300 font-normal text-sm block">
                        What tone do you prefer?
                      </Label>
                      <Select onValueChange={value => handleInputChange('tone', value)}>
                        <SelectTrigger className="text-base">
                          <SelectValue placeholder="Select a tone..." />
                        </SelectTrigger>
                        <SelectContent>
                          {toneOptions.map(option => <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button type="submit" disabled={isSubmitting || !formData.topic.trim()} className="flex-1 bg-gradient-to-r from-slate-500 to-gray-600 hover:from-slate-600 hover:to-gray-700 text-white font-medium text-base h-12">
                        {isSubmitting ? 'Creating Post...' : 'Generate LinkedIn Post'}
                      </Button>
                      
                      <Button type="button" onClick={resetForm} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-base h-12 px-6">
                        Reset
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Result Display - Only show when there's a result */}
              {result && <Card className="bg-white/5 border-white/20 backdrop-blur-sm">
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
                      <div className="bg-white rounded-lg p-6 border-2 border-slate-200">
                        <div className="text-gray-800 text-base leading-relaxed whitespace-pre-wrap font-serif">
                          {result}
                        </div>
                      </div>
                      
                      <Button onClick={handleCopyResult} className="w-full bg-slate-700 hover:bg-slate-600 text-white flex items-center gap-2 text-base h-12">
                        <Copy className="w-4 h-4" />
                        Copy LinkedIn Post
                      </Button>
                    </div>
                  </CardContent>
                </Card>}
            </div>
          </div>
        </div>

        {/* History Modal */}
        <HistoryModal type="linkedin_posts" isOpen={showHistory} onClose={() => setShowHistory(false)} gradientColors="from-slate-400 to-gray-500" />
      </div>
    </Layout>;
};
export default LinkedInPosts;