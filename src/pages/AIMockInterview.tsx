
import { Layout } from "@/components/Layout";
import AIMockInterviewForm from "@/components/AIMockInterviewForm";
import { Button } from "@/components/ui/button";
import { RefreshCw, History, DollarSign } from "lucide-react";
import { useState, useEffect } from "react";
import { useCachedGraceInterviewRequests } from "@/hooks/useCachedGraceInterviewRequests";
import GraceInterviewReportsModal from "@/components/GraceInterviewReportsModal";
import { AIInterviewPricingModal } from "@/components/AIInterviewPricingModal";
import { useLocation } from "react-router-dom";
import { useEnhancedTokenManagerIntegration } from "@/hooks/useEnhancedTokenManagerIntegration";
import { useMinimalTokenManager } from "@/hooks/useMinimalTokenManager";

const AIMockInterview = () => {
  const location = useLocation();
  
  // Initialize enterprise session management with minimal token manager
  const sessionManager = useEnhancedTokenManagerIntegration({ enabled: true });
  const minimalTokenManager = useMinimalTokenManager(true);
  
  const {
    connectionIssue,
    forceRefresh
  } = useCachedGraceInterviewRequests();
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [prefillData, setPrefillData] = useState<{
    companyName?: string;
    jobTitle?: string;
    jobDescription?: string;
  }>({});

  // Auto-populate form data if passed via navigation state
  useEffect(() => {
    if (location.state?.companyName || location.state?.jobTitle || location.state?.jobDescription) {
      setPrefillData({
        companyName: location.state.companyName || '',
        jobTitle: location.state.jobTitle || '',
        jobDescription: location.state.jobDescription || ''
      });
      // Clear the navigation state after using it
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleManualRefresh = async () => {
    console.log('[AIMockInterview] Manual refresh initiated');
    
    // Clear all caches
    localStorage.removeItem('aspirely_user_profile_cache');
    localStorage.removeItem('aspirely_user_completion_status_cache');
    localStorage.removeItem('aspirely_ai_interview_credits_cache');
    
    // Force token refresh if session manager is available
    if (sessionManager?.refreshToken) {
      try {
        console.log('[AIMockInterview] Forcing token refresh during manual refresh');
        await sessionManager.refreshToken(true);
        console.log('[AIMockInterview] Token refreshed successfully');
      } catch (error) {
        console.error('[AIMockInterview] Token refresh failed during manual refresh:', error);
      }
    }
    
    // Force refresh cached data
    if (forceRefresh) {
      await forceRefresh();
    }
    
    // Full page reload as fallback
    window.location.reload();
  };

  return <Layout>
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-purple-950 text-white overflow-hidden">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-6 relative">
              <span className="text-5xl">📞</span>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent text-left">AI Mock Interview</h1>
              
              {/* Manual Refresh Button */}
              {connectionIssue && <Button onClick={handleManualRefresh} variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-gray-800/50 h-8 w-8 p-0 absolute right-0" title="Refresh page">
                  <RefreshCw className="h-4 w-4" />
                </Button>}
            </div>
            
            <h2 className="text-xl md:text-2xl text-gray-300 mb-4 leading-relaxed">Get a Mock Interview Phone Call from 👩🏻 Grace</h2>
            
            {/* Action Buttons */}
            <div className="mb-6 flex flex-wrap gap-3 justify-center">
              <Button onClick={() => setIsReportsModalOpen(true)} variant="outline" className="border-purple-500/30 transition-all duration-300 bg-violet-600 hover:bg-violet-500 text-slate-50">
                <History className="w-4 h-4 mr-2" />
                Reports
              </Button>
              <Button onClick={() => setIsPricingModalOpen(true)} variant="outline" className="border-green-500/30 transition-all duration-300 bg-green-600 hover:bg-green-500 text-slate-50">
                <DollarSign className="w-4 h-4 mr-2" />
                Pricing
              </Button>
            </div>
            
            <p className="text-gray-400 max-w-2xl mx-auto leading-relaxed text-left text-sm">Grace, your AI interview assistant from Aspirely AI, will call your phone in about a minute to ask real interview questions based on your job role — and you'll receive a detailed report right after the call.</p>
          </div>

          {/* Form Section */}
          <div className="flex justify-center">
            <div className="w-full max-w-lg">
              <AIMockInterviewForm 
                prefillData={prefillData} 
                sessionManager={sessionManager}
              />
            </div>
          </div>

          {/* Feature highlights */}
          <div className="mt-16 text-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              
              
              
              
            </div>
          </div>
        </div>

        {/* Reports Modal */}
        <GraceInterviewReportsModal isOpen={isReportsModalOpen} onClose={() => setIsReportsModalOpen(false)} />
        
        {/* Pricing Modal */}
        <AIInterviewPricingModal isOpen={isPricingModalOpen} onClose={() => setIsPricingModalOpen(false)} />
      </div>
    </Layout>;
};

export default AIMockInterview;
