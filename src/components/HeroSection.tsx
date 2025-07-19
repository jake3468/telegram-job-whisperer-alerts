import { SignedIn, SignedOut, SignUpButton } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import Lottie from 'lottie-react';
const HeroSection = () => {
  const navigate = useNavigate();
  const {
    user,
    isLoaded
  } = useUser();
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [lottieAnimationData, setLottieAnimationData] = useState(null);
  const fullText = 'Tired of LinkedIn and Indeed?\nThink you\'re ready for interviews? Let an AI call your phone for 10 minutes and prove you wrong.';
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

  // Load Lottie animation
  useEffect(() => {
    const loadLottieAnimation = async () => {
      try {
        const response = await fetch('https://fnzloyyhzhrqsvslhhri.supabase.co/storage/v1/object/public/animations//Businessman%20flies%20up%20with%20rocket.json');
        const animationData = await response.json();
        setLottieAnimationData(animationData);
      } catch (error) {
        console.error('Failed to load Lottie animation:', error);
      }
    };
    loadLottieAnimation();
  }, []);

  const goToDashboard = () => {
    navigate('/dashboard');
  };
  return <section className="relative min-h-[60vh] sm:min-h-[70vh] flex flex-col items-center justify-center px-4 pt-20 sm:pt-24 pb-2 overflow-hidden bg-black">
      {/* Optimized Background with loading state */}
      <div className={`absolute inset-0 z-0 pointer-events-none transition-opacity duration-500 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`} aria-hidden="true" style={{
      background: isImageLoaded ? `url('/lovable-uploads/9f89bb0c-b59d-4e5a-8c4d-609218bee6d4.png') center top / cover no-repeat` : 'transparent',
      maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)',
      WebkitMaskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)'
    }} />
      <div className="absolute inset-0 z-10 bg-black/60" aria-hidden="true" />
      
      <div className="text-center max-w-4xl mx-auto z-20 relative">
        <h1 className="text-2xl md:text-4xl font-extrabold text-white mb-1 leading-tight font-inter drop-shadow-xl">
          {fullText.split('\n').map((line, index) => 
            <span key={index}>
              {line.split(' ').map((word, wordIndex) => {
                const cleanWord = word.replace(/[.,]/g, ''); // Remove punctuation for matching
                const punctuation = word.match(/[.,]/g)?.[0] || '';
                
                if (cleanWord === 'LinkedIn' || cleanWord === 'Indeed') {
                  return <span key={wordIndex} className="italic font-extrabold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                          {wordIndex === 0 ? cleanWord : ` ${cleanWord}`}{punctuation}
                        </span>;
                } else if (cleanWord === 'AI') {
                  return <span key={wordIndex} className="italic font-extrabold bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent">
                          {wordIndex === 0 ? 'AI' : ' AI'}{punctuation}
                        </span>;
                } else if (cleanWord === 'interviews') {
                  return <span key={wordIndex} className="italic bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-transparent">
                          {wordIndex === 0 ? 'interviews' : ' interviews'}{punctuation}
                        </span>;
                } else if (cleanWord === 'wrong') {
                  return <span key={wordIndex} className="italic font-extrabold bg-gradient-to-r from-red-400 to-orange-500 bg-clip-text text-transparent">
                          {wordIndex === 0 ? 'wrong' : ' wrong'}{punctuation}
                        </span>;
                } else {
                  return <span key={wordIndex}>{wordIndex === 0 ? word : ` ${word}`}</span>;
                }
              })}
              {index === 0 && <br className="hidden sm:block" />}
            </span>
          )}
        </h1>
        
        {/* Lottie Animation */}
        {lottieAnimationData && <div className="flex justify-center mt-2 mb-4">
            <div className="w-40 h-40 md:w-52 md:h-52 lg:w-64 lg:h-64">
              <Lottie animationData={lottieAnimationData} loop={true} autoplay={true} style={{
            width: '100%',
            height: '100%',
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
          }} />
            </div>
          </div>}
        
        {/* AI Services Badges - Combined Image */}
        <div className="flex justify-center items-center gap-3 mb-4 md:mb-6 opacity-90">
          <span className="text-gray-300 text-sm font-inter font-medium">Powered by</span>
          <div className="flex items-center">
            <img alt="AI Services - OpenAI, Claude, and Perplexity" className="h-8 object-contain hover:scale-110 transition-transform duration-200" loading="lazy" src="/lovable-uploads/061e42ad-45f4-4e4c-b642-9efff932bddd.png" />
          </div>
        </div>

        <p className="md:text-xl text-gray-200 mb-4 md:mb-6 lg:mb-8 max-w-2xl mx-auto font-inter font-light leading-relaxed drop-shadow shadow-black text-sm">
          No robotic voices. No scripts. Just a human-sounding AI that interviews you like a real recruiter and tells you exactly where you fail.
          <br />
          Then build powerful resumes, decode company fit, and track jobs — all in one brutally honest platform that actually helps you get hired.
        </p>
        
        <SignedOut>
          <div className="flex justify-center">
            <SignUpButton mode="modal">
              <button className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-700 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 text-base sm:text-lg rounded-lg transition-all duration-300 font-inter font-semibold shadow-lg hover:shadow-purple-500/40 transform hover:scale-105 z-30 relative focus:outline-none focus:ring-4 focus:ring-purple-400/50 mb-2 flex items-center gap-2 justify-center">
                ✨ Start Now for Free
              </button>
            </SignUpButton>
          </div>
        </SignedOut>
        <SignedIn>
          <button onClick={goToDashboard} className="bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600 hover:from-sky-600 hover:to-blue-700 text-white px-12 py-4 text-lg sm:text-xl rounded-xl transition-all duration-300 font-inter font-bold shadow-2xl drop-shadow-xl hover:shadow-sky-500/60 transform hover:scale-105 z-30 relative focus:outline-none focus:ring-4 focus:ring-sky-400/50 mb-2">
            Go to Dashboard
          </button>
        </SignedIn>
        <p className="text-gray-400 text-sm mt-2 font-inter drop-shadow shadow-black">
          No credit card required. Start with 30 free credits today.
        </p>
      </div>
    </section>;
};
export default HeroSection;