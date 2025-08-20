import { SignedIn, SignedOut, SignUpButton } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import Lottie from 'lottie-react';
import LightRays from './LightRays';
import { safeLocalStorage } from '@/utils/safeStorage';

// Animation URLs and cache keys
const ROCKET_ANIMATION_URL = 'https://fnzloyyhzhrqsvslhhri.supabase.co/storage/v1/object/public/animations//Businessman%20flies%20up%20with%20rocket.json';
const CACHE_KEY = 'rocket-animation-data-v1';
const TELEGRAM_ANIMATION_URL = 'https://fnzloyyhzhrqsvslhhri.supabase.co/storage/v1/object/public/animations/telegram%20logo.json';
const TELEGRAM_CACHE_KEY = 'telegram-animation-data-v1';

// Safe animation loading function (no module-level storage access)
const loadAnimationWithCache = async (url: string, cacheKey: string) => {
  try {
    // Check cache first using safe storage
    const cachedData = safeLocalStorage.getItem(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    // Fetch with high priority
    const response = await fetch(url, {
      cache: 'force-cache',
      priority: 'high'
    } as RequestInit);
    const animationData = await response.json();

    // Cache for next time using safe storage
    safeLocalStorage.setItem(cacheKey, JSON.stringify(animationData));
    return animationData;
  } catch (error) {
    console.error(`Failed to load animation from ${url}:`, error);
    return null;
  }
};
const HeroSection = () => {
  const navigate = useNavigate();
  const {
    user,
    isLoaded
  } = useUser();
  const [lottieAnimationData, setLottieAnimationData] = useState(null);
  const [telegramAnimationData, setTelegramAnimationData] = useState(null);
  const fullText = 'AI finds your next job while you sleep';
  useEffect(() => {
    if (isLoaded && user) {
      navigate('/dashboard');
    }
  }, [user, isLoaded, navigate]);

  // Load Lottie animations safely without module-level storage access
  useEffect(() => {
    const loadAnimations = async () => {
      try {
        const [rocketData, telegramData] = await Promise.all([
          loadAnimationWithCache(ROCKET_ANIMATION_URL, CACHE_KEY),
          loadAnimationWithCache(TELEGRAM_ANIMATION_URL, TELEGRAM_CACHE_KEY)
        ]);
        if (rocketData) {
          setLottieAnimationData(rocketData);
        }
        if (telegramData) {
          setTelegramAnimationData(telegramData);
        }
      } catch (error) {
        console.error('Failed to load animations:', error);
      }
    };
    loadAnimations();
  }, []);
  const goToDashboard = () => {
    navigate('/dashboard');
  };
  return <section className="relative min-h-[60vh] sm:min-h-[70vh] flex flex-col items-center justify-center px-4 pt-20 sm:pt-24 pb-0 overflow-hidden bg-black">
      {/* Light rays background animation with responsive length for mobile */}
      <div className="absolute inset-0 z-0">
        <LightRays raysOrigin="top-center" raysColor="#00ffff" raysSpeed={1.5} lightSpread={0.8} rayLength={window.innerWidth < 768 ? 6.0 : 4.0} fadeDistance={window.innerWidth < 768 ? 5.0 : 3.0} followMouse={true} mouseInfluence={0.1} noiseAmount={0.1} distortion={0.05} className="w-full h-full" />
      </div>
      <div className="absolute inset-0 z-10 bg-black/20" aria-hidden="true" />
      
      <div className="text-center max-w-4xl mx-auto z-20 relative">
        {/* Trust Badge */}
        <div className="mb-3">
          <div className="inline-flex items-center px-1 py-0.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-[10px] font-medium">
            <span className="text-transparent" style={{
            color: 'initial'
          }}>🛡️</span>
            <span className="text-white ml-1">Trusted by 1000+ Professionals</span>
          </div>
        </div>
        
        {/* Black background to block particles behind headline */}
        <div className="relative">
          <div className="absolute inset-0 bg-black/80 rounded-lg blur-sm z-10 transform scale-110"></div>
          <h1 className="relative z-30 text-3xl md:text-5xl lg:text-6xl font-bold mb-1 leading-tight font-sans tracking-tight text-white drop-shadow-2xl animate-fade-in [text-shadow:_0_0_40px_rgba(255,255,255,0.5)] italic">Get <span className="italic">Jobs</span> faster using AI Agents 🎯</h1>
        </div>
        
        {/* Lottie Animation */}
        {lottieAnimationData && <div className="flex justify-center mt-2 mb-4">
            <div className="relative w-40 h-40 md:w-52 md:h-52 lg:w-64 lg:h-64">
              <Lottie animationData={lottieAnimationData} loop={true} autoplay={true} className="w-full h-full z-10 relative" style={{
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

        <div className="text-zinc-50 mb-4 md:mb-6 lg:mb-8 max-w-2xl mx-auto font-gilroy font-light leading-relaxed drop-shadow-2xl md:text-base text-sm [text-shadow:_0_2px_4px_rgba(0,0,0,0.9)] text-center [filter:brightness(1.1)_contrast(1.1)]">
          <p className="mb-3">Meet 3 AI Agents built to simplify your job hunting. Just click to start using them on Telegram 👇:</p>
          <ul className="space-y-0 mb-4 flex flex-col items-center -space-y-1">
            <li className="flex items-center justify-center gap-2">
              <a href="https://t.me/add_job_aspirelyai_bot" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-all duration-200 cursor-pointer flex items-center gap-2">
                <span className="text-xl">👔</span>
                <span className="italic text-[#00E5FF] drop-shadow-md [text-shadow:_0_0_10px_rgba(0,229,255,0.8)]">Job Application Agent</span>
                {telegramAnimationData && <div className="w-12 h-12 ml-1">
                    <Lottie animationData={telegramAnimationData} loop={true} autoplay={true} style={{
                  width: '100%',
                  height: '100%'
                }} />
                  </div>}
              </a>
            </li>
            <li className="flex items-center justify-center gap-2">
              <a href="https://t.me/Job_AI_update_bot" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-all duration-200 cursor-pointer flex items-center gap-2">
                <span className="text-xl">🔔</span>
                <span className="italic text-[#00FF85] drop-shadow-md [text-shadow:_0_0_10px_rgba(0,255,133,0.8)]">Job Alerts Agent</span>
                {telegramAnimationData && <div className="w-12 h-12 ml-1">
                    <Lottie animationData={telegramAnimationData} loop={true} autoplay={true} style={{
                  width: '100%',
                  height: '100%'
                }} />
                  </div>}
              </a>
            </li>
            <li className="flex items-center justify-center gap-2">
              <a href="https://t.me/Resume_builder_AI_bot" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-all duration-200 cursor-pointer flex items-center gap-2">
                <span className="text-xl">📝</span>
                <span className="italic text-[#FF4FFF] drop-shadow-md [text-shadow:_0_0_10px_rgba(255,79,255,0.8)]">Resume Builder Agent</span>
                {telegramAnimationData && <div className="w-12 h-12 ml-1">
                    <Lottie animationData={telegramAnimationData} loop={true} autoplay={true} style={{
                  width: '100%',
                  height: '100%'
                }} />
                  </div>}
              </a>
            </li>
          </ul>
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