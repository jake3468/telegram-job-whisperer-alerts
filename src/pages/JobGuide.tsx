
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, FileSearch, Sparkles, Loader2, CheckCircle } from 'lucide-react';
import AuthHeader from '@/components/AuthHeader';
import DashboardNav from '@/components/DashboardNav';
import { useUserCompletionStatus } from '@/hooks/useUserCompletionStatus';
import { supabase } from '@/integrations/supabase/client';

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
  const [isSuccess, setIsSuccess] = useState(false);
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
    if (isSuccess || error) {
      setIsSuccess(false);
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
    setIsSuccess(false);

    try {
      // First, get the user's database ID from the users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', user?.id)
        .single();

      if (userError || !userData) {
        throw new Error('User not found in database');
      }

      // Insert the job analysis data
      const { error: insertError } = await supabase
        .from('job_analyses')
        .insert({
          user_id: userData.id,
          company_name: formData.companyName,
          job_title: formData.jobTitle,
          job_description: formData.jobDescription,
        });

      if (insertError) {
        throw new Error(insertError.message);
      }

      setIsSuccess(true);
      
      toast({
        title: "Job Analysis Saved!",
        description: "Your job analysis has been successfully saved to your profile.",
      });

      // Reset form after successful submission
      setFormData({
        companyName: '',
        jobTitle: '',
        jobDescription: '',
      });

    } catch (err) {
      console.error('Error saving job analysis:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save job analysis';
      setError(errorMessage);
      
      toast({
        title: "Save Failed",
        description: "There was an error saving your job analysis. Please try again.",
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
            Save and organize your job applications
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
          <Card className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-600 border-2 border-slate-400 shadow-2xl shadow-slate-500/20">
            <CardHeader>
              <CardTitle className="text-white font-inter flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center">
                  <FileSearch className="w-4 h-4 text-emerald-400" />
                </div>
                Save Job Application
              </CardTitle>
              <CardDescription className="text-slate-200 font-inter">
                Enter job details to save to your profile for tracking
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-slate-100 font-inter font-medium mb-2">
                    Company Name
                  </label>
                  <Input
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    placeholder="Enter the company name"
                    className="bg-slate-900/50 border-2 border-slate-500 text-slate-100 placeholder-slate-400 font-inter focus-visible:border-emerald-400 hover:border-slate-400"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-slate-100 font-inter font-medium mb-2">
                    Job Title
                  </label>
                  <Input
                    value={formData.jobTitle}
                    onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                    placeholder="Enter the job title"
                    className="bg-slate-900/50 border-2 border-slate-500 text-slate-100 placeholder-slate-400 font-inter focus-visible:border-emerald-400 hover:border-slate-400"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-slate-100 font-inter font-medium mb-2">
                    Job Description
                  </label>
                  <Textarea
                    value={formData.jobDescription}
                    onChange={(e) => handleInputChange('jobDescription', e.target.value)}
                    placeholder="Paste the complete job description here including requirements, responsibilities, and qualifications..."
                    className="min-h-[150px] bg-slate-900/50 border-2 border-slate-500 text-slate-100 placeholder-slate-400 font-inter focus-visible:border-emerald-400 hover:border-slate-400"
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
                      ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                      : 'bg-slate-600 text-slate-300 border-2 border-slate-500 cursor-not-allowed hover:bg-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2 w-full">
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 flex-shrink-0 animate-spin" />
                        <span className="text-center text-sm sm:text-base">Saving...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 flex-shrink-0" />
                        <div className="text-center leading-tight text-sm sm:text-base">
                          <div>Save Job Application</div>
                        </div>
                      </>
                    )}
                  </div>
                </Button>

                {(!isComplete || !isFormValid) && !isLoading && (
                  <p className="text-slate-300 text-sm font-inter text-center">
                    {!isComplete 
                      ? 'Complete your profile first to use this feature'
                      : 'Fill in all fields to continue'
                    }
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Success Display */}
          {isSuccess && (
            <Card className="bg-gradient-to-br from-teal-400 via-teal-500 to-teal-600 border-2 border-teal-300 shadow-2xl shadow-teal-500/20">
              <CardHeader>
                <CardTitle className="text-black font-inter flex items-center gap-2">
                  <div className="w-8 h-8 bg-black/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-black" />
                  </div>
                  Application Saved Successfully!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-black font-inter">
                  Your job application details have been saved to your profile. You can now track this application and add more jobs to build your application history.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {error && (
            <Card className="bg-gradient-to-br from-red-600 via-red-700 to-red-800 border-2 border-red-400 shadow-2xl shadow-red-500/20">
              <CardHeader>
                <CardTitle className="text-white font-inter flex items-center gap-2">
                  <AlertCircle className="w-6 h-6" />
                  Save Error
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
