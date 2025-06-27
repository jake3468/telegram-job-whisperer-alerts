
import AuthHeader from "@/components/AuthHeader";
import HeroSection from "@/components/HeroSection";
import AboutUsSection from "@/components/AboutUsSection";
import ToolsSection from "@/components/ToolsSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import PricingSection from "@/components/PricingSection";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";
import SecurityHeaders from "@/components/SecurityHeaders";

const Index = () => {
  return (
    <div className="min-h-screen bg-black font-inter text-slate-50">
      <SecurityHeaders />
      <AuthHeader />
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
