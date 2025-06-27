import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from "@/components/ui/tooltip"
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";
import Home from "@/pages/Home";
import JobGuide from "@/pages/JobGuide";
import CoverLetter from "@/pages/CoverLetter";
import LinkedInPost from "@/pages/LinkedInPost";
import CompanyAnalysis from "@/pages/CompanyAnalysis";
import InterviewPrep from "@/pages/InterviewPrep";
import PricingPage from "@/pages/PricingPage";
import ProfilePage from "@/pages/ProfilePage";
import SecurityDashboardPage from "@/pages/SecurityDashboard";

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppLayout />} >
              <Route index element={<Home />} />
              <Route path="job-guide" element={<JobGuide />} />
              <Route path="cover-letter" element={<CoverLetter />} />
              <Route path="linkedin-post" element={<LinkedInPost />} />
              <Route path="company-analysis" element={<CompanyAnalysis />} />
              <Route path="interview-prep" element={<InterviewPrep />} />
              <Route path="pricing" element={<PricingPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>
            <Route path="/security-dashboard" element={<SecurityDashboardPage />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App
