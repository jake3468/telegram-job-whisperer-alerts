
import AuthHeader from "@/components/AuthHeader";
import HeroSection from "@/components/HeroSection";
import JobTrackerPreview from "@/components/JobTrackerPreview";
import AboutUsSection from "@/components/AboutUsSection";
import ToolsSection from "@/components/ToolsSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import PricingSection from "@/components/PricingSection";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";
import SecurityHeaders from "@/components/SecurityHeaders";

const Index = () => {
  // JSON-LD structured data for Google verification
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Aspirely.ai",
    "description": "AI-powered career platform for finding and creating your perfect career path with advanced job matching and personalized guidance.",
    "url": typeof window !== 'undefined' ? window.location.origin : "",
    "privacyPolicy": typeof window !== 'undefined' ? `${window.location.origin}/privacy-policy` : "",
    "termsOfService": typeof window !== 'undefined' ? `${window.location.origin}/terms-of-service` : ""
  };

  return (
    <div className="min-h-screen bg-black font-inter text-slate-50">
      {/* Structured Data for Google verification */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <SecurityHeaders />
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
