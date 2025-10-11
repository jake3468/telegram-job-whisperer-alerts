
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
import { Environment } from '@/utils/environment';

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
    // Silently ignore unrecognized origins to avoid console spam
  }, false);
};

const Index = () => {
  const { shouldRender, showSkeleton } = useProgressiveAuth();
  
  // Track scroll depth for all sections
  useScrollTracking();
  
  useEffect(() => {
    // Suppress external postMessage errors
    suppressExternalPostMessageErrors();
    
    // Filter console noise in development/preview environments
    if (Environment.isLovablePreview() || Environment.isDevelopment()) {
      const originalWarn = console.warn.bind(console);
      const originalError = console.error.bind(console);

      const shouldSilence = (firstArg: any) => {
        if (typeof firstArg !== 'string') return false;
        return (
          firstArg.includes('Unrecognized postMessage origin') ||
          (firstArg.includes('postMessage') && firstArg.includes('lovable.app')) ||
          firstArg.includes('Understand this warning')
        );
      };

      console.warn = (...args: any[]) => {
        if (shouldSilence(args[0])) return;
        originalWarn(...args);
      };
      console.error = (...args: any[]) => {
        if (shouldSilence(args[0])) return;
        originalError(...args);
      };

      // Cleanup function to restore original console methods
      return () => {
        console.warn = originalWarn;
        console.error = originalError;
      };
    }
    
    // Add JSON-LD structured data for better Google crawlability
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.innerHTML = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Aspirely AI",
      "url": window.location.origin,
      "description": "Find jobs faster with Aspirely AI. Get AI job alerts, resume and cover letter tools, and interview preparation - a complete AI job search experience",
      "privacyPolicy": `${window.location.origin}/privacy-policy`,
      "termsOfService": `${window.location.origin}/terms-of-service`,
      "publisher": {
        "@type": "Organization",
        "name": "Aspirely AI",
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
      
      {/* Elfsight Testimonials Slider */}
      <section className="relative py-8 bg-background">
        <div className="max-w-7xl mx-auto z-20 relative w-full px-4">
          <div className="elfsight-app-4951d48f-0df4-4724-a25f-ace7b5dfeb22" data-elfsight-app-lazy></div>
        </div>
      </section>
      
      <ComparisonTable />
      <HowItWorksSection />
      <PricingSection />
      <FAQSection />
      <Footer />
    </div>
  );
};

export default Index;
