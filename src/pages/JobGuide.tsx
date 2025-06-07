
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, FileSearch, Sparkles, Loader2, CheckCircle, Percent } from 'lucide-react';
import AuthHeader from '@/components/AuthHeader';
import DashboardNav from '@/components/DashboardNav';
import { useUserCompletionStatus } from '@/hooks/useUserCompletionStatus';

// Webhook URL - Easy to modify for different environments
const WEBHOOK_URL = 'https://n8n.srv834502.hstgr.cloud/webhook-test/ea69a2d4-dde6-4887-b169-27ba18206867';

interface WebhookResponse {
  jobMatchPercentage?: number;
  coverLetter?: string;
  [key: string]: any; // Allow for flexible response structure
}

const JobGuide = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasResume, hasBio, isComplete, loading } = useUserCompletionStatus();
  
  const [formData, setFormData] = useState({
    companyName: '',
    jobTitle: '',
    jobDescription: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [webhookResponse, setWebhookResponse] = useState<WebhookResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && !user) {
      navigate('/');
    }
  }, [user, isLoaded, navigate]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear previous results when form changes
    if (webhookResponse || error) {
      setWebhookResponse(null);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!isComplete) {
      toast({
        title: "Complete your profile first",
        description: "Please upload your resume and add your bio in the Home page before using Job Guide.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.companyName || !formData.jobTitle || !formData.jobDescription) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields before proceeding.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setWebhookResponse(null);

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName: formData.companyName,
          jobTitle: formData.jobTitle,
          jobDescription: formData.jobDescription,
          userId: user?.id, // Include user ID for tracking
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Webhook failed with status ${response.status}`);
      }

      const data = await response.json();
      setWebhookResponse(data);
      
      toast({
        title: "Analysis Complete!",
        description: "Your job match analysis and cover letter are ready.",
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze job posting';
      setError(errorMessage);
      
      toast({
        title: "Analysis Failed",
        description: "There was an error analyzing the job posting. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = formData.companyName && formData.jobTitle && formData.jobDescription;

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <AuthHeader />
      
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-semibold text-white mb-4 font-inter">
            <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">Job Guide</span>
          </h1>
          <p className="text-xl text-gray-300 font-inter font-light">
            Get personalized job matching and cover letter assistance
          </p>
        </div>

        <DashboardNav />

        <div className="space-y-8">
          {/* Profile Completion Status */}
          {loading ? (
            <Card className="bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 border-2 border-gray-400 shadow-2xl shadow-gray-500/20">
              <CardContent className="p-6">
                <div className="text-white">Checking your profile...</div>
              </CardContent>
            </Card>
          ) : !isComplete && (
            <Card className="bg-gradient-to-br from-orange-600 via-red-600 to-pink-600 border-2 border-orange-400 shadow-2xl shadow-orange-500/20">
              <CardHeader>
                <CardTitle className="text-white font-inter flex items-center gap-2">
                  <AlertCircle className="w-6 h-6" />
                  Complete Your Profile
                </CardTitle>
                <CardDescription className="text-orange-100 font-inter">
                  You need to complete your profile before using Job Guide
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className={`flex items-center gap-2 ${hasResume ? 'text-green-200' : 'text-red-200'}`}>
                    <div className={`w-2 h-2 rounded-full ${hasResume ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    <span className="font-inter text-sm">
                      {hasResume ? '✓ Resume uploaded' : '✗ Resume not uploaded'}
                    </span>
                  </div>
                  <div className={`flex items-center gap-2 ${hasBio ? 'text-green-200' : 'text-red-200'}`}>
                    <div className={`w-2 h-2 rounded-full ${hasBio ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    <span className="font-inter text-sm">
                      {hasBio ? '✓ Bio completed' : '✗ Bio not completed'}
                    </span>
                  </div>
                </div>
                <Button
                  onClick={() => navigate('/dashboard')}
                  className="font-inter bg-white text-orange-600 hover:bg-gray-100 font-medium"
                >
                  Go to Home Page
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Job Guide Form */}
          <Card className="bg-gradient-to-br from-emerald-600 via-green-600 to-teal-600 border-2 border-emerald-400 shadow-2xl shadow-emerald-500/20">
            <CardHeader>
              <CardTitle className="text-white font-inter flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <FileSearch className="w-4 h-4 text-white" />
                </div>
                Job Analysis
              </CardTitle>
              <CardDescription className="text-emerald-100 font-inter">
                Enter job details to get personalized matching analysis and cover letter
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-white font-inter font-medium mb-2">
                    Company Name
                  </label>
                  <Input
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    placeholder="Enter the company name"
                    className="bg-white/10 border-2 border-white/20 text-white placeholder-white/70 font-inter focus-visible:border-white/40 hover:border-white/30"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-white font-inter font-medium mb-2">
                    Job Title
                  </label>
                  <Input
                    value={formData.jobTitle}
                    onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                    placeholder="Enter the job title"
                    className="bg-white/10 border-2 border-white/20 text-white placeholder-white/70 font-inter focus-visible:border-white/40 hover:border-white/30"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-white font-inter font-medium mb-2">
                    Job Description
                  </label>
                  <Textarea
                    value={formData.jobDescription}
                    onChange={(e) => handleInputChange('jobDescription', e.target.value)}
                    placeholder="Paste the complete job description here including requirements, responsibilities, and qualifications..."
                    className="min-h-[150px] bg-white/10 border-2 border-white/20 text-white placeholder-white/70 font-inter focus-visible:border-white/40 hover:border-white/30"
                    rows={8}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Button
                  onClick={handleSubmit}
                  disabled={!isComplete || !isFormValid || isLoading}
                  className={`w-full font-inter font-medium py-4 px-3 min-h-[60px] ${
                    isComplete && isFormValid && !isLoading
                      ? 'bg-white text-emerald-600 hover:bg-gray-100'
                      : 'bg-white/50 text-gray-800 border-2 border-white/70 cursor-not-allowed hover:bg-white/50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2 w-full">
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 flex-shrink-0 animate-spin" />
                        <span className="text-center text-sm sm:text-base">Processing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 flex-shrink-0" />
                        <div className="text-center leading-tight text-sm sm:text-base">
                          <div>Get your <span className="font-bold text-yellow-600">Job match %</span></div>
                          <div>and personalized <span className="font-bold text-blue-600">Cover Letter</span></div>
                        </div>
                      </>
                    )}
                  </div>
                </Button>

                {(!isComplete || !isFormValid) && !isLoading && (
                  <p className="text-emerald-200 text-sm font-inter text-center">
                    {!isComplete 
                      ? 'Complete your profile first to use this feature'
                      : 'Fill in all fields to continue'
                    }
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Webhook Response Display */}
          {webhookResponse && (
            <div className="space-y-6">
              {/* Job Match Percentage */}
              {webhookResponse.jobMatchPercentage !== undefined && (
                <Card className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 border-2 border-blue-400 shadow-2xl shadow-blue-500/20">
                  <CardHeader>
                    <CardTitle className="text-white font-inter flex items-center gap-2">
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <Percent className="w-4 h-4 text-white" />
                      </div>
                      Job Match Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-6xl font-bold text-white mb-2">
                        {webhookResponse.jobMatchPercentage}%
                      </div>
                      <p className="text-blue-100 font-inter text-lg">
                        Match with your profile
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Cover Letter */}
              {webhookResponse.coverLetter && (
                <Card className="bg-gradient-to-br from-purple-600 via-pink-600 to-rose-600 border-2 border-purple-400 shadow-2xl shadow-purple-500/20">
                  <CardHeader>
                    <CardTitle className="text-white font-inter flex items-center gap-2">
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                      Personalized Cover Letter
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                      <pre className="text-white font-inter text-sm leading-relaxed whitespace-pre-wrap">
                        {webhookResponse.coverLetter}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Card className="bg-gradient-to-br from-red-600 via-red-700 to-red-800 border-2 border-red-400 shadow-2xl shadow-red-500/20">
              <CardHeader>
                <CardTitle className="text-white font-inter flex items-center gap-2">
                  <AlertCircle className="w-6 h-6" />
                  Analysis Error
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-100 font-inter">{error}</p>
                <Button
                  onClick={handleSubmit}
                  className="mt-4 bg-white text-red-600 hover:bg-gray-100 font-inter font-medium"
                  disabled={isLoading || !isFormValid}
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobGuide;
