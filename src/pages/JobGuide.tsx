
import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { FileText, History, Download, Copy, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useUserCompletionStatus } from '@/hooks/useUserCompletionStatus';
import HistoryModal from '@/components/HistoryModal';

const JobGuide = () => {
  const { user } = useUser();
  const { toast } = useToast();
  const { userProfile } = useUserProfile();
  const { isComplete } = useUserCompletionStatus();
  
  const [formData, setFormData] = useState({
    job_title: '',
    company_name: '',
    job_description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !userProfile) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to analyze jobs.",
        variant: "destructive",
      });
      return;
    }

    if (!isComplete) {
      toast({
        title: "Profile Incomplete",
        description: "Please complete your profile before analyzing jobs.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.job_title.trim() || !formData.company_name.trim() || !formData.job_description.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('job_analyses')
        .insert({
          user_id: userProfile.id,
          job_title: formData.job_title,
          company_name: formData.company_name,
          job_description: formData.job_description,
        })
        .select()
        .single();

      if (error) throw error;

      // Placeholder result for now
      const mockResult = `
        ## Job Analysis for ${formData.job_title} at ${formData.company_name}

        **Summary:**
        This job requires a highly skilled professional with experience in ${formData.job_title}.

        **Key Skills:**
        - Skill 1
        - Skill 2
        - Skill 3

        **Recommendations:**
        Focus on highlighting your experience with similar roles.
      `;

      setResult(mockResult);
      toast({
        title: "Job Analysis Complete!",
        description: "Your job analysis has been generated successfully.",
      });
    } catch (err) {
      console.error('Error analyzing job:', err);
      toast({
        title: "Error",
        description: "Failed to analyze job. Please try again.",
        variant: "destructive",
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
        description: "Job analysis copied to clipboard successfully.",
      });
    } catch (err) {
      console.error('Failed to copy text:', err);
      toast({
        title: "Error",
        description: "Failed to copy text to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadPDF = () => {
    toast({
      title: "Download Not Available",
      description: "PDF download feature is not implemented yet.",
      variant: "destructive",
    });
  };

  const resetForm = () => {
    setFormData({
      job_title: '',
      company_name: '',
      job_description: ''
    });
    setResult('');
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900">
        <div className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl bg-gradient-to-r from-blue-200 via-indigo-300 to-purple-400 bg-clip-text text-transparent mb-4 font-inter md:text-4xl font-semibold">
              Job Analysis & Guide
            </h1>
            <p className="text-gray-300 max-w-2xl mx-auto font-inter text-sm font-light">
              Get detailed analysis of job requirements and personalized guidance for your application
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="flex justify-center">
              {/* Input Form - Centered */}
              <div className="w-full max-w-2xl">
                <Card className="bg-gradient-to-br from-blue-800/90 to-indigo-900/90 border-white/20 backdrop-blur-sm">
                  <CardHeader className="pb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-white font-inter flex items-center gap-2 text-base">
                          <Sparkles className="w-5 h-5 text-blue-400" />
                          Job Analysis
                        </CardTitle>
                        <CardDescription className="text-gray-300 font-inter">
                          Enter job details for comprehensive analysis
                        </CardDescription>
                      </div>
                      <Button 
                        onClick={() => setShowHistory(true)} 
                        variant="outline" 
                        size="sm" 
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-sm"
                      >
                        <History className="w-4 h-4 mr-2" />
                        History
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Job Title */}
                      <div className="space-y-3">
                        <Label htmlFor="job_title" className="text-white font-medium text-base">
                          Job Title *
                        </Label>
                        <Textarea 
                          id="job_title" 
                          placeholder="e.g., Senior Software Engineer, Product Manager, Data Scientist" 
                          value={formData.job_title} 
                          onChange={(e) => handleInputChange('job_title', e.target.value)} 
                          required 
                          className="min-h-[60px] resize-none text-base bg-blue-900/50 border-blue-700/50 text-white placeholder:text-blue-200/70" 
                        />
                      </div>

                      {/* Company Name */}
                      <div className="space-y-3">
                        <Label htmlFor="company_name" className="text-white font-medium text-base">
                          Company Name *
                        </Label>
                        <Textarea 
                          id="company_name" 
                          placeholder="e.g., Google, Microsoft, Tesla, StartupXYZ" 
                          value={formData.company_name} 
                          onChange={(e) => handleInputChange('company_name', e.target.value)} 
                          required 
                          className="min-h-[60px] resize-none text-base bg-blue-900/50 border-blue-700/50 text-white placeholder:text-blue-200/70" 
                        />
                      </div>

                      {/* Job Description */}
                      <div className="space-y-3">
                        <Label htmlFor="job_description" className="text-white font-medium text-base">
                          Job Description *
                        </Label>
                        <Textarea 
                          id="job_description" 
                          placeholder="Paste the complete job description here..." 
                          value={formData.job_description} 
                          onChange={(e) => handleInputChange('job_description', e.target.value)} 
                          required 
                          className="min-h-[200px] resize-none text-base bg-blue-900/50 border-blue-700/50 text-white placeholder:text-blue-200/70" 
                        />
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button 
                          type="submit" 
                          disabled={isSubmitting || !formData.job_title.trim() || !formData.company_name.trim() || !formData.job_description.trim()} 
                          className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium text-base h-12"
                        >
                          {isSubmitting ? 'Analyzing...' : 'Analyze Job'}
                        </Button>
                        
                        <Button 
                          type="button" 
                          onClick={resetForm} 
                          variant="outline" 
                          className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-base h-12 px-6"
                        >
                          Reset
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                {/* Result Display - Only show when there's a result */}
                {result && (
                  <Card className="bg-white/5 border-white/20 backdrop-blur-sm mt-8">
                    <CardHeader className="pb-6">
                      <CardTitle className="text-white font-inter text-xl flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-400" />
                        Job Analysis Results
                      </CardTitle>
                      <CardDescription className="text-gray-300 font-inter">
                        Your personalized job analysis is ready!
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="bg-white rounded-lg p-6 border-2 border-blue-200">
                          <div className="text-gray-800 text-base leading-relaxed whitespace-pre-wrap font-serif">
                            {result}
                          </div>
                        </div>
                        
                        <div className="flex gap-3">
                          <Button 
                            onClick={handleCopyResult} 
                            className="flex-1 bg-blue-700 hover:bg-blue-600 text-white flex items-center gap-2 text-base h-12"
                          >
                            <Copy className="w-4 h-4" />
                            Copy Analysis
                          </Button>
                          
                          <Button 
                            onClick={handleDownloadPDF} 
                            variant="outline" 
                            className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-base h-12 px-6"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            PDF
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* History Modal */}
        <HistoryModal 
          type="job_guide" 
          isOpen={showHistory} 
          onClose={() => setShowHistory(false)} 
          gradientColors="from-blue-400 to-indigo-500" 
        />
      </div>
    </Layout>
  );
};

export default JobGuide;
