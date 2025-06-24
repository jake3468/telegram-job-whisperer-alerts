
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useClerkSupabaseSync } from "@/hooks/useClerkSupabaseSync";
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
import Upgrade from "./pages/Upgrade";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Component to initialize Clerk-Supabase sync
const AppWithSync = () => {
  // This hook MUST be called to sync Clerk JWT with Supabase
  useClerkSupabaseSync();
  
  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/dashboard" element={<Navigate to="/profile" replace />} />
        <Route path="/job-guide" element={<JobGuide />} />
        <Route path="/cover-letter" element={<CoverLetter />} />
        <Route path="/linkedin-posts" element={<LinkedInPosts />} />
        <Route path="/interview-prep" element={<InterviewPrep />} />
        <Route path="/company-role-analysis" element={<CompanyRoleAnalysis />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/resume-builder" element={<ResumeBuilder />} />
        <Route path="/job-alerts" element={<JobAlerts />} />
        <Route path="/get-more-credits" element={<GetMoreCredits />} />
        <Route path="/upgrade" element={<Upgrade />} />
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
