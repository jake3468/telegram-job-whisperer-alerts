import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, MapPin, Briefcase, Loader2, RotateCcw, Calendar, TrendingUp, Shield, Lightbulb, DollarSign, Users, GraduationCap, AlertTriangle, History, RefreshCw } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { useFeatureCreditCheck } from '@/hooks/useFeatureCreditCheck';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import CompanyRoleAnalysisHistoryModal from '@/components/CompanyRoleAnalysisHistoryModal';
import { useCachedCompanyAnalyses } from '@/hooks/useCachedCompanyAnalyses';
import LoadingMessages from '@/components/LoadingMessages';
import { PercentageMeter } from '@/components/PercentageMeter';
import { BulletPointList } from '@/components/BulletPointList';
import { JSONSectionDisplay } from '@/components/JSONSectionDisplay';
import { SourcesDisplay } from '@/components/SourcesDisplay';
import { PremiumAnalysisResults } from '@/components/PremiumAnalysisResults';
import { Badge } from '@/components/ui/badge';
import { useEnterpriseAuth } from '@/hooks/useEnterpriseAuth';
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
  const location = useLocation();
  const [companyName, setCompanyName] = useState('');
  const [locationField, setLocationField] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [pendingAnalysisId, setPendingAnalysisId] = useState<string | null>(null);
  const [loadingMessages, setLoadingMessages] = useState<string[]>([]);
  const [showRecentResults, setShowRecentResults] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');
  const {
    toast
  } = useToast();
  const {
    userProfile
  } = useUserProfile();
  const {
    isAuthReady,
    executeWithRetry
  } = useEnterpriseAuth();

  // Handle pre-populated data from job tracker
  useEffect(() => {
    if (location.state?.companyName) {
      setCompanyName(location.state.companyName);
    }
    if (location.state?.jobTitle) {
      setJobTitle(location.state.jobTitle);
    }
    if (location.state?.locationMessage) {
      setLocationMessage(location.state.locationMessage);
    }
  }, [location.state]);

  // Use the feature credit check hook for checking credits only (no deduction)
  const {
    hasCredits,
    showInsufficientCreditsPopup
  } = useFeatureCreditCheck({
    feature: 'COMPANY_ROLE_ANALYSIS',
    onSuccess: () => {
      console.log('Credit check passed for company analysis');
    },
    onInsufficientCredits: () => {
      console.log('Insufficient credits for company analysis');
    }
  });

  // Clear results when component mounts (page refresh/navigation)
  useEffect(() => {
    setShowRecentResults(false);
  }, []);

  // Use cached company analysis hook for instant data display
  const {
    data: analysisHistory,
    isLoading: historyLoading,
    isShowingCachedData,
    connectionIssue,
    refetch: refetchHistory
  } = useCachedCompanyAnalyses();
  const handleManualRefresh = () => {
    window.location.reload();
  };

  // Enhanced helper function to check if analysis has meaningful data
  const hasAnalysisResult = (analysis: CompanyRoleAnalysisData) => {
    return !!(analysis.research_date || analysis.local_role_market_context || analysis.company_news_updates && analysis.company_news_updates.length > 0 || analysis.role_security_score !== null && analysis.role_security_score !== undefined || analysis.role_security_score_breakdown && analysis.role_security_score_breakdown.length > 0 || analysis.role_security_outlook || analysis.role_security_automation_risks || analysis.role_security_departmental_trends || analysis.role_experience_score !== null && analysis.role_experience_score !== undefined || analysis.role_experience_score_breakdown && analysis.role_experience_score_breakdown.length > 0 || analysis.role_experience_specific_insights || analysis.role_compensation_analysis || analysis.role_workplace_environment || analysis.career_development || analysis.role_specific_considerations || analysis.interview_and_hiring_insights || analysis.sources);
  };

  // Check for completed analysis when data is fetched or pendingAnalysisId changes
  useEffect(() => {
    if (!pendingAnalysisId || !analysisHistory) return;
    console.log('Checking for completed analysis with ID:', pendingAnalysisId);

    // Find the pending analysis in the fetched data
    const completedAnalysis = analysisHistory.find(analysis => analysis.id === pendingAnalysisId && hasAnalysisResult(analysis));
    if (completedAnalysis) {
      console.log('Found completed analysis, showing results');
      setPendingAnalysisId(null);
      setIsSubmitting(false);
      setLoadingMessages([]);
      setShowRecentResults(true);
      toast({
        title: "Analysis Complete!",
        description: "Your company analysis is ready to view. Credits will be deducted automatically."
      });
    }
  }, [analysisHistory, pendingAnalysisId, toast]);

  // Real-time subscription for analysis updates with enhanced detection
  useEffect(() => {
    if (!userProfile?.id || !pendingAnalysisId || !isAuthReady) return;
    console.log('Setting up real-time subscription for analysis:', pendingAnalysisId);
    
    let cleanupFn: (() => void) | null = null;
    
    const setupSubscription = async () => {
      await executeWithRetry(async () => {
        const channel = supabase.channel('company-analysis-updates').on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'company_role_analyses',
          filter: `id=eq.${pendingAnalysisId}`
        }, payload => {
          console.log('Real-time update received for company analysis:', payload);

          // Enhanced detection - check if the updated record has meaningful data
          const updatedData = payload.new as CompanyRoleAnalysisData;
          if (updatedData && hasAnalysisResult(updatedData)) {
            console.log('Meaningful analysis data detected via real-time, refreshing data and showing results');

            // Analysis has meaningful data, refresh and show results immediately
            refetchHistory().then(() => {
              // Set showRecentResults to true after data is refreshed
              setShowRecentResults(true);
              setPendingAnalysisId(null);
              setIsSubmitting(false);
              setLoadingMessages([]);
              toast({
                title: "Analysis Complete!",
                description: "Your company analysis is ready to view. Credits will be deducted automatically."
              });
            });
          } else {
            console.log('Real-time update received but no meaningful data yet, continuing to wait...');
          }
        }).subscribe();
        
        cleanupFn = () => {
          console.log('Cleaning up real-time subscription');
          supabase.removeChannel(channel);
        };
      }, 3, 'setup real-time subscription');
    };
    
    setupSubscription();
    
    return () => {
      if (cleanupFn) {
        cleanupFn();
      }
    };
  }, [userProfile?.id, pendingAnalysisId, refetchHistory, isAuthReady, executeWithRetry, toast]);

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

    // Check auth readiness first
    if (!isAuthReady) {
      toast({
        title: "Preparing Authentication",
        description: "Please wait while we prepare your session...",
        variant: "default"
      });
      return;
    }

    // Check credits before proceeding
    if (!hasCredits) {
      showInsufficientCreditsPopup();
      return;
    }
    if (!userProfile?.id) {
      toast({
        title: "Profile Required",
        description: "Please complete your profile before generating company-role analysis.",
        variant: "destructive"
      });
      return;
    }
    if (!companyName.trim() || !locationField.trim() || !jobTitle.trim()) {
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
        location: locationField.trim(),
        job_title: jobTitle.trim()
      });
      const data = await executeWithRetry(async () => {
        const {
          data,
          error
        } = await supabase.from('company_role_analyses').insert({
          user_id: userProfile.id,
          company_name: companyName.trim(),
          location: locationField.trim(),
          job_title: jobTitle.trim()
        }).select().single();
        if (error) throw error;
        return data;
      }, 3, 'create company role analysis');
      console.log('Company analysis created successfully:', data);

      // Set pending analysis ID to track real-time updates
      setPendingAnalysisId(data.id);
      toast({
        title: "Analysis Started",
        description: "Your company-role analysis is being generated. Credits will be deducted when results are ready."
      });

      // Reset form
      setCompanyName('');
      setLocationField('');
      setJobTitle('');

      // Refetch history to show the new analysis
      await executeWithRetry(async () => {
        refetchHistory();
      }, 2, 'refetch analysis history');
    } catch (error) {
      console.error('Error submitting company-role analysis:', error);
      toast({
        title: "Error",
        description: "Please refresh the page to continue",
        variant: "destructive"
      });
      setIsSubmitting(false);
    }
  };
  const handleReset = () => {
    setCompanyName('');
    setLocationField('');
    setJobTitle('');
    setLocationMessage('');
  };

  // Get the most recent completed analysis for display
  const recentCompletedAnalysis = showRecentResults && analysisHistory && analysisHistory.length > 0 ? analysisHistory.find(analysis => hasAnalysisResult(analysis)) : null;
  // Show loading state while auth is preparing
  if (!isAuthReady) {
    return <Layout>
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-green-500 mx-auto" />
          <div className="text-lg text-white font-orbitron">Preparing authentication...</div>
          <div className="text-sm text-gray-400">Setting up secure access to your company analysis</div>
        </div>
      </div>
    </Layout>;
  }
  return <Layout>
      <div className="min-h-screen bg-black px-2 pt-2 pb-2 sm:px-4 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
          {/* Header Section */}
          <div className="text-center space-y-3 sm:space-y-4 px-2 relative">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <h1 className="sm:text-3xl lg:text-4xl font-orbitron bg-gradient-to-r from-green-400 via-green-500 to-green-600 bg-clip-text text-green-500 text-4xl font-bold">
                🏢 Company Decoder
              </h1>
            </div>
            <p className="text-base sm:text-lg text-white max-w-3xl mx-auto leading-relaxed font-light px-2">
              Smart candidates don't just apply—they investigate. Get the career intelligence that puts you ahead of 99% of applicants.
            </p>
            
            {/* Manual Refresh Button */}
            {connectionIssue && <Button onClick={handleManualRefresh} variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-gray-800/50 h-8 w-8 p-0 absolute top-0 right-4" title="Refresh page">
                <RefreshCw className="h-4 w-4" />
              </Button>}
            
            {/* Usage Cost Badge */}
            <Badge variant="outline" className="bg-green-900/30 border-green-600/50 text-green-300 font-semibold">
              Usage Fee: 3 credits
            </Badge>
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
                    <p className="text-green-100 font-medium mt-2 text-left text-sm sm:text-sm">Enter company details to uncover hidden red flags and green lights — including insights on company news, job security, salary ranges, workplace culture, and interview experiences.</p>
                  </div>
                  <Button onClick={() => setIsHistoryOpen(true)} variant="outline" className="w-full sm:w-auto border-white/50 font-orbitron text-sm sm:text-base flex-shrink-0 bg-zinc-50 text-zinc-950">
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
                        🏭 Company Name *
                      </Label>
                      <Input id="companyName" type="text" placeholder="e.g., Google, Microsoft, Amazon" value={companyName} onChange={e => setCompanyName(e.target.value)} required className="border-green-300 text-white placeholder:text-gray-500 focus:border-green-500 focus:ring-green-500/20 h-10 sm:h-12 w-full text-sm sm:text-base bg-zinc-950" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location" className="text-white font-medium flex items-center gap-2 text-sm sm:text-base">
                        📍Location *
                      </Label>
                      <Input id="location" type="text" placeholder={locationMessage || "e.g., San Francisco, New York, Remote"} value={locationField} onChange={e => setLocationField(e.target.value)} required className="border-green-300 text-white placeholder:text-gray-500 focus:border-green-500 focus:ring-green-500/20 h-10 sm:h-12 w-full text-sm sm:text-base bg-zinc-950" />
                    </div>
                  </div>

                  {/* Job Title */}
                  <div className="space-y-2">
                    <Label htmlFor="jobTitle" className="text-white font-medium flex items-center gap-2 text-sm sm:text-base">
                      👨🏼‍💻 Job Title *
                    </Label>
                    <Input id="jobTitle" type="text" placeholder="e.g., Senior Software Engineer, Product Manager, Data Scientist" value={jobTitle} onChange={e => setJobTitle(e.target.value)} required className="border-green-300 text-white placeholder:text-gray-500 focus:border-green-500 focus:ring-green-500/20 h-10 sm:h-12 w-full text-sm sm:text-base bg-zinc-950" />
                  </div>

                  {/* Action Buttons - Desktop: same line, Mobile: stacked */}
                  <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 pt-2 sm:pt-4">
                    <Button type="submit" disabled={isSubmitting || !companyName.trim() || !locationField.trim() || !jobTitle.trim()} className="w-full lg:flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-4 sm:py-6 text-xs sm:text-base transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">
                      {isSubmitting ? <>
                          <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                          Analyzing Company & Role...
                        </> : <>
                          <Building2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                          Generate Company Analysis
                        </>}
                    </Button>
                    
                    <Button type="button" variant="outline" onClick={handleReset} className="w-full lg:w-auto border-white/50 text-white hover:text-white font-orbitron py-3 sm:py-4 text-sm sm:text-base lg:px-6 bg-emerald-950 hover:bg-emerald-800">
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reset                   
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Loading Messages - Updated with better contrast and premium styling */}
          {isSubmitting && pendingAnalysisId && <div className="space-y-4 px-2">
              <Card className="bg-gradient-to-br from-slate-900/95 via-gray-900/95 to-black/95 border-green-400/40 shadow-2xl backdrop-blur-sm">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative">
                      <Loader2 className="w-8 h-8 animate-spin text-green-400" />
                      <div className="absolute inset-0 rounded-full border-2 border-green-400/20 animate-pulse"></div>
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-orbitron font-bold text-white mb-1">
                        Analyzing Your Company & Role
                      </h3>
                      <p className="text-green-300 text-sm sm:text-base">
                        Advanced AI processing in progress...
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {loadingMessages.map((message, index) => <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-400/20">
                        <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                        <span className="text-white font-medium text-sm sm:text-base tracking-wide">
                          {message}
                        </span>
                      </div>)}
                  </div>
                  <div className="mt-6 w-full bg-gray-800/50 rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-400 to-emerald-400 rounded-full animate-pulse"></div>
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