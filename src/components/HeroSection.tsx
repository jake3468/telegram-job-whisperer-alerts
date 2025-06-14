
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
    <section className="relative min-h-[80vh] sm:min-h-screen flex flex-col items-center justify-center px-4 pt-28 sm:pt-32 overflow-hidden bg-black">
      {/* Background Gradient Image */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background: `url('/lovable-uploads/9f89bb0c-b59d-4e5a-8c4d-609218bee6d4.png') center top / cover no-repeat`,
          maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)',
        }}
      />
      <div className="absolute inset-0 z-10 bg-black/60" aria-hidden="true" />
      {/* (Logo & Site Name REMOVED from here, now only in header) */}
      <div className="text-center max-w-4xl mx-auto z-20 mt-10 sm:mt-0 relative">
        <h1 className="text-4xl md:text-6xl font-semibold text-white mb-6 leading-tight font-inter drop-shadow-md">
          <span className="text-highlight">AI</span> does the <span className="text-highlight">boring</span> stuff.
          <br className="hidden sm:block" /> You get the <span className="text-highlight">Job</span>.
        </h1>
        <p className="text-lg md:text-xl text-gray-200 mb-10 max-w-2xl mx-auto font-inter font-light leading-relaxed drop-shadow">
          Job hunting toolkit that writes your cover letter, preps you for interviews, and even pings you new jobs — all powered by <span className="text-highlight font-medium">AI</span>. Weirdly effective.
        </p>
        <SignedOut>
          <SignUpButton mode="modal">
            <button className="bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white px-10 py-4 text-lg rounded-lg transition-all duration-300 font-inter font-medium shadow-lg hover:shadow-sky-500/40 transform hover:scale-105 z-30 relative">
              Get Started Free
            </button>
          </SignUpButton>
        </SignedOut>
        <SignedIn>
          <button
            onClick={goToDashboard}
            className="bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white px-10 py-4 text-lg rounded-lg transition-all duration-300 font-inter font-medium shadow-lg hover:shadow-sky-500/40 transform hover:scale-105 z-30 relative"
          >
            Go to Dashboard
          </button>
        </SignedIn>
        <p className="text-gray-400 text-sm mt-8 font-inter drop-shadow">
          No credit card required. Unlock your potential today.
        </p>
      </div>
    </section>
  );
};
export default HeroSection;
