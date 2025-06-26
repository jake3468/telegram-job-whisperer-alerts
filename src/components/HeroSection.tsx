import { SignedIn, SignedOut, SignUpButton } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
const HeroSection = () => {
  const navigate = useNavigate();
  const {
    user,
    isLoaded
  } = useUser();
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const fullText = 'AI does the boring stuff.\nYou get the Job.';
  useEffect(() => {
    if (isLoaded && user) {
      navigate('/dashboard');
    }
  }, [user, isLoaded, navigate]);

  // Preload background image
  useEffect(() => {
    const img = new Image();
    img.onload = () => setIsImageLoaded(true);
    img.src = '/lovable-uploads/9f89bb0c-b59d-4e5a-8c4d-609218bee6d4.png';
  }, []);

  // Optimized typing animation effect
  useEffect(() => {
    if (currentIndex < fullText.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + fullText[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 60); // Slightly faster animation

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, fullText]);
  const goToDashboard = () => {
    navigate('/dashboard');
  };
  return <section className="relative min-h-[80vh] sm:min-h-screen flex flex-col items-center justify-center px-4 pt-28 sm:pt-32 overflow-hidden bg-black">
      {/* Optimized Background with loading state */}
      <div className={`absolute inset-0 z-0 pointer-events-none transition-opacity duration-500 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`} aria-hidden="true" style={{
      background: isImageLoaded ? `url('/lovable-uploads/9f89bb0c-b59d-4e5a-8c4d-609218bee6d4.png') center top / cover no-repeat` : 'transparent',
      maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)',
      WebkitMaskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)'
    }} />
      <div className="absolute inset-0 z-10 bg-black/60" aria-hidden="true" />
      
      <div className="text-center max-w-4xl mx-auto z-20 mt-10 sm:mt-0 relative">
        <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-2 leading-tight font-inter drop-shadow-xl min-h-[200px] sm:min-h-[240px]">
          {displayedText.split('\n').map((line, index) => <span key={index}>
              {line.split(' ').map((word, wordIndex) => {
            if (word === 'AI') {
              return <span key={wordIndex} className="italic font-extrabold bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent">
                      AI
                    </span>;
            } else if (word === 'boring') {
              return <span key={wordIndex} className="bg-gradient-to-r from-pink-400 to-yellow-300 bg-clip-text text-transparent">
                      {' boring'}
                    </span>;
            } else if (word === 'Job') {
              return <span key={wordIndex} className="italic font-extrabold bg-gradient-to-r from-blue-400 to-sky-500 bg-clip-text text-transparent">
                      {' Job'}
                    </span>;
            } else {
              return <span key={wordIndex}>{wordIndex === 0 ? word : ` ${word}`}</span>;
            }
          })}
              {index === 0 && <br className="hidden sm:block" />}
            </span>)}
          <span className="animate-pulse">|</span>
        </h1>
        
        {/* AI Services Badges - Combined Image */}
        <div className="flex justify-center items-center gap-3 mb-8 opacity-90">
          <span className="text-gray-300 text-sm font-inter font-medium">Powered by</span>
          <div className="flex items-center">
            <img alt="AI Services - OpenAI, Claude, and Perplexity" className="h-8 object-contain hover:scale-110 transition-transform duration-200" loading="lazy" src="/lovable-uploads/59b1dbc7-1bbb-458e-be1a-383aa51fde22.png" />
          </div>
        </div>

        <p className="text-lg md:text-xl text-gray-200 mb-12 max-w-2xl mx-auto font-inter font-light leading-relaxed drop-shadow shadow-black">
          Job hunting toolkit that writes your cover letter, preps you for interviews, and even pings you new jobs — all powered by{" "}
          <span className="italic bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent font-medium">
            AI
          </span>
          . Weirdly effective.
        </p>
        
        <SignedOut>
          <SignUpButton mode="modal">
            <button className="bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600 hover:from-sky-600 hover:to-blue-700 text-white px-12 py-4 text-lg sm:text-xl rounded-xl transition-all duration-300 font-inter font-bold shadow-2xl drop-shadow-xl hover:shadow-sky-500/60 transform hover:scale-105 z-30 relative focus:outline-none focus:ring-4 focus:ring-sky-400/50 mb-2">
              Get Started Free
            </button>
          </SignUpButton>
        </SignedOut>
        <SignedIn>
          <button onClick={goToDashboard} className="bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600 hover:from-sky-600 hover:to-blue-700 text-white px-12 py-4 text-lg sm:text-xl rounded-xl transition-all duration-300 font-inter font-bold shadow-2xl drop-shadow-xl hover:shadow-sky-500/60 transform hover:scale-105 z-30 relative focus:outline-none focus:ring-4 focus:ring-sky-400/50 mb-2">
            Go to Dashboard
          </button>
        </SignedIn>
        <p className="text-gray-400 text-sm mt-10 font-inter drop-shadow shadow-black">
          No credit card required. Start with 30 free credits today.
        </p>
      </div>
    </section>;
};
export default HeroSection;