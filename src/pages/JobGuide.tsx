
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, Send, CheckCircle, Loader2, Target } from 'lucide-react';

const JobGuide = () => {
  const { user } = useUser();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [jobMatchResult, setJobMatchResult] = useState<string>('');
  const [currentRecordId, setCurrentRecordId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    companyName: '',
    jobTitle: '',
    jobDescription: ''
  });

  // Add session tracking to prevent duplicate submissions
  const [sessionSubmissions, setSessionSubmissions] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Load any existing job match result on page load
    if (user && currentRecordId) {
      checkForJobMatchResult();
    }
  }, [user, currentRecordId]);

  const generateSessionKey = (formData: any) => {
    const normalized = {
      company: formData.companyName.trim().toLowerCase(),
      title: formData.jobTitle.trim().toLowerCase(),
      description: formData.jobDescription.trim().substring(0, 100).toLowerCase()
    };
    return `${normalized.company}-${normalized.title}-${normalized.description}`;
  };

  const checkForJobMatchResult = async () => {
    if (!currentRecordId) return;

    try {
      const { data, error } = await supabase
        .from('job_analyses')
        .select('job_match')
        .eq('id', currentRecordId)
        .single();

      if (error) {
        console.error('Error checking job match result:', error);
        return;
      }

      if (data?.job_match) {
        setJobMatchResult(data.job_match);
        setLoading(false);
        console.log('Job match result found:', data.job_match.substring(0, 100) + '...');
      }
    } catch (error) {
      console.error('Error checking job match result:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to analyze the job.",
        variant: "destructive",
      });
      return;
    }

    // Validate required fields
    if (!formData.companyName.trim() || !formData.jobTitle.trim() || !formData.jobDescription.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Check for recent session submission
    const sessionKey = generateSessionKey(formData);
    if (sessionSubmissions.has(sessionKey)) {
      toast({
        title: "Duplicate submission",
        description: "You've recently submitted this job analysis request. Please wait before submitting again.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setJobMatchResult('');
    setCurrentRecordId(null);

    try {
      console.log('Starting job analysis for:', formData.companyName, formData.jobTitle);

      // First, get the user's database ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', user.id)
        .single();

      if (userError) {
        console.error('Error fetching user:', userError);
        throw new Error('Failed to fetch user data');
      }

      // Insert into job_analyses table (this will trigger the webhook)
      const { data: insertData, error: insertError } = await supabase
        .from('job_analyses')
        .insert({
          user_id: userData.id,
          company_name: formData.companyName.trim(),
          job_title: formData.jobTitle.trim(),
          job_description: formData.jobDescription.trim()
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting job analysis record:', insertError);
        throw new Error('Failed to create job analysis record');
      }

      console.log('Job analysis record inserted successfully:', insertData.id);
      setCurrentRecordId(insertData.id);

      // Track this submission in session
      setSessionSubmissions(prev => new Set([...prev, sessionKey]));

      // Start polling for the result
      startPollingForJobMatchResult(insertData.id);

      toast({
        title: "Job analysis request submitted",
        description: "Your job analysis is being processed. This may take a few moments.",
      });

    } catch (error) {
      console.error('Error submitting job analysis request:', error);
      setLoading(false);
      toast({
        title: "Submission failed",
        description: error instanceof Error ? error.message : "There was an error submitting your request.",
        variant: "destructive",
      });
    }
  };

  const startPollingForJobMatchResult = (recordId: string) => {
    console.log('Starting polling for job match result:', recordId);
    
    const pollInterval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('job_analyses')
          .select('job_match')
          .eq('id', recordId)
          .single();

        if (error) {
          console.error('Error polling for job match result:', error);
          return;
        }

        if (data?.job_match) {
          console.log('Job match result received:', data.job_match.substring(0, 100) + '...');
          setJobMatchResult(data.job_match);
          setLoading(false);
          clearInterval(pollInterval);
          
          toast({
            title: "Job analysis complete",
            description: "Your job analysis results are ready!",
          });
        }
      } catch (error) {
        console.error('Error polling for job match result:', error);
      }
    }, 3000); // Poll every 3 seconds

    // Stop polling after 5 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      if (loading) {
        setLoading(false);
        toast({
          title: "Analysis timeout",
          description: "Job analysis is taking longer than expected. Please try again.",
          variant: "destructive",
        });
      }
    }, 300000); // 5 minutes
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Job Guide</h1>
        <p className="text-lg text-gray-600">
          Get an AI-powered analysis of how well you match with a specific job opportunity
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Job Analysis
            </CardTitle>
            <CardDescription>
              Provide the job details to get your personalized match analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  placeholder="Enter the company name"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title *</Label>
                <Input
                  id="jobTitle"
                  value={formData.jobTitle}
                  onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                  placeholder="Enter the job title"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobDescription">Job Description *</Label>
                <Textarea
                  id="jobDescription"
                  value={formData.jobDescription}
                  onChange={(e) => handleInputChange('jobDescription', e.target.value)}
                  placeholder="Paste the complete job description here..."
                  className="min-h-[200px] resize-none"
                  required
                  disabled={loading}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing Job...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Analyze Job Match
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {jobMatchResult ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <Target className="w-5 h-5" />
              )}
              Job Match Analysis
            </CardTitle>
            <CardDescription>
              {loading 
                ? "Your job analysis is being processed..." 
                : jobMatchResult 
                  ? "Your personalized job match analysis is ready"
                  : "Your AI-powered job analysis will appear here"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                  <p className="text-gray-600">Analyzing your job match...</p>
                  <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
                </div>
              </div>
            ) : jobMatchResult ? (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                    {jobMatchResult}
                  </div>
                </div>
                <Button 
                  onClick={() => navigator.clipboard.writeText(jobMatchResult)}
                  variant="outline"
                  className="w-full"
                >
                  Copy Analysis
                </Button>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Complete the form and click "Analyze Job Match" to get started</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default JobGuide;
