
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

  // const scrollToSignup = () => { // This function is not used currently
  //   const signupSection = document.getElementById('signup-section');
  //   signupSection?.scrollIntoView({ behavior: 'smooth' });
  // };

  const goToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <section className="min-h-screen bg-black bg-hero-glow bg-no-repeat bg-bottom flex items-center justify-center px-4 relative overflow-hidden">
      <div className="text-center max-w-4xl mx-auto z-10">
        <h1 className="text-5xl md:text-7xl font-semibold text-white mb-6 leading-tight font-inter">
          Jobbots
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-2xl mx-auto font-inter font-light leading-relaxed">
          Your AI-Powered Co-Pilot for Navigating the Job Market and Landing Your Dream Role.
        </p>
        
        <SignedOut>
          <SignUpButton mode="modal">
            <button className="bg-sky-600 hover:bg-sky-700 text-white px-10 py-4 text-lg rounded-lg transition-all duration-300 font-inter font-medium shadow-lg hover:shadow-sky-500/30">
              Get Started Free
            </button>
          </SignUpButton>
        </SignedOut>
        
        <SignedIn>
          <button onClick={goToDashboard} className="bg-sky-600 hover:bg-sky-700 text-white px-10 py-4 text-lg rounded-lg transition-all duration-300 font-inter font-medium shadow-lg hover:shadow-sky-500/30">
            Go to Dashboard
          </button>
        </SignedIn>
        
        <p className="text-gray-500 text-sm mt-6 font-inter">
          No credit card required. Unlock your potential today.
        </p>
      </div>
    </section>
  );
};

export default HeroSection;
