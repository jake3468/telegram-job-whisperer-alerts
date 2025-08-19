import { SignedIn, SignedOut, SignUpButton } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import Lottie from 'lottie-react';
import LightRays from './LightRays';

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
      }
    };
    loadAnimation();
  }, []);
  const goToDashboard = () => {
    navigate('/dashboard');
  };
  return <section className="relative min-h-[60vh] sm:min-h-[70vh] flex flex-col items-center justify-center px-4 pt-20 sm:pt-24 pb-0 overflow-hidden bg-black">
      {/* Light rays background animation with responsive length for mobile */}
      <div className="absolute inset-0 z-0">
        <LightRays
          raysOrigin="top-center"
          raysColor="#00ffff"
          raysSpeed={1.5}
          lightSpread={0.8}
          rayLength={window.innerWidth < 768 ? 6.0 : 4.0}
          fadeDistance={window.innerWidth < 768 ? 5.0 : 3.0}
          followMouse={true}
          mouseInfluence={0.1}
          noiseAmount={0.1}
          distortion={0.05}
          className="w-full h-full"
        />
      </div>
      <div className="absolute inset-0 z-10 bg-black/20" aria-hidden="true" />
      
      <div className="text-center max-w-4xl mx-auto z-20 relative">
        {/* Trust Badge */}
        <div className="mb-3">
          <div className="inline-flex items-center px-1 py-0.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-[10px] font-medium">
            <span className="text-transparent" style={{ color: 'initial' }}>🛡️</span>
            <span className="text-white ml-1">Trusted by 1000+ Professionals</span>
          </div>
        </div>
        
        {/* Black background to block particles behind headline */}
        <div className="relative">
          <div className="absolute inset-0 bg-black/80 rounded-lg blur-sm z-10 transform scale-110"></div>
          <h1 className="relative z-30 text-3xl md:text-5xl lg:text-6xl font-bold mb-1 leading-tight font-sans tracking-tight text-white drop-shadow-2xl animate-fade-in [text-shadow:_0_0_40px_rgba(255,255,255,0.5)]">Get <span className="italic">Jobs</span> faster using AI Agents 🎯</h1>
        </div>
        
        {/* Lottie Animation */}
        {lottieAnimationData && <div className="flex justify-center mt-2 mb-4">
            <div className="relative w-40 h-40 md:w-52 md:h-52 lg:w-64 lg:h-64">
              <Lottie 
                animationData={lottieAnimationData} 
                loop={true} 
                autoplay={true} 
                className="w-full h-full z-10 relative"
                style={{
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
                }} 
              />
            </div>
          </div>}
        
        {/* AI Services Badges - Combined Image */}
        <div className="flex justify-center items-center gap-3 mb-4 md:mb-6 opacity-90">
          <span className="text-sm font-playfair font-medium text-white drop-shadow-lg">Powered by</span>
          <div className="flex items-center">
            <img alt="AI Services - OpenAI, Claude, and Perplexity" className="h-8 object-contain hover:scale-110 transition-transform duration-200" loading="lazy" src="/lovable-uploads/061e42ad-45f4-4e4c-b642-9efff932bddd.png" />
          </div>
        </div>

        <div className="text-zinc-50 mb-4 md:mb-6 lg:mb-8 max-w-2xl mx-auto font-gilroy font-light leading-relaxed drop-shadow-2xl md:text-base text-sm [text-shadow:_0_2px_4px_rgba(0,0,0,0.9)] text-center [filter:brightness(1.1)_contrast(1.1)]">
          <p className="mb-3">We have 3 AI agents (click to access via Telegram):</p>
          <ul className="space-y-1 mb-4">
            <li>
              <a 
                href="https://t.me/add_job_aspirelyai_bot" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:scale-105 transition-all duration-200 cursor-pointer underline decoration-dotted underline-offset-4 decoration-cyan-400/60 hover:decoration-cyan-400 hover:bg-white/5 px-2 py-1 rounded-lg"
              >
                <span className="text-xl">👔</span>
                <span className="italic bg-gradient-to-r from-[#00D4FF] to-[#0099FF] bg-clip-text text-transparent drop-shadow-md [text-shadow:_0_0_10px_rgba(0,212,255,0.8)] hover:from-[#00E4FF] hover:to-[#00A9FF] transition-all duration-200">Job Application Agent</span>
                <span className="text-xs text-cyan-400/80 ml-1">→ Telegram</span>
              </a>
            </li>
            <li>
              <a 
                href="https://t.me/Job_AI_update_bot" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:scale-105 transition-all duration-200 cursor-pointer underline decoration-dotted underline-offset-4 decoration-green-400/60 hover:decoration-green-400 hover:bg-white/5 px-2 py-1 rounded-lg"
              >
                <span className="text-xl">🔔</span>
                <span className="italic bg-gradient-to-r from-[#00FF88] to-[#00CC66] bg-clip-text text-transparent drop-shadow-md [text-shadow:_0_0_10px_rgba(0,255,136,0.8)] hover:from-[#00FF98] hover:to-[#00DC76] transition-all duration-200">Job Alerts Agent</span>
                <span className="text-xs text-green-400/80 ml-1">→ Telegram</span>
              </a>
            </li>
            <li>
              <a 
                href="https://t.me/Resume_builder_AI_bot" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:scale-105 transition-all duration-200 cursor-pointer underline decoration-dotted underline-offset-4 decoration-purple-400/60 hover:decoration-purple-400 hover:bg-white/5 px-2 py-1 rounded-lg"
              >
                <span className="text-xl">📝</span>
                <span className="italic bg-gradient-to-r from-[#FF44FF] to-[#DD22DD] bg-clip-text text-transparent drop-shadow-md [text-shadow:_0_0_10px_rgba(255,68,255,0.8)] hover:from-[#FF54FF] hover:to-[#ED32ED] transition-all duration-200">Resume Builder Agent</span>
                <span className="text-xs text-purple-400/80 ml-1">→ Telegram</span>
              </a>
            </li>
          </ul>
          <p>One-click insights and prep. Premium dashboard included.</p>
        </div>
        
        <SignedOut>
          <div className="flex justify-center">
            <SignUpButton mode="modal">
              <button className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-700 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 text-base sm:text-lg rounded-lg transition-all duration-300 font-inter font-semibold shadow-lg hover:shadow-purple-500/40 transform hover:scale-105 z-30 relative focus:outline-none focus:ring-4 focus:ring-purple-400/50 mb-2 flex items-center gap-2 justify-center">
                ✨ Try for Free
              </button>
            </SignUpButton>
          </div>
          <p className="text-white/80 text-sm font-medium mt-2 mb-0 font-sans">
            It's 100% free to start. No credit card required!
          </p>
        </SignedOut>
        <SignedIn>
          <button onClick={goToDashboard} className="bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600 hover:from-sky-600 hover:to-blue-700 text-white px-12 py-4 text-lg sm:text-xl rounded-xl transition-all duration-300 font-inter font-bold shadow-2xl drop-shadow-xl hover:shadow-sky-500/60 transform hover:scale-105 z-30 relative focus:outline-none focus:ring-4 focus:ring-sky-400/50 mb-2">
            Go to Dashboard
          </button>
        </SignedIn>
        
      </div>
    </section>;
};
export default HeroSection;