import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useClerkSupabaseSync } from "@/hooks/useClerkSupabaseSync";
import { useAuth } from "@clerk/clerk-react";
import { useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import JobGuide from "./pages/JobGuide";
import CoverLetter from "./pages/CoverLetter";
import LinkedInPosts from "./pages/LinkedInPosts";
import InterviewPrep from "./pages/InterviewPrep";
import CompanyRoleAnalysis from "./pages/CompanyRoleAnalysis";
import Profile from "./pages/Profile";
import ResumeBuilder from "./pages/ResumeBuilder";
import JobAlerts from "./pages/JobAlerts";
import GetMoreCredits from "./pages/GetMoreCredits";
import JobTracker from "./pages/JobTracker";
import JobBoard from "./pages/JobBoard";
import AIMockInterview from "./pages/AIMockInterview";
import Upgrade from "./pages/Upgrade";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import ContactSupport from "./pages/ContactSupport";
import Blogs from "./pages/Blogs";
import BlogPost from "./pages/BlogPost";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Function to hide the initial HTML loader
const hideInitialLoader = () => {
  const loader = document.getElementById('initial-loader');
  if (loader) {
    loader.classList.add('fade-out');
    setTimeout(() => {
      loader.remove();
    }, 300);
  }
};

// Fast loading component - much simpler than the initial one
const LoadingScreen = () => (
  <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-purple-950 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto mb-3"></div>
      <p className="text-white/80 text-sm">Initializing...</p>
    </div>
  </div>
);

// Component to initialize Clerk-Supabase sync
const AppWithSync = () => {
  const { isLoaded } = useAuth();
  
  // Initialize sync in background without blocking UI
  useClerkSupabaseSync();
  
  // Hide initial loader once React is ready
  useEffect(() => {
    // Use requestAnimationFrame for smoother transition
    const hideLoader = () => {
      if (isLoaded) {
        requestAnimationFrame(() => {
          hideInitialLoader();
        });
      }
    };
    
    hideLoader();
  }, [isLoaded]);
  
  // Show loading screen only while Clerk auth is loading
  // Once auth is loaded, show content immediately - don't wait for Supabase sync
  if (!isLoaded) {
    return <LoadingScreen />;
  }
  
  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Index />} />
        <Route path="/blogs" element={<Blogs />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/contact-support" element={<ContactSupport />} />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={<Navigate to="/profile" replace />} />
        <Route path="/job-guide" element={<ProtectedRoute><JobGuide /></ProtectedRoute>} />
        <Route path="/cover-letter" element={<ProtectedRoute><CoverLetter /></ProtectedRoute>} />
        <Route path="/linkedin-posts" element={<ProtectedRoute><LinkedInPosts /></ProtectedRoute>} />
        <Route path="/interview-prep" element={<ProtectedRoute><InterviewPrep /></ProtectedRoute>} />
        <Route path="/company-role-analysis" element={<ProtectedRoute><CompanyRoleAnalysis /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/resume-builder" element={<ProtectedRoute><ResumeBuilder /></ProtectedRoute>} />
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppWithSync />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
