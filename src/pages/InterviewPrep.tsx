
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, RotateCcw } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { useCreditCheck } from '@/hooks/useCreditCheck';
import { useDeferredCreditDeduction } from '@/hooks/useDeferredCreditDeduction';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const InterviewPrep = () => {
  const [companyName, setCompanyName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState(null);

  const { userProfile } = useUserProfile();
  const { hasCredits, showInsufficientCreditsPopup } = useCreditCheck(1.5);
  const { deductCredits, isDeducting } = useDeferredCreditDeduction();
  const { toast } = useToast();

  const handleReset = () => {
    setCompanyName('');
    setJobTitle('');
    setJobDescription('');
    setResults(null);
  };

  const handleGenerate = async () => {
    if (!hasCredits) {
      showInsufficientCreditsPopup();
      return;
    }

    if (!userProfile?.id) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to use this feature.",
        variant: "destructive"
      });
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

    setIsGenerating(true);
    
    try {
      console.log('Inserting interview prep data...');
      
      const { data, error } = await supabase
        .from('interview_prep')
        .insert({
          user_id: userProfile.id,
          company_name: companyName.trim(),
          job_title: jobTitle.trim(),
          job_description: jobDescription.trim()
        })
        .select()
        .single();

      if (error) {
        console.error('Error inserting interview prep:', error);
        toast({
          title: "Generation Failed",
          description: "Failed to start interview prep generation. Please try again.",
          variant: "destructive"
        });
        return;
      }

      console.log('Interview prep inserted successfully:', data);

      // Deduct credits after successful insertion
      const creditDeducted = await deductCredits(
        1.5,
        'interview_prep',
        'Credits deducted for interview prep generation'
      );

      if (!creditDeducted) {
        console.error('Failed to deduct credits for interview prep');
        toast({
          title: "Credit Deduction Failed",
          description: "Unable to deduct credits. Please try again.",
          variant: "destructive"
        });
        return;
      }

      // Mock results for now - in production this would come from webhook
      setTimeout(() => {
        setResults({
          questions: [
            {
              category: "Behavioral Questions",
              items: [
                {
                  question: "Tell me about a time when you had to work under pressure.",
                  answer: "Use the STAR method to structure your response...",
                  tips: "Focus on specific examples and quantifiable results."
                }
              ]
            },
            {
              category: "Technical Questions",
              items: [
                {
                  question: "How would you approach this role's main challenges?",
                  answer: "Based on the job description, I would prioritize...",
                  tips: "Show your understanding of the role requirements."
                }
              ]
            }
          ],
          strategicQuestions: [
            "What are the biggest challenges facing the team right now?",
            "How do you measure success in this role?",
            "What opportunities are there for professional development?"
          ]
        });
        setIsGenerating(false);
      }, 3000);

    } catch (error) {
      console.error('Error in interview prep generation:', error);
      toast({
        title: "Generation Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      if (!results) {
        setIsGenerating(false);
      }
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-8">
          {/* Header with gradient background */}
          <div className="bg-gradient-to-r from-[#ddd6f3] to-[#faaca8] rounded-lg p-8 mb-8">
            <h1 className="text-4xl font-bold text-black mb-4">Interview Prep</h1>
            <p className="text-lg text-black/80">
              Your Personal Interview Coach, powered by AI. Get 15 tailored questions with perfect answers, pro tips, and strategic questions to ask your interviewer.
            </p>
          </div>

          {/* Form Card with gradient background */}
          <Card className="bg-gradient-to-r from-[#ddd6f3] to-[#faaca8] border-0 mb-8">
            <CardHeader>
              <CardTitle className="text-black text-xl">Interview Preparation Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Company Name
                  </label>
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Enter company name"
                    className="bg-white border-gray-300 text-black"
                    disabled={isGenerating}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Job Title
                  </label>
                  <Input
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="Enter job title"
                    className="bg-white border-gray-300 text-black"
                    disabled={isGenerating}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Job Description
                </label>
                <Textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here..."
                  className="bg-white border-gray-300 text-black min-h-[120px]"
                  disabled={isGenerating}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || isDeducting || !companyName.trim() || !jobTitle.trim() || !jobDescription.trim()}
                  className="bg-black text-white hover:bg-gray-800 flex-1"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      <span className="text-sm">Generating...</span>
                    </>
                  ) : (
                    <span className="text-sm">Generate Analysis</span>
                  )}
                </Button>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  disabled={isGenerating}
                  className="bg-white text-black border-gray-300 hover:bg-gray-100 px-6"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results Section */}
          {results && (
            <div className="space-y-6">
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Interview Questions & Answers</CardTitle>
                </CardHeader>
                <CardContent>
                  {results.questions.map((category, index) => (
                    <div key={index} className="mb-6">
                      <h3 className="text-lg font-semibold text-white mb-4">{category.category}</h3>
                      {category.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="bg-gray-800 p-4 rounded-lg mb-4">
                          <h4 className="font-medium text-white mb-2">{item.question}</h4>
                          <p className="text-gray-300 mb-2">{item.answer}</p>
                          <p className="text-sm text-blue-400 italic">{item.tips}</p>
                        </div>
                      ))}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Strategic Questions to Ask</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {results.strategicQuestions.map((question, index) => (
                      <div key={index} className="bg-gray-800 p-3 rounded-lg">
                        <p className="text-gray-300">{question}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default InterviewPrep;
