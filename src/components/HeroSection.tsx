
import { SignedIn, SignedOut, SignUpButton } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';

const HeroSection = () => {
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded && user) {
      navigate('/dashboard');
    }
  }, [user, isLoaded, navigate]);

  const goToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <section className="min-h-screen bg-black bg-hero-glow bg-no-repeat bg-bottom flex flex-col items-center justify-center px-4 relative overflow-hidden pt-16 sm:pt-20">
      {/* Logo and Site Name - Top Left */}
      <div className="absolute top-6 left-6 sm:top-8 sm:left-8 flex items-center space-x-3 z-20">
        <img src="/lovable-uploads/00756136-40e8-4357-b19a-582e8625b09d.png" alt="JobBots Logo" className="h-10 w-10 sm:h-12 sm:w-12" />
        <span className="text-2xl sm:text-3xl font-semibold text-white font-inter">JobBots</span>
      </div>

      <div className="text-center max-w-4xl mx-auto z-10 mt-10 sm:mt-0">
        <h1 className="text-4xl md:text-6xl font-semibold text-white mb-6 leading-tight font-inter">
          <span className="text-highlight">AI</span> does the boring stuff.
          <br className="hidden sm:block" /> You get the <span className="text-highlight">Job</span>.
        </h1>
        
        <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto font-inter font-light leading-relaxed">
          Job hunting toolkit that writes your cover letter, preps you for interviews, and even pings you new jobs — all powered by <span className="text-highlight font-medium">AI</span>. Weirdly effective.
        </p>
        
        <SignedOut>
          <SignUpButton mode="modal">
            <button className="bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white px-10 py-4 text-lg rounded-lg transition-all duration-300 font-inter font-medium shadow-lg hover:shadow-sky-500/40 transform hover:scale-105">
              Get Started Free
            </button>
          </SignUpButton>
        </SignedOut>
        
        <SignedIn>
          <button 
            onClick={goToDashboard} 
            className="bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white px-10 py-4 text-lg rounded-lg transition-all duration-300 font-inter font-medium shadow-lg hover:shadow-sky-500/40 transform hover:scale-105"
          >
            Go to Dashboard
          </button>
        </SignedIn>
        
        <p className="text-gray-500 text-sm mt-8 font-inter">
          No credit card required. Unlock your potential today.
        </p>
      </div>
    </section>
  );
};
export default HeroSection;
