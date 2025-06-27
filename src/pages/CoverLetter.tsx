
import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Building2, Briefcase, Download, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCreditCheck } from '@/hooks/useCreditCheck';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import LoadingMessages from '@/components/LoadingMessages';
import { useUser } from '@clerk/clerk-react';
import { useClerkSupabaseSync } from '@/hooks/useClerkSupabaseSync';
import { CoverLetterHistoryModal } from '@/components/CoverLetterHistoryModal';
import CoverLetterDownloadActions from '@/components/CoverLetterDownloadActions';
import { ProfileCompletionWarning } from '@/components/ProfileCompletionWarning';

const CoverLetter = () => {
  // Ensure Clerk JWT is synced with Supabase
  useClerkSupabaseSync();
  
  const { user } = useUser();
  const [companyName, setCompanyName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<any>(null);
  const [coverLetterData, setCoverLetterData] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { hasCredits, showInsufficientCreditsPopup } = useCreditCheck(1.5);
  const { userProfile } = useUserProfile();

  // Query for existing cover letter data
  const { data: coverLetterHistory, refetch: refetchHistory } = useQuery({
    queryKey: ['cover-letter-history', userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id) return [];
      
      const { data, error } = await supabase
        .from('cover_letters')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!userProfile?.id
  });

  // Real-time subscription for cover letter results with improved detection
  useEffect(() => {
    if (!currentAnalysis?.id) return;

    const channel = supabase
      .channel('cover-letter-updates')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'cover_letters',
        filter: `id=eq.${currentAnalysis.id}`
      }, (payload) => {
        console.log('Cover letter updated:', payload);
        
        if (payload.new.cover_letter_content) {
          try {
            // Handle both string and already parsed data
            const parsedData = typeof payload.new.cover_letter_content === 'string' 
              ? payload.new.cover_letter_content 
              : JSON.stringify(payload.new.cover_letter_content);
            
            // Check if the data is meaningful (not just empty or null)
            if (parsedData && parsedData.trim().length > 0) {
              setCoverLetterData(parsedData);
              setIsGenerating(false);
              toast({
                title: "Cover Letter Ready!",
                description: "Your personalized cover letter has been generated."
              });
            }
          } catch (error) {
            console.error('Error processing cover letter content:', error);
            setIsGenerating(false);
            toast({
              title: "Error Processing Results",
              description: "There was an error processing your cover letter results.",
              variant: "destructive"
            });
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentAnalysis?.id, toast]);

  const handleGenerate = async () => {
    console.log('🚀 Cover Letter Generate Button Clicked');
    
    // Check credits first
    if (!hasCredits) {
      showInsufficientCreditsPopup();
      return;
    }

    if (!companyName.trim() || !jobTitle.trim() || !jobDescription.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields before generating cover letter.",
        variant: "destructive"
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Authentication Error",
        description: "Please sign in to generate cover letter.",
        variant: "destructive"
      });
      return;
    }

    if (!userProfile?.id) {
      toast({
        title: "Profile Error",
        description: "User profile not found. Please refresh the page and try again.",
        variant: "destructive"
      });
      return;
    }

    if (isSubmitting || isGenerating) {
      toast({
        title: "Please wait",
        description: "Your cover letter is already being generated.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setCoverLetterData(null);
      console.log('✅ Starting cover letter submission process');
      console.log('✅ User profile ID:', userProfile.id);

      // Check for existing analysis first
      const { data: existingAnalysis, error: checkError } = await supabase
        .from('cover_letters')
        .select('id, cover_letter_content')
        .eq('user_id', userProfile.id)
        .eq('company_name', companyName.trim())
        .eq('job_title', jobTitle.trim())
        .eq('job_description', jobDescription.trim())
        .not('cover_letter_content', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!checkError && existingAnalysis && existingAnalysis.length > 0) {
        const existing = existingAnalysis[0];
        console.log('✅ Found existing cover letter:', existing.id);
        
        try {
          // Handle both string and object data
          const parsedData = typeof existing.cover_letter_content === 'string' 
            ? existing.cover_letter_content 
            : JSON.stringify(existing.cover_letter_content);
          
          setCoverLetterData(parsedData);
          setCurrentAnalysis({ id: existing.id });
          setIsSubmitting(false);
          toast({
            title: "Previous Cover Letter Found",
            description: "Using your previous cover letter for this job posting."
          });
          return;
        } catch (error) {
          console.error('Error parsing existing cover letter content:', error);
          // Continue with new generation if parsing fails
        }
      }

      // Insert new cover letter record using the profile ID directly
      const insertData = {
        user_id: userProfile.id, // Use the profile ID directly  
        company_name: companyName.trim(),
        job_title: jobTitle.trim(),
        job_description: jobDescription.trim()
      };

      console.log('📝 Inserting cover letter data:', insertData);
      
      const { data: insertedData, error: insertError } = await supabase
        .from('cover_letters')
        .insert(insertData)
        .select('id')
        .single();

      if (insertError) {
        console.error('❌ INSERT ERROR:', insertError);
        throw new Error(`Database insert failed: ${insertError.message}`);
      }

      if (insertedData?.id) {
        console.log('✅ Cover letter record inserted:', insertedData.id);
        setCurrentAnalysis(insertedData);
        setIsGenerating(true);
        refetchHistory();
        
        toast({
          title: "Cover Letter Started!",
          description: "Your personalized cover letter is being generated. Please wait for the results."
        });
      }
    } catch (error) {
      console.error('❌ SUBMISSION ERROR:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate cover letter';
      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setCompanyName('');
    setJobTitle('');
    setJobDescription('');
    setCoverLetterData(null);
    setCurrentAnalysis(null);
    setIsGenerating(false);
  };

  const renderCoverLetter = (content: string) => {
    if (!content) return null;

    // Simple markdown parsing with smaller text sizes
    const processedContent = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold text
      .replace(/^# (.*$)/gim, '<h1 style="font-size: 1.125rem; font-weight: bold; margin: 0.75rem 0; color: #1e40af;">$1</h1>') // H1 headers - smaller
      .replace(/^## (.*$)/gim, '<h2 style="font-size: 1rem; font-weight: bold; margin: 0.5rem 0; color: #2563eb;">$1</h2>') // H2 headers - smaller
      .replace(/^### (.*$)/gim, '<h3 style="font-size: 0.95rem; font-weight: bold; margin: 0.375rem 0; color: #3b82f6;">$1</h3>') // H3 headers - smaller
      .replace(/\n/g, '<br>'); // Line breaks

    return (
      <div 
        className="text-gray-800 bg-white rounded p-4 font-inter text-sm leading-relaxed whitespace-pre-wrap break-words border border-gray-700"
        dangerouslySetInnerHTML={{ __html: processedContent }}
      />
    );
  };

  return (
    <Layout>
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 pb-2 max-w-5xl">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8 px-2">
            <div className="inline-flex items-center gap-3 mb-4">
              {/* Icon removed as requested */}
            </div>
            <h1 className="mb-4 bg-gradient-to-r from-[#ddd6f3] to-[#faaca8] bg-clip-text text-red-200 font-extrabold sm:text-4xl text-4xl">
              📝 Cover Letter
            </h1>
            <p className="text-gray-300 max-w-2xl mx-auto text-sm sm:text-lg font-light px-4">
              Your Personal Cover Letter Writer, powered by AI. Get tailored cover letters that highlight your strengths and match the job requirements perfectly.
            </p>
          </div>

          {/* Profile Completion Warning */}
          <ProfileCompletionWarning />

          {/* Form - Always visible */}
          <Card className="mb-6 sm:mb-8 bg-gradient-to-r from-[#ddd6f3] to-[#faaca8] border-0 mx-2 sm:mx-0">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="text-black text-lg sm:text-xl">Cover Letter Details</CardTitle>
                <div className="flex-shrink-0">
                  <CoverLetterHistoryModal />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Company Name and Job Title in horizontal layout for desktop */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-black flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Company Name
                  </label>
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g., Google, Microsoft, Amazon"
                    disabled={isGenerating || isSubmitting}
                    className="border-gray-300 placeholder-gray-400 bg-black text-white w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-black flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Job Title
                  </label>
                  <Input
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g., Senior Software Engineer, Product Manager"
                    disabled={isGenerating || isSubmitting}
                    className="border-gray-300 placeholder-gray-400 bg-black text-white w-full"
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
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the complete job description here..."
                  disabled={isGenerating || isSubmitting}
                  className="border-gray-300 placeholder-gray-400 min-h-32 bg-black text-white w-full resize-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || isSubmitting}
                  className="w-full sm:flex-1 text-white font-medium bg-rose-600 hover:bg-rose-500"
                >
                  {isGenerating || isSubmitting ? 'Generating...' : 'Generate Cover Letter'}
                </Button>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  disabled={isGenerating || isSubmitting}
                  className="w-full sm:w-auto px-6 border-black text-black hover:bg-gray-100"
                >
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Loading */}
          {isGenerating && (
            <div className="text-center py-8">
              <LoadingMessages type="cover_letter" />
            </div>
          )}

          {/* Results - Show below form when available */}
          {coverLetterData && (
            <div className="w-full space-y-6">
              {/* Simple result section matching history format */}
              <div className="rounded-lg p-4 border border-white/10 shadow-inner bg-red-700">
                <h3 className="text-white font-medium mb-3 flex flex-wrap gap-2 justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Cover Letter Result
                  </div>
                  <div className="flex-shrink-0">
                    <CoverLetterDownloadActions
                      coverLetterData={coverLetterData}
                      jobTitle={jobTitle}
                      companyName={companyName}
                      contrast={true}
                    />
                  </div>
                </h3>

                <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-lime-400 font-semibold">Your Personalized Cover Letter</h4>
                  </div>
                  
                  {renderCoverLetter(coverLetterData)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default CoverLetter;
