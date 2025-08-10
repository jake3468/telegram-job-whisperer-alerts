import { SignedIn, SignedOut, SignUpButton } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import Lottie from 'lottie-react';
import { lazy, Suspense } from 'react';

// Lazy load particles for performance
const Particles = lazy(() => import('./Particles'));

// Preload rocket animation immediately when module loads
const ROCKET_ANIMATION_URL = 'https://fnzloyyhzhrqsvslhhri.supabase.co/storage/v1/object/public/animations//Businessman%20flies%20up%20with%20rocket.json';
const CACHE_KEY = 'rocket-animation-data-v1';

// Start loading animation data immediately
const rocketAnimationPromise = (async () => {
  try {
    // Check cache first
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
    
    // Fetch with high priority
    const response = await fetch(ROCKET_ANIMATION_URL, {
      cache: 'force-cache',
      priority: 'high'
    } as RequestInit);
    const animationData = await response.json();
    
    // Cache for next time
    localStorage.setItem(CACHE_KEY, JSON.stringify(animationData));
    return animationData;
  } catch (error) {
    console.error('Failed to preload rocket animation:', error);
    return null;
  }
})();
const HeroSection = () => {
  const navigate = useNavigate();
  const {
    user,
    isLoaded
  } = useUser();
  const [lottieAnimationData, setLottieAnimationData] = useState(null);
  const [showParticles, setShowParticles] = useState(false);
  const fullText = 'AI finds your next job while you sleep';
  useEffect(() => {
    if (isLoaded && user) {
      navigate('/dashboard');
    }
  }, [user, isLoaded, navigate]);

  // Load Lottie animation using preloaded promise
  useEffect(() => {
    const loadAnimation = async () => {
      try {
        const animationData = await rocketAnimationPromise;
        if (animationData) {
          setLottieAnimationData(animationData);
        }
      } catch (error) {
        console.error('Failed to load rocket animation:', error);
      } finally {
        // Always show particles
        setShowParticles(true);
      }
    };
    
    loadAnimation();
  }, []);
  const goToDashboard = () => {
    navigate('/dashboard');
  };
  return <section className="relative min-h-[60vh] sm:min-h-[70vh] flex flex-col items-center justify-center px-4 pt-20 sm:pt-24 pb-2 overflow-hidden bg-black">
      {/* Animated Cosmic Stars Background - Lazy Loaded */}
      {showParticles && <div className="absolute top-0 left-0 right-0 h-[60%] sm:h-[65%] md:h-[70%] z-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 pointer-events-none z-10" />
          <Suspense fallback={null}>
            <Particles particleColors={['#ffffff', '#ffffff']} particleCount={500} particleSpread={8} speed={0.08} particleBaseSize={80} moveParticlesOnHover={false} alphaParticles={false} disableRotation={false} />
          </Suspense>
        </div>}
      <div className="absolute inset-0 z-10 bg-black/20" aria-hidden="true" />
      
      <div className="text-center max-w-4xl mx-auto z-20 relative">
        {/* Premium Badge */}
        <div className="mb-3">
          <span className="inline-flex items-center px-3 py-1 text-xs font-medium bg-white/10 text-white rounded-full backdrop-blur-sm border border-white/20">
            🌟 Premium AI Career Platform
          </span>
        </div>
        
        {/* Paint Brush Background Container */}
        <div className="relative inline-block">
          {/* Blue Paint Brush Effect */}
          <div className="absolute inset-0 z-15 before:content-[''] before:absolute before:inset-[-20px] before:bg-gradient-to-r before:from-cyan-400/40 before:via-blue-500/50 before:to-blue-600/40 before:rounded-[50px_40px_60px_30px] before:transform before:rotate-[-2deg] before:blur-[1px] before:z-[-1]"></div>
          
          <h1 className="relative z-25 text-3xl md:text-5xl lg:text-6xl font-bold mb-1 leading-tight font-playfair tracking-tight text-white drop-shadow-2xl animate-fade-in [text-shadow:_0_0_40px_rgba(255,255,255,0.5)]">
            {fullText}
          </h1>
        </div>
        
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
          <span className="text-sm font-playfair font-medium text-white drop-shadow-lg">Powered by</span>
          <div className="flex items-center">
            <img alt="AI Services - OpenAI, Claude, and Perplexity" className="h-8 object-contain hover:scale-110 transition-transform duration-200" loading="lazy" src="/lovable-uploads/061e42ad-45f4-4e4c-b642-9efff932bddd.png" />
          </div>
        </div>

        <p className="text-white mb-4 md:mb-6 lg:mb-8 max-w-2xl mx-auto font-poppins font-light leading-relaxed drop-shadow-lg md:text-base text-sm [text-shadow:_0_1px_2px_rgba(0,0,0,0.8)] text-center">
          Perfect job matches delivered to your{' '}
          <span className="font-bold italic bg-gradient-to-r from-[#00D4FF] to-[#0099FF] bg-clip-text text-transparent drop-shadow-md [text-shadow:_0_0_10px_rgba(0,212,255,0.8)]">Telegram</span>
          {' '}like personal messages.{' '}
          <span className="font-bold italic bg-gradient-to-r from-[#00FF88] to-[#00CC66] bg-clip-text text-transparent drop-shadow-md [text-shadow:_0_0_10px_rgba(0,255,136,0.8)]">One click</span>
          {' '}gets you custom resumes, cover letters, interview prep, company insights, and visa sponsorship info.{' '}
          <span className="font-bold italic bg-gradient-to-r from-[#FF44FF] to-[#DD22DD] bg-clip-text text-transparent drop-shadow-md [text-shadow:_0_0_10px_rgba(255,68,255,0.8)]">Premium dashboard</span>
          {' '}included. Apply anywhere,{' '}
          <span className="font-bold italic bg-gradient-to-r from-[#FFDD00] to-[#FFAA00] bg-clip-text text-transparent drop-shadow-md [text-shadow:_0_0_10px_rgba(255,221,0,0.8)]">fully prepared</span>
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
        <p className="mt-2 font-inter drop-shadow shadow-black text-emerald-300 text-xs">No credit card required. Start with 30 free credits.</p>
      </div>
    </section>;
};
export default HeroSection;