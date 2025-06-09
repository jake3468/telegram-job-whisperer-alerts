import { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Target, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import JobAnalysisHistory from '@/components/JobAnalysisHistory';

const JobGuide = () => {
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
          webhook_type: 'job_guide'
        }
      });

      if (error) throw error;

      console.log('Webhook response:', data);
      
      toast({
        title: "Analysis started",
        description: "Your job analysis is being processed. Results will appear below shortly."
      });

      const pollForResults = async () => {
        let attempts = 0;
        const maxAttempts = 30;
        
        const poll = async () => {
          if (attempts >= maxAttempts) {
            setLoading(false);
            toast({
              title: "Timeout",
              description: "Analysis is taking longer than expected. Please try again.",
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
              .not('job_match', 'is', null)
              .order('created_at', { ascending: false })
              .limit(1);

            if (analysisError) throw analysisError;

            if (analyses && analyses.length > 0) {
              setResult(analyses[0].job_match);
              setLoading(false);
              toast({
                title: "Analysis complete",
                description: "Your job guide has been generated successfully!"
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
                description: "Failed to retrieve analysis results. Please try again.",
                variant: "destructive"
              });
            }
          }
        };

        poll();
      };

      pollForResults();

    } catch (error) {
      console.error('Error submitting job analysis:', error);
      setLoading(false);
      toast({
        title: "Error",
        description: "Failed to submit job analysis. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Target className="w-8 h-8 text-blue-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent font-inter">
              Job Guide
            </h1>
          </div>
          <p className="text-xl text-gray-300 font-inter">
            Get personalized insights and match analysis for any job opportunity
          </p>
        </div>

        <Card className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 border-blue-500/20 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-white font-inter">Job Analysis</CardTitle>
            <CardDescription className="text-blue-200 font-inter">
              Enter the job details to get your personalized job guide
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
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-inter font-medium py-3 px-6 text-base"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Get Job Guide
                    </>
                  )}
                </Button>
                
                <div className="sm:w-auto">
                  <JobAnalysisHistory 
                    type="job_guide" 
                    gradientColors="bg-gradient-to-br from-blue-900/50 to-purple-900/50"
                    borderColors="border-blue-500/20"
                  />
                </div>
              </div>
            </form>

            {result && (
              <div className="mt-6 p-6 bg-white rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 font-inter">Your Job Guide:</h3>
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

export default JobGuide;
