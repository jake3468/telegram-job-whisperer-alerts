
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { useClerkSupabaseSync } from "@/hooks/useClerkSupabaseSync";
import { useAuth } from "@clerk/clerk-react";
import { useEffect } from "react";
import { useEnhancedTokenManagerIntegration } from "@/hooks/useEnhancedTokenManagerIntegration";
import { useLocation } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useThemeColor } from "@/hooks/useThemeColor";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import Index from "./pages/Index";
import JobGuide from "./pages/JobGuide";
import CoverLetter from "./pages/CoverLetter";
import LinkedInPosts from "./pages/LinkedInPosts";
import InterviewPrep from "./pages/InterviewPrep";
import CompanyRoleAnalysis from "./pages/CompanyRoleAnalysis";
import Profile from "./pages/Profile";

import JobAlerts from "./pages/JobAlerts";
import GetMoreCredits from "./pages/GetMoreCredits";
import JobTracker from "./pages/JobTracker";
import JobBoard from "./pages/JobBoard";
import AIMockInterview from "./pages/AIMockInterview";
import Upgrade from "./pages/Upgrade";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CookiePolicy from "./pages/CookiePolicy";
import TermsOfService from "./pages/TermsOfService";
import ContactSupport from "./pages/ContactSupport";
import Blogs from "./pages/Blogs";
import BlogPost from "./pages/BlogPost";
import AIAgents from "./pages/AIAgents";
import Ebook from "./pages/Ebook";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// No longer needed - removed blocking initial loader

// Component to initialize Clerk-Supabase sync
const AppWithSync = () => {
  const { isLoaded } = useAuth();
  const location = useLocation();
  
  // Initialize sync in background without blocking UI
  useClerkSupabaseSync();
  useThemeColor();
  
  // Skip enterprise features for job-alerts page to prevent debug messages
  const shouldUseEnterpriseFeatures = !location.pathname.includes('/job-alerts');
  
  // Enable enterprise session manager for better token management
  useEnhancedTokenManagerIntegration({
    enabled: shouldUseEnterpriseFeatures && isLoaded
  });
  
  // Render immediately - no blocking auth check
  
  return (
    <>
      <CookieConsentBanner />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Index />} />
        <Route path="/blogs" element={<Blogs />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/cookie-policy" element={<CookiePolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/contact-support" element={<ContactSupport />} />
        <Route path="/ebook-jobs-that-will-vanish-by-2030" element={<Ebook />} />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={<Navigate to="/ai-agents" replace />} />
        <Route path="/job-guide" element={<ProtectedRoute><JobGuide /></ProtectedRoute>} />
        <Route path="/cover-letter" element={<ProtectedRoute><CoverLetter /></ProtectedRoute>} />
        <Route path="/linkedin-posts" element={<ProtectedRoute><LinkedInPosts /></ProtectedRoute>} />
        <Route path="/interview-prep" element={<ProtectedRoute><InterviewPrep /></ProtectedRoute>} />
        <Route path="/company-role-analysis" element={<ProtectedRoute><CompanyRoleAnalysis /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/ai-agents" element={<ProtectedRoute><AIAgents /></ProtectedRoute>} />
        
        <Route path="/job-alerts" element={<ProtectedRoute><JobAlerts /></ProtectedRoute>} />
        <Route path="/get-more-credits" element={<ProtectedRoute><GetMoreCredits /></ProtectedRoute>} />
        <Route path="/job-board" element={<ProtectedRoute><JobBoard /></ProtectedRoute>} />
        <Route path="/job-tracker" element={<ProtectedRoute><JobTracker /></ProtectedRoute>} />
        <Route path="/ai-mock-interview" element={<ProtectedRoute><AIMockInterview /></ProtectedRoute>} />
        <Route path="/upgrade" element={<ProtectedRoute><Upgrade /></ProtectedRoute>} />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange={false}
        >
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppWithSync />
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
};

export default App;
