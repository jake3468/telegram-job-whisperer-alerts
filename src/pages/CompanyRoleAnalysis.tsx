import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, MapPin, Briefcase, Loader2, RotateCcw, Calendar, TrendingUp, Shield, Lightbulb, DollarSign, Users, GraduationCap, AlertTriangle, History } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { useCreditCheck } from '@/hooks/useCreditCheck';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import CompanyRoleAnalysisHistoryModal from '@/components/CompanyRoleAnalysisHistoryModal';
import LoadingMessages from '@/components/LoadingMessages';
import { PercentageMeter } from '@/components/PercentageMeter';
import { BulletPointList } from '@/components/BulletPointList';
import { JSONSectionDisplay } from '@/components/JSONSectionDisplay';
import { SourcesDisplay } from '@/components/SourcesDisplay';
import { PremiumAnalysisResults } from '@/components/PremiumAnalysisResults';

interface CompanyRoleAnalysisData {
  id: string;
  company_name: string;
  location: string;
  job_title: string;
  research_date: string | null;
  local_role_market_context: string | null;
  company_news_updates: string[] | null;
  role_security_score: number | null;
  role_security_score_breakdown: string[] | null;
  role_security_outlook: string | null;
  role_security_automation_risks: string | null;
  role_security_departmental_trends: string | null;
  role_experience_score: number | null;
  role_experience_score_breakdown: string[] | null;
  role_experience_specific_insights: string | null;
  role_compensation_analysis: any | null;
  role_workplace_environment: any | null;
  career_development: any | null;
  role_specific_considerations: any | null;
  interview_and_hiring_insights: any | null;
  sources: any | null;
  created_at: string;
  updated_at: string;
}

const CompanyRoleAnalysis = () => {
  const [companyName, setCompanyName] = useState('');
  const [location, setLocation] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [pendingAnalysisId, setPendingAnalysisId] = useState<string | null>(null);
  const [loadingMessages, setLoadingMessages] = useState<string[]>([]);
  const [showRecentResults, setShowRecentResults] = useState(false);
  const {
    toast
  } = useToast();
  const {
    userProfile
  } = useUserProfile();
  const {
    hasCredits,
    showInsufficientCreditsPopup
  } = useCreditCheck(1.5);

  // Clear results when component mounts (page refresh/navigation)
  useEffect(() => {
    setShowRecentResults(false);
  }, []);

  // Fetch company-role analysis history
  const {
    data: analysisHistory,
    refetch: refetchHistory
  } = useQuery({
    queryKey: ['company_role_analyses', userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id) return [];
      const {
        data,
        error
      } = await supabase.from('company_role_analyses').select('*').eq('user_id', userProfile.id).order('created_at', {
        ascending: false
      });
      if (error) {
        console.error('Error fetching company-role analysis history:', error);
        return [];
      }
      return data as CompanyRoleAnalysisData[];
    },
    enabled: !!userProfile?.id
  });

  // Real-time subscription for analysis updates
  useEffect(() => {
    if (!userProfile?.id || !pendingAnalysisId) return;
    const channel = supabase.channel('company-analysis-updates').on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'company_role_analyses',
      filter: `id=eq.${pendingAnalysisId}`
    }, payload => {
      console.log('Real-time update received:', payload);

      // Check if meaningful data has been added
      const newData = payload.new;
      if (newData && (newData.local_role_market_context || newData.company_news_updates || newData.role_security_score || newData.role_experience_score || newData.role_compensation_analysis || newData.role_workplace_environment || newData.career_development || newData.role_specific_considerations || newData.interview_and_hiring_insights || newData.sources)) {
        // Analysis is complete, refresh the data and stop loading
        refetchHistory();
        setPendingAnalysisId(null);
        setIsSubmitting(false);
        setLoadingMessages([]);
        setShowRecentResults(true);
        toast({
          title: "Analysis Complete!",
          description: "Your company analysis is ready to view."
        });
      }
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userProfile?.id, pendingAnalysisId, refetchHistory, toast]);

  // Loading messages effect
  useEffect(() => {
    if (!isSubmitting || !pendingAnalysisId) return;
    const messages = ["Analyzing company data...", "Researching market trends...", "Evaluating role security...", "Assessing compensation data...", "Analyzing workplace environment...", "Gathering interview insights...", "Compiling sources and references...", "Finalizing analysis report..."];
    let messageIndex = 0;
    setLoadingMessages([messages[0]]);
    const interval = setInterval(() => {
      messageIndex = (messageIndex + 1) % messages.length;
      setLoadingMessages(prev => [...prev.slice(-2), messages[messageIndex]]);
    }, 3000);
    return () => clearInterval(interval);
  }, [isSubmitting, pendingAnalysisId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.id) {
      toast({
        title: "Profile Required",
        description: "Please complete your profile before generating company-role analysis.",
        variant: "destructive"
      });
      return;
    }
    
    // Check credits before proceeding
    if (!hasCredits) {
      showInsufficientCreditsPopup();
      return;
    }
    
    if (!companyName.trim() || !location.trim() || !jobTitle.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    setIsSubmitting(true);
    setShowRecentResults(false);
    
    try {
      console.log('Creating company role analysis with data:', {
        user_id: userProfile.id,
        company_name: companyName.trim(),
        location: location.trim(),
        job_title: jobTitle.trim()
      });

      const {
        data,
        error
      } = await supabase.from('company_role_analyses').insert({
        user_id: userProfile.id,
        company_name: companyName.trim(),
        location: location.trim(),
        job_title: jobTitle.trim()
      }).select().single();
      
      if (error) {
        console.error('Error creating company-role analysis:', error);
        toast({
          title: "Error",
          description: "Failed to create company-role analysis. Please try again.",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      console.log('Company analysis created successfully:', data);

      // Set pending analysis ID to track real-time updates
      setPendingAnalysisId(data.id);
      toast({
        title: "Analysis Started",
        description: "Your company-role analysis is being generated. You'll see results shortly!"
      });

      // Reset form
      setCompanyName('');
      setLocation('');
      setJobTitle('');

      // Refetch history to show the new analysis
      refetchHistory();
    } catch (error) {
      console.error('Error submitting company-role analysis:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setCompanyName('');
    setLocation('');
    setJobTitle('');
  };

  const hasAnalysisResult = (analysis: CompanyRoleAnalysisData) => {
    return analysis.local_role_market_context || analysis.company_news_updates?.length || analysis.role_security_score || analysis.role_experience_score || analysis.role_compensation_analysis || analysis.role_workplace_environment || analysis.career_development || analysis.role_specific_considerations || analysis.interview_and_hiring_insights || analysis.sources;
  };

  // Get the most recent completed analysis for display
  const recentCompletedAnalysis = showRecentResults && analysisHistory && analysisHistory.length > 0 ? analysisHistory.find(analysis => hasAnalysisResult(analysis)) : null;
  
  return <Layout>
      <div className="min-h-screen bg-black px-2 py-4 sm:px-4 sm:py-6 lg:px-8 lg:py-8">
        <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
          {/* Header Section */}
          <div className="text-center space-y-3 sm:space-y-4 px-2">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <Building2 className="w-10 h-10 sm:w-12 sm:h-12 text-green-400" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-orbitron font-extrabold text-transparent bg-gradient-to-r from-green-400 via-green-500 to-green-600 bg-clip-text">
                Company Decoder
              </h1>
            </div>
            <p className="text-base sm:text-lg text-white max-w-3xl mx-auto leading-relaxed font-light px-2">
              Smart candidates don't just apply—they investigate. Get the career intelligence that puts you ahead of 99% of applicants.
            </p>
          </div>

          {/* Analysis Form */}
          <div className="w-full px-2">
            <Card className="bg-gradient-to-br from-green-500 via-green-600 to-green-700 border-green-400/30 shadow-2xl w-full max-w-full">
              <CardHeader className="bg-gradient-to-r from-green-600/90 via-green-700/90 to-green-800/90 border-b border-green-400/30 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle className="text-xl sm:text-2xl font-orbitron text-left font-normal text-gray-50">
                      Company & Role Intelligence
                    </CardTitle>
                    <p className="text-green-100 font-medium mt-2 text-left text-sm sm:text-base">
                      Provide company details to uncover hidden red flags and green lights
                    </p>
                  </div>
                  <Button onClick={() => setIsHistoryOpen(true)} variant="outline" className="w-full sm:w-auto border-white/50 text-white hover:text-white font-orbitron text-sm sm:text-base flex-shrink-0 bg-emerald-900 hover:bg-emerald-800">
                    <History className="w-4 h-4 mr-2" />
                    History
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                  {/* Company Name and Location Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName" className="text-white font-medium flex items-center gap-2 text-sm sm:text-base">
                        <Building2 className="w-4 h-4" />
                        Company Name *
                      </Label>
                      <Input id="companyName" type="text" placeholder="e.g., Google, Microsoft, Amazon" value={companyName} onChange={e => setCompanyName(e.target.value)} required className="border-green-300 text-white placeholder:text-gray-500 focus:border-green-500 focus:ring-green-500/20 h-10 sm:h-12 w-full text-sm sm:text-base bg-zinc-950" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location" className="text-white font-medium flex items-center gap-2 text-sm sm:text-base">
                        <MapPin className="w-4 h-4" />
                        Location *
                      </Label>
                      <Input id="location" type="text" placeholder="e.g., San Francisco, New York, Remote" value={location} onChange={e => setLocation(e.target.value)} required className="border-green-300 text-white placeholder:text-gray-500 focus:border-green-500 focus:ring-green-500/20 h-10 sm:h-12 w-full text-sm sm:text-base bg-zinc-950" />
                    </div>
                  </div>

                  {/* Job Title */}
                  <div className="space-y-2">
                    <Label htmlFor="jobTitle" className="text-white font-medium flex items-center gap-2 text-sm sm:text-base">
                      <Briefcase className="w-4 h-4" />
                      Job Title *
                    </Label>
                    <Input id="jobTitle" type="text" placeholder="e.g., Senior Software Engineer, Product Manager, Data Scientist" value={jobTitle} onChange={e => setJobTitle(e.target.value)} required className="border-green-300 text-white placeholder:text-gray-500 focus:border-green-500 focus:ring-green-500/20 h-10 sm:h-12 w-full text-sm sm:text-base bg-zinc-950" />
                  </div>

                  {/* Action Buttons - Desktop: same line, Mobile: stacked */}
                  <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 pt-2 sm:pt-4">
                    <Button 
                      type="submit" 
                      disabled={isSubmitting || !hasCredits} 
                      className="w-full lg:flex-1 bg-gradient-to-r from-green-700 via-green-800 to-green-900 hover:from-green-800 hover:via-green-900 hover:to-green-950 text-white font-orbitron font-bold py-4 sm:py-6 text-sm sm:text-lg shadow-2xl shadow-green-600/25 border-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? <>
                          <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                          Analyzing Company & Role...
                        </> : <>
                          <Building2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                          Generate Analysis (1.5 Credits)
                        </>}
                    </Button>
                    
                    <Button type="button" variant="outline" onClick={handleReset} className="w-full lg:w-auto border-white/50 text-white hover:bg-white/20 hover:text-white font-orbitron bg-transparent py-3 sm:py-4 text-sm sm:text-base lg:px-6">
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reset
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Loading Messages */}
          {isSubmitting && pendingAnalysisId && <div className="space-y-4 px-2">
              <Card className="bg-gradient-to-br from-green-800/50 via-green-700/50 to-green-600/50 border-green-400/30">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-green-400" />
                    <h3 className="text-lg sm:text-xl font-orbitron font-bold text-white">
                      Analyzing Your Company & Role
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {loadingMessages.map((message, index) => <div key={index} className="flex items-center gap-2 text-sm sm:text-base text-white font-medium">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        {message}
                      </div>)}
                  </div>
                </CardContent>
              </Card>
            </div>}

          {/* Results Section - Only show when showRecentResults is true */}
          {recentCompletedAnalysis && <div className="space-y-4 px-2">
              <h2 className="text-xl sm:text-2xl font-orbitron font-bold text-white">
                Latest Analysis Result
              </h2>
              
              <div className="grid gap-6">
                <PremiumAnalysisResults analysis={recentCompletedAnalysis} />
              </div>
            </div>}
        </div>
      </div>

      {/* History Modal */}
      <CompanyRoleAnalysisHistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} gradientColors="from-green-400 via-green-500 to-green-600" />
    </Layout>;
};

export default CompanyRoleAnalysis;
