
import AuthHeader from "@/components/AuthHeader";
import HeroSection from "@/components/HeroSection";
// import HowItWorksSection from "@/components/HowItWorksSection"; // Removed
// import PreferencesSection from "@/components/PreferencesSection"; // Removed
import ToolsSection from "@/components/ToolsSection"; // Added
import SignupSection from "@/components/SignupSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-black font-inter text-slate-50"> {/* Ensured base text color is light */}
      <AuthHeader />
      <HeroSection />
      <ToolsSection /> {/* Replaced HowItWorksSection and PreferencesSection */}
      <SignupSection />
      <Footer />
    </div>
  );
};

export default Index;
