
import AuthHeader from "@/components/AuthHeader";
import HeroSection from "@/components/HeroSection";
import ComparisonSlider from "@/components/ComparisonSlider";
import JobTrackerPreview from "@/components/JobTrackerPreview";
import YouTubeShortPreview from "@/components/YouTubeShortPreview";
import AboutUsSection from "@/components/AboutUsSection";
import ToolsSection from "@/components/ToolsSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import PricingSection from "@/components/PricingSection";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";
// Temporarily disable SecurityHeaders for debugging
// import SecurityHeaders from "@/components/SecurityHeaders";
import { useEffect } from "react";

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
      <ComparisonSlider />
      <JobTrackerPreview />
      <YouTubeShortPreview />
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
