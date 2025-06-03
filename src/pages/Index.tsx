
import AuthHeader from "@/components/AuthHeader";
import HeroSection from "@/components/HeroSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import PreferencesSection from "@/components/PreferencesSection";
import SignupSection from "@/components/SignupSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-black font-inter">
      <AuthHeader />
      <HeroSection />
      <HowItWorksSection />
      <PreferencesSection />
      <SignupSection />
      <Footer />
    </div>
  );
};

export default Index;
