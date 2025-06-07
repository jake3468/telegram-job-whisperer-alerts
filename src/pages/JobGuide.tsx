
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, FileSearch, Sparkles } from 'lucide-react';
import AuthHeader from '@/components/AuthHeader';
import DashboardNav from '@/components/DashboardNav';
import { useUserCompletionStatus } from '@/hooks/useUserCompletionStatus';

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

    // Placeholder for webhook integration
    toast({
      title: "Feature coming soon",
      description: "Job matching and cover letter generation will be available shortly!",
    });
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
                  />
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!isComplete || !isFormValid}
                className={`w-full font-inter font-medium text-base sm:text-lg py-6 leading-tight ${
                  isComplete && isFormValid
                    ? 'bg-white text-emerald-600 hover:bg-gray-100'
                    : 'bg-white/30 text-white border border-white/50 cursor-not-allowed hover:bg-white/30'
                }`}
              >
                <Sparkles className="w-5 h-5 mr-2 flex-shrink-0" />
                <span className="text-center break-words">
                  Get your <span className="font-bold text-yellow-500 mx-1">Job match %</span> and personalized <span className="font-bold text-blue-600 mx-1">Cover Letter</span>
                </span>
              </Button>

              {(!isComplete || !isFormValid) && (
                <p className="text-emerald-200 text-sm font-inter text-center">
                  {!isComplete 
                    ? 'Complete your profile first to use this feature'
                    : 'Fill in all fields to continue'
                  }
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default JobGuide;
