
import { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileText, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import JobAnalysisHistory from '@/components/JobAnalysisHistory';

const CoverLetter = () => {
  const { user } = useUser();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    companyName: '',
    jobTitle: '',
    jobDescription: ''
  });
  const [coverLetter, setCoverLetter] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(coverLetter);
      toast({
        title: "Copied!",
        description: "Cover letter has been copied to clipboard."
      });
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast({
        title: "Copy failed",
        description: "Failed to copy content. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to generate a cover letter.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.companyName || !formData.jobTitle || !formData.jobDescription) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields to generate a cover letter.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setCoverLetter('');

    try {
      // First, get or create user in our database
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', user.id)
        .single();

      let userId = userData?.id;

      if (userError && userError.code === 'PGRST116') {
        // User doesn't exist, create them
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            clerk_id: user.id,
            email: user.emailAddresses[0]?.emailAddress || '',
            first_name: user.firstName || '',
            last_name: user.lastName || ''
          })
          .select('id')
          .single();

        if (createError) throw createError;
        userId = newUser.id;
      } else if (userError) {
        throw userError;
      }

      // Create job analysis record
      const { data: jobAnalysis, error: analysisError } = await supabase
        .from('job_analyses')
        .insert({
          user_id: userId,
          company_name: formData.companyName,
          job_title: formData.jobTitle,
          job_description: formData.jobDescription
        })
        .select('id')
        .single();

      if (analysisError) throw analysisError;

      // Call the edge function to generate cover letter
      const { data, error } = await supabase.functions.invoke('job-analysis-webhook', {
        body: {
          record: {
            id: jobAnalysis.id,
            user_id: userId,
            company_name: formData.companyName,
            job_title: formData.jobTitle,
            job_description: formData.jobDescription
          },
          type: 'INSERT'
        }
      });

      if (error) throw error;

      // Poll for the result
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds timeout
      
      const pollForResult = async () => {
        const { data: result, error: fetchError } = await supabase
          .from('job_analyses')
          .select('cover_letter')
          .eq('id', jobAnalysis.id)
          .single();

        if (fetchError) throw fetchError;

        if (result.cover_letter) {
          setCoverLetter(result.cover_letter);
          setLoading(false);
          toast({
            title: "Cover letter generated!",
            description: "Your personalized cover letter is ready."
          });
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(pollForResult, 1000);
        } else {
          throw new Error('Timeout: Cover letter generation took too long');
        }
      };

      setTimeout(pollForResult, 2000); // Start polling after 2 seconds

    } catch (error) {
      console.error('Error generating cover letter:', error);
      setLoading(false);
      toast({
        title: "Error",
        description: "Failed to generate cover letter. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-white font-inter">Cover Letter Generator</h1>
          <p className="text-xl text-gray-200 font-inter">Create personalized cover letters that stand out</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="bg-gradient-to-br from-purple-800/40 to-blue-800/40 border-2 border-purple-300/30 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-white font-inter flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Job Information
              </CardTitle>
              <CardDescription className="text-gray-300 font-inter">
                Provide details about the job you're applying for
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-white font-inter">Company Name</Label>
                  <Input
                    id="companyName"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    placeholder="e.g., Google, Microsoft, Startup Inc."
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 font-inter"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jobTitle" className="text-white font-inter">Job Title</Label>
                  <Input
                    id="jobTitle"
                    name="jobTitle"
                    value={formData.jobTitle}
                    onChange={handleInputChange}
                    placeholder="e.g., Software Engineer, Marketing Manager"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 font-inter"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jobDescription" className="text-white font-inter">Job Description</Label>
                  <Textarea
                    id="jobDescription"
                    name="jobDescription"
                    value={formData.jobDescription}
                    onChange={handleInputChange}
                    placeholder="Paste the complete job description here..."
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 font-inter min-h-[200px] resize-none"
                    disabled={loading}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading || !formData.companyName || !formData.jobTitle || !formData.jobDescription}
                  className="w-full font-inter font-medium py-3 px-4 text-sm bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating Cover Letter...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Generate Cover Letter
                    </>
                  )}
                </Button>

                <JobAnalysisHistory 
                  type="cover_letter"
                  gradientColors="bg-gradient-to-br from-purple-800/40 to-blue-800/40"
                  borderColors="border-2 border-purple-300/30"
                />
              </form>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-800/40 to-emerald-800/40 border-2 border-green-300/30 shadow-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white font-inter flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Your Cover Letter
                  </CardTitle>
                  <CardDescription className="text-gray-300 font-inter">
                    AI-generated personalized cover letter
                  </CardDescription>
                </div>
                {coverLetter && (
                  <Button
                    size="sm"
                    onClick={copyToClipboard}
                    className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-2"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin text-white mx-auto" />
                    <p className="text-white font-inter">Generating your personalized cover letter...</p>
                    <p className="text-gray-300 font-inter text-sm">This may take up to 30 seconds</p>
                  </div>
                </div>
              ) : coverLetter ? (
                <div className="bg-white rounded-lg p-6 space-y-4">
                  <div className="prose prose-sm max-w-none">
                    <div className="text-gray-800 whitespace-pre-wrap leading-relaxed font-inter text-sm">
                      {coverLetter}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-300 text-center py-12 font-inter">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Your cover letter will appear here</p>
                  <p className="text-sm opacity-75 mt-2">Fill in the job details and click generate</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CoverLetter;
