import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/toaster";
import { useClerkSupabaseSync } from '@/hooks/useClerkSupabaseSync';
import Index from './pages/Index';
import Profile from './pages/Profile';
import JobGuide from './pages/JobGuide';
import CoverLetter from './pages/CoverLetter';
import LinkedInPosts from './pages/LinkedInPosts';
import InterviewPrep from './pages/InterviewPrep';
import CompanyRoleAnalysis from './pages/CompanyRoleAnalysis';
import JobAlerts from './pages/JobAlerts';
import GetMoreCredits from './pages/GetMoreCredits';
import ResumeBuilder from './pages/ResumeBuilder';
import Upgrade from './pages/Upgrade';
import NotFound from './pages/NotFound';
import './App.css';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

const queryClient = new QueryClient();

function AppContent() {
  useClerkSupabaseSync();
  
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/job-guide" element={<JobGuide />} />
      <Route path="/cover-letter" element={<CoverLetter />} />
      <Route path="/linkedin-posts" element={<LinkedInPosts />} />
      <Route path="/interview-prep" element={<InterviewPrep />} />
      <Route path="/company-role-analysis" element={<CompanyRoleAnalysis />} />
      <Route path="/job-alerts" element={<JobAlerts />} />
      <Route path="/get-more-credits" element={<GetMoreCredits />} />
      <Route path="/resume-builder" element={<ResumeBuilder />} />
      <Route path="/upgrade" element={<Upgrade />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <Router>
          <AppContent />
          <Toaster />
        </Router>
      </ClerkProvider>
    </QueryClientProvider>
  );
}

export default App;
