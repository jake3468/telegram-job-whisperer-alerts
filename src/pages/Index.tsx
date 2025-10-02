
import AuthHeader from "@/components/AuthHeader";
import HeroSection from "@/components/HeroSection";
// import ComparisonSlider from "@/components/ComparisonSlider";

import AboutUsSection from "@/components/AboutUsSection";
import ToolsSection from "@/components/ToolsSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import PricingSection from "@/components/PricingSection";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";
// Temporarily disable SecurityHeaders for debugging
// import SecurityHeaders from "@/components/SecurityHeaders";
import { useEffect } from "react";
import { HeroSkeleton } from '@/components/ui/skeleton';
import { useProgressiveAuth } from '@/hooks/useProgressiveAuth';

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
  useEffect(() => {
    // Suppress external postMessage errors
    suppressExternalPostMessageErrors();
    
    // Add JSON-LD structured data for better Google crawlability
    const structuredDataScript = document.createElement('script');
    structuredDataScript.type = 'application/ld+json';
    structuredDataScript.innerHTML = JSON.stringify({
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
    
    document.head.appendChild(structuredDataScript);
    
    // Add CommonNinja widget script
    const commonNinjaScript = document.createElement('script');
    commonNinjaScript.src = 'https://cdn.commoninja.com/sdk/latest/commonninja.js';
    commonNinjaScript.defer = true;
    document.head.appendChild(commonNinjaScript);
    
    return () => {
      document.head.removeChild(structuredDataScript);
      if (commonNinjaScript.parentNode) {
        document.head.removeChild(commonNinjaScript);
      }
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
      <div className="w-full flex justify-center pt-20">
        <div className="commonninja_component pid-c9427851-f03d-4316-86f8-0c6f703560f2" style={{ maxWidth: '200px', transform: 'scale(0.9)' }}></div>
      </div>
      <HeroSection />
      <AboutUsSection />
      <ToolsSection />
      <HowItWorksSection />
      <div id="pricing">
        <PricingSection />
      </div>
      <div id="faq">
        <FAQSection />
      </div>
      <Footer />
    </div>
  );
};

export default Index;
