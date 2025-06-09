import { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileText, Copy, Send } from 'lucide-react';
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
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to use this feature.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.companyName || !formData.jobTitle || !formData.jobDescription) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields before submitting.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setResult('');

    try {
      const { data, error } = await supabase.functions.invoke('job-analysis-webhook', {
        body: {
          user_id: user.id,
          company_name: formData.companyName,
          job_title: formData.jobTitle,
          job_description: formData.jobDescription,
          webhook_type: 'cover_letter'
        }
      });

      if (error) throw error;

      console.log('Webhook response:', data);
      
      toast({
        title: "Generation started",
        description: "Your cover letter is being generated. Results will appear below shortly."
      });

      const pollForResults = async () => {
        let attempts = 0;
        const maxAttempts = 30;
        
        const poll = async () => {
          if (attempts >= maxAttempts) {
            setLoading(false);
            toast({
              title: "Timeout",
              description: "Generation is taking longer than expected. Please try again.",
              variant: "destructive"
            });
            return;
          }

          try {
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('id')
              .eq('clerk_id', user.id)
              .single();

            if (userError) throw userError;

            const { data: analyses, error: analysisError } = await supabase
              .from('job_analyses')
              .select('*')
              .eq('user_id', userData.id)
              .eq('company_name', formData.companyName)
              .eq('job_title', formData.jobTitle)
              .not('cover_letter', 'is', null)
              .order('created_at', { ascending: false })
              .limit(1);

            if (analysisError) throw analysisError;

            if (analyses && analyses.length > 0) {
              setResult(analyses[0].cover_letter);
              setLoading(false);
              toast({
                title: "Cover letter generated",
                description: "Your cover letter has been generated successfully!"
              });
            } else {
              attempts++;
              setTimeout(poll, 2000);
            }
          } catch (error) {
            console.error('Error polling for results:', error);
            attempts++;
            if (attempts < maxAttempts) {
              setTimeout(poll, 2000);
            } else {
              setLoading(false);
              toast({
                title: "Error",
                description: "Failed to retrieve cover letter. Please try again.",
                variant: "destructive"
              });
            }
          }
        };

        poll();
      };

      pollForResults();

    } catch (error) {
      console.error('Error submitting cover letter request:', error);
      setLoading(false);
      toast({
        title: "Error",
        description: "Failed to generate cover letter. Please try again.",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(result);
      toast({
        title: "Copied!",
        description: "Cover letter has been copied to clipboard."
      });
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast({
        title: "Copy failed",
        description: "Failed to copy cover letter. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-teal-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <FileText className="w-8 h-8 text-green-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent font-inter">
              Cover Letter Generator
            </h1>
          </div>
          <p className="text-xl text-gray-300 font-inter">
            Create personalized cover letters tailored to any job opportunity
          </p>
        </div>

        <Card className="bg-gradient-to-br from-green-900/50 to-teal-900/50 border-green-500/20 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-white font-inter">Generate Cover Letter</CardTitle>
            <CardDescription className="text-green-200 font-inter">
              Enter the job details to generate a personalized cover letter
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-white font-inter">Company Name</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    placeholder="e.g., Google, Microsoft, etc."
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 font-inter"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jobTitle" className="text-white font-inter">Job Title</Label>
                  <Input
                    id="jobTitle"
                    value={formData.jobTitle}
                    onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                    placeholder="e.g., Software Engineer, Product Manager, etc."
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 font-inter"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="jobDescription" className="text-white font-inter">Job Description</Label>
                <Textarea
                  id="jobDescription"
                  value={formData.jobDescription}
                  onChange={(e) => handleInputChange('jobDescription', e.target.value)}
                  placeholder="Paste the full job description here..."
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 font-inter min-h-[200px]"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-inter font-medium py-3 px-6 text-base"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Generate Cover Letter
                    </>
                  )}
                </Button>
                
                <div className="sm:w-auto">
                  <JobAnalysisHistory 
                    type="cover_letter" 
                    gradientColors="bg-gradient-to-br from-green-900/50 to-teal-900/50"
                    borderColors="border-green-500/20"
                  />
                </div>
              </div>
            </form>

            {result && (
              <div className="mt-6 p-6 bg-white rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 font-inter">Your Cover Letter:</h3>
                  <Button
                    onClick={copyToClipboard}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-inter"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                </div>
                <div className="text-gray-800 whitespace-pre-wrap leading-relaxed font-inter">
                  {result}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CoverLetter;
