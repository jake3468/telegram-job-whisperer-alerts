
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useClerkSupabaseSync } from "@/hooks/useClerkSupabaseSync";
import Index from "./pages/Index";
import JobGuide from "./pages/JobGuide";
import CoverLetter from "./pages/CoverLetter";
import LinkedInPosts from "./pages/LinkedInPosts";
import CompanyRoleAnalysis from "./pages/CompanyRoleAnalysis";
import InterviewPrep from "./pages/InterviewPrep";
import Profile from "./pages/Profile";
import ResumeBuilder from "./pages/ResumeBuilder";
import JobAlerts from "./pages/JobAlerts";
import GetMoreCredits from "./pages/GetMoreCredits";
import Upgrade from "./pages/Upgrade";
import NotFound from "./pages/NotFound";
import "./App.css";

const queryClient = new QueryClient();

function App() {
  // CRITICAL: This hook syncs Clerk JWT with Supabase for RLS to work
  useClerkSupabaseSync();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/job-guide" element={<JobGuide />} />
            <Route path="/cover-letter" element={<CoverLetter />} />
            <Route path="/linkedin-posts" element={<LinkedInPosts />} />
            <Route path="/company-role-analysis" element={<CompanyRoleAnalysis />} />
            <Route path="/interview-prep" element={<InterviewPrep />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/resume-builder" element={<ResumeBuilder />} />
            <Route path="/job-alerts" element={<JobAlerts />} />
            <Route path="/get-more-credits" element={<GetMoreCredits />} />
            <Route path="/upgrade" element={<Upgrade />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
