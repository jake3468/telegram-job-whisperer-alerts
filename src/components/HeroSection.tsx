import { SignedIn, SignedOut, SignUpButton } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import Lottie from 'lottie-react';
import LightRays from './LightRays';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import MobilePreview from './MobilePreview';

// Preload rocket animation immediately when module loads
const ROCKET_ANIMATION_URL = 'https://fnzloyyhzhrqsvslhhri.supabase.co/storage/v1/object/public/animations//Businessman%20flies%20up%20with%20rocket.json';
const CACHE_KEY = 'rocket-animation-data-v1';

// Preload telegram animation immediately when module loads
const TELEGRAM_ANIMATION_URL = 'https://fnzloyyhzhrqsvslhhri.supabase.co/storage/v1/object/public/animations/telegram%20logo.json';
const TELEGRAM_CACHE_KEY = 'telegram-animation-data-v1';

// Start loading rocket animation data immediately
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

// Start loading telegram animation data immediately
const telegramAnimationPromise = (async () => {
  try {
    // Check cache first
    const cachedData = localStorage.getItem(TELEGRAM_CACHE_KEY);
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    // Fetch with high priority
    const response = await fetch(TELEGRAM_ANIMATION_URL, {
      cache: 'force-cache',
      priority: 'high'
    } as RequestInit);
    const animationData = await response.json();

    // Cache for next time
    localStorage.setItem(TELEGRAM_CACHE_KEY, JSON.stringify(animationData));
    return animationData;
  } catch (error) {
    console.error('Failed to preload telegram animation:', error);
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
  const [telegramAnimationData, setTelegramAnimationData] = useState(null);
  const fullText = 'AI finds your next job while you sleep';
  useEffect(() => {
    if (isLoaded && user) {
      navigate('/dashboard');
    }
  }, [user, isLoaded, navigate]);

  // Load Lottie animations using preloaded promises
  useEffect(() => {
    const loadAnimations = async () => {
      try {
        const [rocketData, telegramData] = await Promise.all([rocketAnimationPromise, telegramAnimationPromise]);
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
  return <section className="relative min-h-[80vh] flex items-center justify-center px-4 pt-20 sm:pt-24 pb-8 overflow-hidden bg-black">
      {/* Light rays background animation with responsive length for mobile */}
      <div className="absolute inset-0 z-0">
        <LightRays raysOrigin="top-center" raysColor="#00ffff" raysSpeed={1.5} lightSpread={0.8} rayLength={window.innerWidth < 768 ? 6.0 : 4.0} fadeDistance={window.innerWidth < 768 ? 5.0 : 3.0} followMouse={true} mouseInfluence={0.1} noiseAmount={0.1} distortion={0.05} className="w-full h-full" />
      </div>
      <div className="absolute inset-0 z-10 bg-black/20" aria-hidden="true" />
      
      {/* Main Container with Grid Layout */}
      <div className="max-w-7xl mx-auto z-20 relative w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          
          {/* Mobile Preview - Shows on all screen sizes */}
          <div className="flex justify-center items-center mb-8 md:mb-0">
            <MobilePreview />
          </div>
          
          {/* Hero Content - Always center aligned */}
          <div className="text-center max-w-2xl mx-auto md:mx-0">
        
        {/* Black background to block particles behind headline */}
        <div className="relative">
          <div className="absolute inset-0 bg-black/80 rounded-lg blur-sm z-10 transform scale-110"></div>
          <h1 className="relative z-30 text-3xl md:text-5xl lg:text-6xl font-bold mb-1 leading-tight font-sans tracking-tight text-white drop-shadow-2xl animate-fade-in [text-shadow:_0_0_40px_rgba(255,255,255,0.5)] italic">
            <span className="block md:inline">Get job offers </span>
            <span className="block md:inline">
              <span className="inline-block bg-cyan-400 text-black px-2 py-1 rounded">faster</span>
              <span className="ml-2">using AI 🚀</span>
            </span>
          </h1>
        </div>
        
        {/* Lottie Animation - Rocket - Commented out for now */}
        {/* {lottieAnimationData && <div className="flex justify-center mt-2 mb-4">
            <div className="relative w-40 h-40 md:w-52 md:h-52 lg:w-64 lg:h-64">
              <Lottie animationData={lottieAnimationData} loop={true} autoplay={true} className="w-full h-full z-10 relative" style={{
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
          }} />
            </div>
          </div>} */}
        

        <div className="text-zinc-50 mb-4 md:mb-6 lg:mb-8 max-w-2xl mx-auto font-gilroy font-light leading-relaxed drop-shadow-2xl md:text-base text-sm [text-shadow:_0_2px_4px_rgba(0,0,0,0.9)] text-center [filter:brightness(1.1)_contrast(1.1)]">
          <p className="mb-4 text-sm md:text-base">Our AI Agents will update your <span className="font-bold italic text-cyan-400">Resume</span>, send daily <span className="font-bold italic text-cyan-400">Job Alerts</span>, craft tailored <span className="font-bold italic text-cyan-400">Cover Letters</span>, prepare <span className="font-bold italic text-cyan-400">Interview Kits</span>, check <span className="font-bold italic text-cyan-400">Job fit</span>, give insider <span className="font-bold italic text-cyan-400">Company</span> knowledge, and show the right <span className="font-bold italic text-cyan-400">HR contacts</span>. Everything you will ever need, all in one place.</p>
          
          <SignedOut>
            <div className="flex justify-center mb-6">
              <SignUpButton mode="modal">
                <button className="bg-[#F8F9FD] hover:bg-gray-100 text-black px-6 py-2 text-base sm:text-lg rounded-2xl transition-all duration-300 font-inter font-semibold shadow-lg hover:shadow-gray-300/40 transform hover:scale-105 z-30 relative focus:outline-none focus:ring-4 focus:ring-gray-400/50 mb-2 flex items-center gap-2 justify-center">
                  🎯 Start Free Now
                </button>
              </SignUpButton>
            </div>
            
            {/* Discount Badge */}
            <div className="flex justify-center mb-4">
              <div className="bg-green-400/20 border border-green-400/40 backdrop-blur-sm rounded-full px-3 py-1 shadow-lg shadow-green-400/20">
                <span className="text-green-300 text-xs font-medium [text-shadow:_0_0_10px_rgba(34,197,94,0.8)]">
                  Get 50% off with code "ASP123"
                </span>
              </div>
            </div>
            {/* Avatar Group with Rating */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="flex -space-x-2">
                <Avatar className="h-8 w-8 border-2 border-white">
                  <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face" alt="Remy Sharp" />
                  <AvatarFallback>RS</AvatarFallback>
                </Avatar>
                <Avatar className="h-8 w-8 border-2 border-white">
                  <AvatarImage src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face" alt="Travis Howard" />
                  <AvatarFallback>TH</AvatarFallback>
                </Avatar>
                <Avatar className="h-8 w-8 border-2 border-white">
                  <AvatarImage src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face" alt="Agnes Walker" />
                  <AvatarFallback>AW</AvatarFallback>
                </Avatar>
                <Avatar className="h-8 w-8 border-2 border-white">
                  <AvatarImage src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face" alt="Trevor Henderson" />
                  <AvatarFallback>TH</AvatarFallback>
                </Avatar>
              </div>
              
              <div className="flex flex-col items-start">
                <div className="flex text-yellow-400 mb-1">
                  <span>⭐⭐⭐⭐⭐</span>
                </div>
                <div className="text-white text-xs text-left">
                  <span className="font-bold">255+</span> <span className="italic">professionals winning while others struggle</span>
                </div>
              </div>
            </div>
          </SignedOut>

          <p className="mb-3 text-sm">After creating your account you'll unlock the most advanced AI Job Agents built to simplify your job hunting. Just click to start using them on Telegram 👇 :</p>
          <ul className="space-y-2 mb-4 flex flex-col items-center">
            <li className="flex items-center justify-center gap-2">
              <a href="https://t.me/add_job_aspirelyai_bot" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-all duration-200 cursor-pointer flex items-center gap-2 border border-white rounded-2xl px-2 py-1">
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
              <a href="https://t.me/Job_AI_update_bot" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-all duration-200 cursor-pointer flex items-center gap-2 border border-white rounded-2xl px-2 py-1">
                <span className="text-xl">🔔</span>
                <span className="italic text-[#00E5FF] drop-shadow-md [text-shadow:_0_0_10px_rgba(0,229,255,0.8)]">Job Alerts Agent</span>
                {telegramAnimationData && <div className="w-12 h-12 ml-1">
                    <Lottie animationData={telegramAnimationData} loop={true} autoplay={true} style={{
                  width: '100%',
                  height: '100%'
                }} />
                  </div>}
              </a>
            </li>
            <li className="flex items-center justify-center gap-2">
              <a href="https://t.me/Resume_builder_AI_bot" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-all duration-200 cursor-pointer flex items-center gap-2 border border-white rounded-2xl px-2 py-1">
                <span className="text-xl">📝</span>
                <span className="italic text-[#00E5FF] drop-shadow-md [text-shadow:_0_0_10px_rgba(0,229,255,0.8)]">Resume Builder Agent</span>
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
        
        <SignedIn>
          <button onClick={goToDashboard} className="bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600 hover:from-sky-600 hover:to-blue-700 text-white px-12 py-4 text-lg sm:text-xl rounded-xl transition-all duration-300 font-inter font-bold shadow-2xl drop-shadow-xl hover:shadow-sky-500/60 transform hover:scale-105 z-30 relative focus:outline-none focus:ring-4 focus:ring-sky-400/50 mb-2">
            Go to Dashboard
          </button>
        </SignedIn>
        
          </div>
        </div>
      </div>
    </section>;
};
export default HeroSection;