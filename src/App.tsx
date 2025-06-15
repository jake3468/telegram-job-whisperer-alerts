import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useClerkSupabaseSync } from "@/hooks/useClerkSupabaseSync";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import JobAlerts from "./pages/JobAlerts";
import JobGuide from "./pages/JobGuide";
import CoverLetter from "./pages/CoverLetter";
import LinkedInPosts from "./pages/LinkedInPosts";
import GetMoreCredits from "./pages/GetMoreCredits";
import Upgrade from "./pages/Upgrade";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  // Only sync Supabase/Clerk JWT after Clerk auth context is loaded
  // SignedIn ensures user is loaded; SignedOut keeps things safe for guests  
  return (
    <>
      <SignedIn>
        {useClerkSupabaseSync()}
      </SignedIn>
      {/* Main app routing */}
      <Routes>
        <Route path="/" element={<Index />} />
        {/* Dashboard routes now use the Layout component internally */}
        <Route path="/dashboard" element={<Profile />} />
        <Route path="/job-alerts" element={<JobAlerts />} />
        <Route path="/job-guide" element={<JobGuide />} />
        <Route path="/cover-letter" element={<CoverLetter />} />
        <Route path="/linkedin-posts" element={<LinkedInPosts />} />
        <Route path="/get-more-credits" element={<GetMoreCredits />} />
        <Route path="/upgrade" element={<Upgrade />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
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
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
