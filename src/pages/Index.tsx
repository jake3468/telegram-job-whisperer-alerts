
import AuthHeader from "@/components/AuthHeader";
import HeroSection from "@/components/HeroSection";
// import ComparisonSlider from "@/components/ComparisonSlider";

import AboutUsSection from "@/components/AboutUsSection";
import ToolsSection from "@/components/ToolsSection";
import ComparisonTable from "@/components/ComparisonTable";
import HowItWorksSection from "@/components/HowItWorksSection";
import PricingSection from "@/components/PricingSection";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";
// Temporarily disable SecurityHeaders for debugging
// import SecurityHeaders from "@/components/SecurityHeaders";
import { useEffect } from "react";
import { HeroSkeleton } from '@/components/ui/skeleton';
import { useProgressiveAuth } from '@/hooks/useProgressiveAuth';
import { useScrollTracking } from '@/hooks/useScrollTracking';

// Global postMessage error handler to suppress external service errors
const suppressExternalPostMessageErrors = () => {
  window.addEventListener('message', (event) => {
    // List of known external origins that might cause postMessage errors
    const allowedOrigins = [
      'https://startupfa.me',
      'https://findly.tools', 
      'https://turbo0.com',
      'https://twelve.tools',
      'https://fazier.com'
    ];
    
    // Only suppress errors from known external services
    if (!allowedOrigins.some(origin => event.origin.includes(origin))) {
      console.warn('Unrecognized postMessage origin:', event.origin);
    }
  }, false);
};

const Index = () => {
  const { shouldRender, showSkeleton } = useProgressiveAuth();
  
  // Track scroll depth for all sections
  useScrollTracking();
  
  useEffect(() => {
    // Suppress external postMessage errors
    suppressExternalPostMessageErrors();
    
    // Add JSON-LD structured data for better Google crawlability
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.innerHTML = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Aspirely.ai",
      "url": window.location.origin,
      "description": "The AI-powered platform for finding and creating your perfect career path with advanced job matching and personalized guidance.",
      "privacyPolicy": `${window.location.origin}/privacy-policy`,
      "termsOfService": `${window.location.origin}/terms-of-service`,
      "publisher": {
        "@type": "Organization",
        "name": "Aspirely.ai",
        "url": window.location.origin
      }
    });
    
    document.head.appendChild(script);
    
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // Show skeleton only during very brief auth loading
  if (showSkeleton) {
    return <HeroSkeleton />;
  }

  // Render immediately for professional experience
  return (
    <div className="min-h-screen bg-background font-inter text-foreground">
      <AuthHeader />
      <HeroSection />
      <AboutUsSection />
      <ToolsSection />
      <ComparisonTable />
      <HowItWorksSection />
      <PricingSection />
      <FAQSection />
      <Footer />
    </div>
  );
};

export default Index;
