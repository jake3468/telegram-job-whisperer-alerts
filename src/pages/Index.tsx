
import AuthHeader from "@/components/AuthHeader";
import HeroSection from "@/components/HeroSection";
import JobTrackerPreview from "@/components/JobTrackerPreview";
import LazySection from "@/components/LazySection";
// Temporarily disable SecurityHeaders for debugging
// import SecurityHeaders from "@/components/SecurityHeaders";
import { useEffect, lazy, Suspense } from "react";

// Lazy load non-critical sections
const AboutUsSection = lazy(() => import("@/components/AboutUsSection"));
const ToolsSection = lazy(() => import("@/components/ToolsSection"));
const HowItWorksSection = lazy(() => import("@/components/HowItWorksSection"));
const PricingSection = lazy(() => import("@/components/PricingSection"));
const FAQSection = lazy(() => import("@/components/FAQSection"));
const Footer = lazy(() => import("@/components/Footer"));

const Index = () => {
  useEffect(() => {
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

  return (
    <div className="min-h-screen bg-black font-inter text-slate-50">
      {/* <SecurityHeaders /> - Temporarily disabled for debugging */}
      <AuthHeader />
      <HeroSection />
      <JobTrackerPreview />
      
      <LazySection>
        <AboutUsSection />
      </LazySection>
      
      <LazySection>
        <ToolsSection />
      </LazySection>
      
      <LazySection>
        <HowItWorksSection />
      </LazySection>
      
      <LazySection>
        <div id="pricing">
          <PricingSection />
        </div>
      </LazySection>
      
      <LazySection>
        <div id="faq">
          <FAQSection />
        </div>
      </LazySection>
      
      <LazySection>
        <Footer />
      </LazySection>
    </div>
  );
};

export default Index;
