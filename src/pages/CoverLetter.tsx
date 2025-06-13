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
const CoverLetter = () => {
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
    job_title: '',
    company_name: '',
    job_description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState('');
  const [showHistory, setShowHistory] = useState(false);
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
        description: "Please sign in to generate cover letters.",
        variant: "destructive"
      });
      return;
    }
    if (!isComplete) {
      toast({
        title: "Profile Incomplete",
        description: "Please complete your profile before generating cover letters.",
        variant: "destructive"
      });
      return;
    }
    if (!formData.job_title.trim() || !formData.company_name.trim() || !formData.job_description.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
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
      } = await supabase.from('job_cover_letters').insert({
        user_id: userProfile.id,
        job_title: formData.job_title,
        company_name: formData.company_name,
        job_description: formData.job_description
      }).select().single();
      if (error) throw error;

      // For now, we'll just show a placeholder result
      // In a real implementation, this would trigger the AI generation
      const mockResult = `[Your Name]\n[Your Address]\n[Your Phone]\n[Your Email]\n\n[Date]\n\n[Hiring Manager Name] (If you know it, otherwise use title)\n[Hiring Manager Title]\n[Company Name]\n[Company Address]\n\nDear [Mr./Ms./Mx. Last Name or Hiring Manager Title],\n\nI am writing to express my interest in the [Job Title] position at [Company Name]. With my experience in [relevant skills/industry] and a proven track record of [achievements], I am confident I can make a significant contribution to your team.\n\nIn my previous role at [Previous Company], I [quantifiable achievements]. I am particularly drawn to [Company Name] because [reasons for interest].\n\nI am eager to learn more about this opportunity and discuss how my skills and experience can benefit your organization. Thank you for considering my application. I look forward to hearing from you soon.\n\nSincerely,\n[Your Name]`;
      setResult(mockResult);
      toast({
        title: "Cover Letter Generated!",
        description: "Your cover letter has been generated successfully."
      });
    } catch (err) {
      console.error('Error creating cover letter:', err);
      toast({
        title: "Error",
        description: "Failed to create cover letter. Please try again.",
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
        description: "Cover letter copied to clipboard successfully."
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
  const handleDownloadPDF = () => {
    toast({
      title: "Download Not Available",
      description: "PDF download functionality is not implemented yet.",
      variant: "destructive"
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
  return <Layout>
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900">
        <div className="container mx-auto px-4 py-8 bg-zinc-950">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl bg-gradient-to-r from-emerald-200 via-teal-300 to-cyan-400 bg-clip-text text-transparent mb-4 font-inter md:text-4xl font-semibold">Cover Letter</h1>
            <p className="text-gray-300 max-w-2xl mx-auto font-inter text-sm font-light">
              Create personalized cover letters that highlight your strengths and match job requirements
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="flex justify-center">
              {/* Input Form - Centered */}
              <div className="w-full max-w-2xl">
                <Card className="bg-gradient-to-br from-emerald-800/90 to-teal-900/90 border-white/20 backdrop-blur-sm">
                  <CardHeader className="pb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-white font-inter flex items-center gap-2 text-base">
                          <Sparkles className="w-5 h-5 text-emerald-400" />
                          Create Cover Letter
                        </CardTitle>
                        <CardDescription className="text-gray-300 font-inter">
                          Enter job details to generate your personalized cover letter
                        </CardDescription>
                      </div>
                      <Button onClick={() => setShowHistory(true)} variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-sm">
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
                        <Textarea id="job_title" placeholder="e.g., Senior Software Engineer, Product Manager, Data Scientist" value={formData.job_title} onChange={e => handleInputChange('job_title', e.target.value)} required className="min-h-[60px] resize-none text-base bg-emerald-900/50 border-emerald-700/50 text-white placeholder:text-emerald-200/70" />
                      </div>

                      {/* Company Name */}
                      <div className="space-y-3">
                        <Label htmlFor="company_name" className="text-white font-medium text-base">
                          Company Name *
                        </Label>
                        <Textarea id="company_name" placeholder="e.g., Google, Microsoft, Tesla, StartupXYZ" value={formData.company_name} onChange={e => handleInputChange('company_name', e.target.value)} required className="min-h-[60px] resize-none text-base bg-emerald-900/50 border-emerald-700/50 text-white placeholder:text-emerald-200/70" />
                      </div>

                      {/* Job Description */}
                      <div className="space-y-3">
                        <Label htmlFor="job_description" className="text-white font-medium text-base">
                          Job Description *
                        </Label>
                        <Textarea id="job_description" placeholder="Paste the complete job description here..." value={formData.job_description} onChange={e => handleInputChange('job_description', e.target.value)} required className="min-h-[200px] resize-none text-base bg-emerald-900/50 border-emerald-700/50 text-white placeholder:text-emerald-200/70" />
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button type="submit" disabled={isSubmitting || !formData.job_title.trim() || !formData.company_name.trim() || !formData.job_description.trim()} className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium text-base h-12">
                          {isSubmitting ? 'Generating...' : 'Generate Cover Letter'}
                        </Button>
                        
                        <Button type="button" onClick={resetForm} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-base h-12 px-6">
                          Reset
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                {/* Result Display - Only show when there's a result */}
                {result && <Card className="bg-white/5 border-white/20 backdrop-blur-sm mt-8">
                    <CardHeader className="pb-6">
                      <CardTitle className="text-white font-inter text-xl flex items-center gap-2">
                        <FileText className="w-5 h-5 text-emerald-400" />
                        Your Cover Letter
                      </CardTitle>
                      <CardDescription className="text-gray-300 font-inter">
                        Your personalized cover letter is ready!
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="bg-white rounded-lg p-6 border-2 border-emerald-200">
                          <div className="text-gray-800 text-base leading-relaxed whitespace-pre-wrap font-serif">
                            {result}
                          </div>
                        </div>
                        
                        <div className="flex gap-3">
                          <Button onClick={handleCopyResult} className="flex-1 bg-emerald-700 hover:bg-emerald-600 text-white flex items-center gap-2 text-base h-12">
                            <Copy className="w-4 h-4" />
                            Copy Cover Letter
                          </Button>
                          
                          <Button onClick={handleDownloadPDF} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-base h-12 px-6">
                            <Download className="w-4 h-4 mr-2" />
                            PDF
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>}
              </div>
            </div>
          </div>
        </div>

        {/* History Modal */}
        <HistoryModal type="cover_letter" isOpen={showHistory} onClose={() => setShowHistory(false)} gradientColors="from-emerald-400 to-teal-500" />
      </div>
    </Layout>;
};
export default CoverLetter;