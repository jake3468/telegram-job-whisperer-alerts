
import AuthHeader from "@/components/AuthHeader";
import HeroSection from "@/components/HeroSection";
import ToolsSection from "@/components/ToolsSection";
import PricingSection from "@/components/PricingSection";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-black font-inter text-slate-50">
      <AuthHeader />
      <HeroSection />
      <ToolsSection />
      <PricingSection />
      <FAQSection />
      <Footer />
    </div>
  );
};

export default Index;
