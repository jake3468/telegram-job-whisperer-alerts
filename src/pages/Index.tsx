
import AuthHeader from "@/components/AuthHeader";
import HeroSection from "@/components/HeroSection";
import JobTrackerPreview from "@/components/JobTrackerPreview";
import AboutUsSection from "@/components/AboutUsSection";
import ToolsSection from "@/components/ToolsSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import PricingSection from "@/components/PricingSection";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";
import { usePagePerformance } from "@/hooks/usePagePerformance";
import { useAnimationPreloader } from "@/services/animationPreloader";
// Temporarily disable SecurityHeaders for debugging
// import SecurityHeaders from "@/components/SecurityHeaders";
import { useEffect } from "react";

const Index = () => {
  const { preloadLowPriority } = useAnimationPreloader();
  usePagePerformance('Landing Page');

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
    
    // Preload low priority animations after page is fully loaded
    const timer = setTimeout(() => {
      preloadLowPriority();
    }, 3000);
    
    return () => {
      document.head.removeChild(script);
      clearTimeout(timer);
    };
  }, [preloadLowPriority]);

  return (
    <div className="min-h-screen bg-black font-inter text-slate-50">
      {/* <SecurityHeaders /> - Temporarily disabled for debugging */}
      <AuthHeader />
      <HeroSection />
      <JobTrackerPreview />
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
