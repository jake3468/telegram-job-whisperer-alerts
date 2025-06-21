import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Copy, Clock, Building2, Briefcase, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCreditCheck } from '@/hooks/useCreditCheck';
import { useDeferredCreditDeduction } from '@/hooks/useDeferredCreditDeduction';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import LoadingMessages from '@/components/LoadingMessages';

interface InterviewQuestion {
  question: string;
  answer: string;
  tips?: string;
}
interface InterviewData {
  questions: InterviewQuestion[];
  strategic_questions?: string[];
  company_insights?: string;
  role_insights?: string;
}

const InterviewPrep = () => {
  const [companyName, setCompanyName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<any>(null);
  const [interviewData, setInterviewData] = useState<InterviewData | null>(null);
  const {
    toast
  } = useToast();
  const {
    hasCredits,
    showInsufficientCreditsPopup
  } = useCreditCheck(1.5);
  const {
    deductCredits,
    isDeducting
  } = useDeferredCreditDeduction();
  const {
    userProfile
  } = useUserProfile();

  // Query for existing interview prep data
  const {
    data: interviewHistory,
    refetch: refetchHistory
  } = useQuery({
    queryKey: ['interview-prep-history', userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id) return [];
      const {
        data,
        error
      } = await supabase.from('interview_prep').select('*').eq('user_id', userProfile.id).order('created_at', {
        ascending: false
      });
      if (error) throw error;
      return data || [];
    },
    enabled: !!userProfile?.id
  });

  // Real-time subscription for interview results
  useEffect(() => {
    if (!currentAnalysis?.id) return;
    const channel = supabase.channel('interview-prep-updates').on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'interview_prep',
      filter: `id=eq.${currentAnalysis.id}`
    }, payload => {
      console.log('Interview prep updated:', payload);
      if (payload.new.interview_questions) {
        setInterviewData(payload.new.interview_questions);
        setIsGenerating(false);

        // Deduct credits when results are available
        deductCredits(1.5, 'interview_prep', `Interview prep for ${payload.new.company_name} - ${payload.new.job_title}`);
      }
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentAnalysis?.id, deductCredits]);
  const handleGenerate = async () => {
    if (!hasCredits) {
      showInsufficientCreditsPopup();
      return;
    }
    if (!companyName.trim() || !jobTitle.trim() || !jobDescription.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields before generating interview prep.",
        variant: "destructive"
      });
      return;
    }
    if (!userProfile?.id) {
      toast({
        title: "Authentication Error",
        description: "Please sign in to generate interview prep.",
        variant: "destructive"
      });
      return;
    }
    setIsGenerating(true);
    setInterviewData(null);
    try {
      const {
        data,
        error
      } = await supabase.from('interview_prep').insert({
        user_id: userProfile.id,
        company_name: companyName.trim(),
        job_title: jobTitle.trim(),
        job_description: jobDescription.trim()
      }).select().single();
      if (error) throw error;
      setCurrentAnalysis(data);
      refetchHistory();
      toast({
        title: "Interview Prep Started",
        description: "Your personalized interview questions are being generated..."
      });
    } catch (error) {
      console.error('Error creating interview prep:', error);
      setIsGenerating(false);
      toast({
        title: "Error",
        description: "Failed to start interview prep generation. Please try again.",
        variant: "destructive"
      });
    }
  };
  const handleReset = () => {
    setCompanyName('');
    setJobTitle('');
    setJobDescription('');
    setInterviewData(null);
    setCurrentAnalysis(null);
    setIsGenerating(false);
  };
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Content copied to clipboard."
    });
  };
  return <Layout>
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-[#ddd6f3] to-[#faaca8]">
                <MessageSquare className="w-8 h-8 text-black" />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-[#ddd6f3] to-[#faaca8] bg-clip-text text-transparent md:text-4xl">
              Interview Prep
            </h1>
            <p className="text-gray-300 max-w-2xl mx-auto text-lg font-light">
              Your Personal Interview Coach, powered by AI. Get 15 tailored questions with perfect answers, pro tips, and strategic questions to ask your interviewer.
            </p>
          </div>

          {/* Form */}
          <Card className="mb-8 bg-gradient-to-r from-[#ddd6f3] to-[#faaca8] border-0">
            <CardHeader>
              <CardTitle className="text-black text-xl">Interview Preparation Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Company Name and Job Title in horizontal layout for desktop */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-black flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Company Name
                  </label>
                  <Input 
                    value={companyName} 
                    onChange={e => setCompanyName(e.target.value)} 
                    placeholder="e.g., Google, Microsoft, Amazon" 
                    disabled={isGenerating} 
                    className="border-gray-300 placeholder-gray-500 bg-white text-black"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-black flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Job Title
                  </label>
                  <Input 
                    value={jobTitle} 
                    onChange={e => setJobTitle(e.target.value)} 
                    placeholder="e.g., Senior Software Engineer, Product Manager" 
                    disabled={isGenerating} 
                    className="border-gray-300 placeholder-gray-500 bg-white text-black"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-black flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Job Description
                </label>
                <Textarea 
                  value={jobDescription} 
                  onChange={e => setJobDescription(e.target.value)} 
                  placeholder="Paste the complete job description here..." 
                  disabled={isGenerating} 
                  className="border-gray-300 placeholder-gray-500 min-h-32 bg-white text-black"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleGenerate} disabled={isGenerating || isDeducting} className="flex-1 bg-black text-white hover:bg-gray-800 font-medium">
                  {isGenerating ? 'Generating...' : 'Generate Interview Prep'}
                </Button>
                <Button onClick={handleReset} variant="outline" disabled={isGenerating} className="px-6 border-black text-black hover:bg-gray-100">
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Loading */}
          {isGenerating && <div className="text-center py-8">
              <LoadingMessages type="interview_prep" />
            </div>}

          {/* Results */}
          {interviewData && <div className="space-y-6">
              <div className="flex items-center gap-2 text-green-400">
                <Clock className="w-5 h-5" />
                <span className="font-medium">Interview prep complete!</span>
              </div>

              {/* Questions */}
              {interviewData.questions && <Card className="bg-gray-900 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center justify-between">
                      Interview Questions & Answers
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(JSON.stringify(interviewData.questions, null, 2))} className="text-gray-400 hover:text-white">
                        <Copy className="w-4 h-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {interviewData.questions.map((item, index) => <div key={index} className="space-y-3 p-4 bg-gray-800 rounded-lg">
                        <div className="flex items-start gap-3">
                          <span className="bg-blue-600 text-white text-sm px-2 py-1 rounded-full font-medium flex-shrink-0">
                            Q{index + 1}
                          </span>
                          <p className="text-white font-medium">{item.question}</p>
                        </div>
                        <div className="ml-8 space-y-2">
                          <p className="text-gray-300">{item.answer}</p>
                          {item.tips && <div className="bg-yellow-900/20 border-l-4 border-yellow-500 p-3 rounded">
                              <p className="text-yellow-200 text-sm">
                                <strong>Pro Tip:</strong> {item.tips}
                              </p>
                            </div>}
                        </div>
                      </div>)}
                  </CardContent>
                </Card>}

              {/* Strategic Questions */}
              {interviewData.strategic_questions && <Card className="bg-gray-900 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center justify-between">
                      Questions to Ask Your Interviewer
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(interviewData.strategic_questions?.join('\n') || '')} className="text-gray-400 hover:text-white">
                        <Copy className="w-4 h-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {interviewData.strategic_questions.map((question, index) => <li key={index} className="flex items-start gap-3 text-gray-300">
                          <span className="text-green-400 mt-1">•</span>
                          {question}
                        </li>)}
                    </ul>
                  </CardContent>
                </Card>}

              {/* Additional Insights */}
              {(interviewData.company_insights || interviewData.role_insights) && <div className="grid md:grid-cols-2 gap-6">
                  {interviewData.company_insights && <Card className="bg-gray-900 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-white">Company Insights</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-300">{interviewData.company_insights}</p>
                      </CardContent>
                    </Card>}
                  {interviewData.role_insights && <Card className="bg-gray-900 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-white">Role Insights</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-300">{interviewData.role_insights}</p>
                      </CardContent>
                    </Card>}
                </div>}
            </div>}
        </div>
      </div>
    </Layout>;
};

export default InterviewPrep;
