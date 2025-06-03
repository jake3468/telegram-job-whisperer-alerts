
import { SignedIn, SignedOut, SignUpButton } from '@clerk/clerk-react';

const HeroSection = () => {
  const scrollToSignup = () => {
    const signupSection = document.getElementById('signup-section');
    signupSection?.scrollIntoView({
      behavior: 'smooth'
    });
  };

  return (
    <section className="min-h-screen bg-black flex items-center justify-center px-4 relative">
      <div className="text-center max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-semibold text-white mb-6 leading-tight font-inter">
          Build Your Perfect<br />
          <span className="bg-gradient-to-r from-pastel-blue to-pastel-mint bg-clip-text text-transparent">Telegram Job Alert</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto font-inter font-light leading-relaxed">
          Sign up, upload your resume, and get matched jobs sent directly via Telegram with custom resumes and cover letters.
        </p>
        
        <SignedOut>
          <SignUpButton mode="modal">
            <button className="bg-transparent border-2 border-white text-white px-8 py-4 text-lg rounded-xl hover:bg-white hover:text-black transition-all duration-200 font-inter font-medium">
              Get Started Now
            </button>
          </SignUpButton>
        </SignedOut>
        
        <SignedIn>
          <button onClick={scrollToSignup} className="bg-transparent border-2 border-white text-white px-8 py-4 text-lg rounded-xl hover:bg-white hover:text-black transition-all duration-200 font-inter font-medium">
            Set Up Your Preferences
          </button>
        </SignedIn>
        
        <p className="text-gray-500 text-sm mt-4 font-inter">
          No credit card required. It's free to start.
        </p>
      </div>
    </section>
  );
};

export default HeroSection;
