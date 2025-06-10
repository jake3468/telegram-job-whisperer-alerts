
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FileText, Send, CheckCircle, Loader2 } from 'lucide-react';

const CoverLetter = () => {
  const { user } = useUser();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [coverLetterResult, setCoverLetterResult] = useState<string>('');
  const [currentRecordId, setCurrentRecordId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    companyName: '',
    jobTitle: '',
    jobDescription: ''
  });

  // Add session tracking to prevent duplicate submissions
  const [sessionSubmissions, setSessionSubmissions] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Load any existing cover letter result on page load
    if (user && currentRecordId) {
      checkForCoverLetterResult();
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

  const checkForCoverLetterResult = async () => {
    if (!currentRecordId) return;

    try {
      const { data, error } = await supabase
        .from('job_cover_letters')
        .select('cover_letter')
        .eq('id', currentRecordId)
        .single();

      if (error) {
        console.error('Error checking cover letter result:', error);
        return;
      }

      if (data?.cover_letter) {
        setCoverLetterResult(data.cover_letter);
        setLoading(false);
        console.log('Cover letter result found:', data.cover_letter.substring(0, 100) + '...');
      }
    } catch (error) {
      console.error('Error checking cover letter result:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to generate a cover letter.",
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
        description: "You've recently submitted this cover letter request. Please wait before submitting again.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setCoverLetterResult('');
    setCurrentRecordId(null);

    try {
      console.log('Starting cover letter generation for:', formData.companyName, formData.jobTitle);

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

      // Insert into job_cover_letters table (this will trigger the webhook)
      const { data: insertData, error: insertError } = await supabase
        .from('job_cover_letters')
        .insert({
          user_id: userData.id,
          company_name: formData.companyName.trim(),
          job_title: formData.jobTitle.trim(),
          job_description: formData.jobDescription.trim()
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting cover letter record:', insertError);
        throw new Error('Failed to create cover letter record');
      }

      console.log('Cover letter record inserted successfully:', insertData.id);
      setCurrentRecordId(insertData.id);

      // Track this submission in session
      setSessionSubmissions(prev => new Set([...prev, sessionKey]));

      // Start polling for the result
      startPollingForCoverLetterResult(insertData.id);

      toast({
        title: "Cover letter request submitted",
        description: "Your cover letter is being generated. This may take a few moments.",
      });

    } catch (error) {
      console.error('Error submitting cover letter request:', error);
      setLoading(false);
      toast({
        title: "Submission failed",
        description: error instanceof Error ? error.message : "There was an error submitting your request.",
        variant: "destructive",
      });
    }
  };

  const startPollingForCoverLetterResult = (recordId: string) => {
    console.log('Starting polling for cover letter result:', recordId);
    
    const pollInterval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('job_cover_letters')
          .select('cover_letter')
          .eq('id', recordId)
          .single();

        if (error) {
          console.error('Error polling for cover letter result:', error);
          return;
        }

        if (data?.cover_letter) {
          console.log('Cover letter result received:', data.cover_letter.substring(0, 100) + '...');
          setCoverLetterResult(data.cover_letter);
          setLoading(false);
          clearInterval(pollInterval);
          
          toast({
            title: "Cover letter generated",
            description: "Your personalized cover letter is ready!",
          });
        }
      } catch (error) {
        console.error('Error polling for cover letter result:', error);
      }
    }, 3000); // Poll every 3 seconds

    // Stop polling after 5 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      if (loading) {
        setLoading(false);
        toast({
          title: "Generation timeout",
          description: "Cover letter generation is taking longer than expected. Please try again.",
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Cover Letter Generator</h1>
        <p className="text-lg text-gray-600">
          Generate a personalized cover letter tailored to the specific job and company
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Job Details
            </CardTitle>
            <CardDescription>
              Provide the job information to generate your cover letter
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
                    Generating Cover Letter...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Generate Cover Letter
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
              {coverLetterResult ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <FileText className="w-5 h-5" />
              )}
              Cover Letter Result
            </CardTitle>
            <CardDescription>
              {loading 
                ? "Your cover letter is being generated..." 
                : coverLetterResult 
                  ? "Your personalized cover letter is ready"
                  : "Your generated cover letter will appear here"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                  <p className="text-gray-600">Generating your cover letter...</p>
                  <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
                </div>
              </div>
            ) : coverLetterResult ? (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                    {coverLetterResult}
                  </div>
                </div>
                <Button 
                  onClick={() => navigator.clipboard.writeText(coverLetterResult)}
                  variant="outline"
                  className="w-full"
                >
                  Copy to Clipboard
                </Button>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Complete the form and click "Generate Cover Letter" to get started</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CoverLetter;
