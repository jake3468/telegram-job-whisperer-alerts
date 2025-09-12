import { SignedIn, SignedOut, SignUpButton } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import Lottie from 'lottie-react';
import LightRays from './LightRays';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { YouTubeHeroVideo } from '@/components/YouTubeHeroVideo';
import HandDrawnArrow from './HandDrawnArrow';

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
  return <>
    <section className="relative min-h-[80vh] flex items-center justify-center px-4 pt-20 sm:pt-24 pb-8 overflow-hidden bg-white dark:bg-black">
      {/* Light rays background animation - only in dark mode */}
      <div className="absolute inset-0 z-0 dark:block hidden">
        <LightRays raysOrigin="top-center" raysColor="#00ffff" raysSpeed={1.5} lightSpread={0.8} rayLength={window.innerWidth < 768 ? 6.0 : 4.0} fadeDistance={window.innerWidth < 768 ? 5.0 : 3.0} followMouse={true} mouseInfluence={0.1} noiseAmount={0.1} distortion={0.05} className="w-full h-full" />
      </div>
      <div className="absolute inset-0 z-10 bg-white/90 dark:bg-black/20" aria-hidden="true" />
      
      {/* Main Container with Grid Layout */}
      <div className="max-w-7xl mx-auto z-20 relative w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 items-center">
          
          {/* Hero Video - Centered in left side, aligned with hero text */}
          <div className="hidden md:flex justify-center items-start mb-8 md:mb-0 md:pr-8 md:-mt-8 lg:-mt-12">
            <YouTubeHeroVideo className="w-full max-w-xs" />
          </div>
          
          {/* Hero Content - Center aligned with mobile preview */}
          <div className="text-left max-w-2xl mx-auto md:mx-0 md:pl-4 flex flex-col justify-center mt-8 md:mt-0">
        
        {/* Background to block particles behind headline in dark mode */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-background/80 dark:bg-black/80 rounded-lg blur-sm z-10 transform scale-110"></div>
          <h1 className="relative z-30 text-3xl md:text-4xl lg:text-5xl mb-1 leading-none font-sans tracking-[-0.4px] text-foreground drop-shadow-2xl animate-fade-in dark:[text-shadow:_0_0_40px_rgba(255,255,255,0.5)] italic">
            {/* Mobile and Desktop view */}
            <div className="block md:hidden lg:block">
              <span className="text-black dark:text-white px-0.5 py-0 font-grotesk not-italic">Apply to Jobs</span>
              <br />
              <span className="text-black dark:text-white px-0.5 py-0 mt-2 md:mt-3 inline-block font-grotesk not-italic">like a <span className="font-bold">Pro</span> 😎...</span>
              <br />
              <span className="text-black dark:text-white px-0.5 py-0 mt-2 md:mt-3 inline-block font-grotesk not-italic">by just chatting</span>
              <br />
              <span className="text-black dark:text-white px-0.5 py-0 mt-2 md:mt-3 inline-block font-grotesk not-italic">on Telegram.</span>
            </div>
            
            {/* Tablet view only */}
            <div className="hidden md:block lg:hidden">
              <span className="text-black dark:text-white px-0.5 py-0 font-grotesk not-italic">Apply to Jobs</span>
              <br />
              <span className="text-black dark:text-white px-0.5 py-0 mt-2 md:mt-3 inline-block font-grotesk not-italic">like a <span className="font-bold">Pro</span> 😎...</span>
              <br />
              <span className="text-black dark:text-white px-0.5 py-0 mt-2 md:mt-3 inline-block font-grotesk not-italic">by just chatting</span>
              <br />
              <span className="text-black dark:text-white px-0.5 py-0 mt-2 md:mt-3 inline-block font-grotesk not-italic">on Telegram.</span>
            </div>
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
        

        <div className="text-foreground mb-8 md:mb-10 lg:mb-12 max-w-2xl mx-auto font-gilroy font-light leading-relaxed md:text-base text-sm dark:[text-shadow:_0_2px_4px_rgba(0,0,0,0.9)] text-left [filter:brightness(1.1)_contrast(1.1)]">
          <p className="mb-8 text-base md:text-lg font-inter">Our AI Agents will update your Resume, send daily Job Alerts, craft tailored Cover Letters, create Interview files, check Job fit, give insider Company knowledge, and shares the HRs you should contact. Everything you will ever need, all in one place.</p>
          
          <SignedOut>
            {/* Button and Badge Container */}
            <div className="flex flex-col items-start md:flex-col md:items-start lg:flex-row lg:items-center lg:justify-start gap-4 md:gap-6 mb-8">
              <SignUpButton mode="modal">
                <button className="bg-[#0075DE] hover:bg-[#0066C3] text-white dark:bg-[#0075DE] dark:hover:bg-[#0066C3] dark:text-white px-6 py-3 md:px-8 md:py-3 text-base md:text-lg rounded-lg transition-all duration-300 font-inter font-medium shadow-lg hover:shadow-primary/40 transform hover:scale-105 z-30 relative focus:outline-none focus:ring-4 focus:ring-[#0075DE]/20 flex items-center gap-2 justify-start md:justify-center w-auto border border-transparent">
                  Connect with Telegram
                </button>
              </SignUpButton>
              
              <p className="text-foreground text-sm italic mt-2 font-semibold">in just 5 seconds...</p>
              
              {/* Discount Badge */}
              {/* <div className="bg-white border border-green-600 dark:bg-green-900/30 dark:border-green-700 rounded-full px-4 py-2 md:px-4 md:py-2 w-auto text-left md:text-center">
                <span className="text-green-700 dark:text-green-300 text-xs md:text-sm font-semibold font-inter">
                  Get 50% off with code "ASP123"
                </span>
              </div> */}
            </div>
            {/* Avatar Group with Rating */}
            <div className="flex items-center justify-start gap-4 mb-6">
              <div className="flex -space-x-2">
                <Avatar className="h-8 w-8 border-2 border-white dark:border-white border-gray-300">
                  <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face" alt="Remy Sharp" />
                  <AvatarFallback>RS</AvatarFallback>
                </Avatar>
                <Avatar className="h-8 w-8 border-2 border-white dark:border-white border-gray-300">
                  <AvatarImage src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face" alt="Travis Howard" />
                  <AvatarFallback>TH</AvatarFallback>
                </Avatar>
                <Avatar className="h-8 w-8 border-2 border-white dark:border-white border-gray-300">
                  <AvatarImage src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face" alt="Agnes Walker" />
                  <AvatarFallback>AW</AvatarFallback>
                </Avatar>
                <Avatar className="h-8 w-8 border-2 border-white dark:border-white border-gray-300">
                  <AvatarImage src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face" alt="Trevor Henderson" />
                  <AvatarFallback>TH</AvatarFallback>
                </Avatar>
              </div>
              
              <div className="flex flex-col items-start">
                <div className="flex text-yellow-400 dark:text-yellow-400 mb-1 [text-shadow:_0_0_2px_rgba(0,0,0,0.8)] dark:[text-shadow:none]">
                  <span>⭐⭐⭐⭐⭐</span>
                </div>
                <div className="text-foreground text-sm text-left">
                  <span className="italic text-sm font-medium">Trusted by <span className="font-bold">300+</span> job seekers worldwide</span>
                </div>
              </div>
            </div>
            
            {/* Desktop Demo Text with Arrow - positioned below avatars like a notebook note */}
            <div className="hidden md:flex items-start gap-3 mb-6 ml-4">
              <HandDrawnArrow direction="left" className="flex-shrink-0 mt-1" />
              <p className="text-foreground text-sm font-inter leading-relaxed max-w-sm">
                check out this demo… our 3 Telegram AI Job Agents are right here, showing how they can help you stand out like the top 1%.
              </p>
            </div>
          </SignedOut>

          {/* Hero Video - Shows fully on mobile, larger size and reduced spacing */}
          <div className="flex md:hidden justify-center items-center mt-6 mb-2 px-2">
            <YouTubeHeroVideo className="w-full max-w-[320px]" />
          </div>
          
          {/* Mobile Demo Text with Arrow - positioned below video pointing up */}
          <div className="flex md:hidden items-start gap-3 mt-4 mb-6 justify-center px-4">
            <HandDrawnArrow direction="up" className="flex-shrink-0 mt-1" />
            <p className="text-foreground text-sm font-inter leading-relaxed max-w-sm">
              check out this demo… our 3 Telegram AI Job Agents are right here, showing how they can help you stand out like the top 1%.
            </p>
          </div>

        <SignedIn>
          <button onClick={goToDashboard} className="bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600 hover:from-sky-600 hover:to-blue-700 text-white px-12 py-4 text-lg sm:text-xl rounded-xl transition-all duration-300 font-inter font-bold shadow-2xl drop-shadow-xl hover:shadow-sky-500/60 transform hover:scale-105 z-30 relative focus:outline-none focus:ring-4 focus:ring-sky-400/50 mb-2">
            Go to Dashboard
          </button>
        </SignedIn>
        
        </div>
          </div>
        </div>
      </div>
    </section>
    
    {/* Telegram Agents Section - Separate section below hero */}
    <section className="relative py-4 bg-background">
      <div className="max-w-4xl mx-auto z-20 relative w-full px-4">
        <div className="text-left">
          <div className="text-foreground mb-6 text-sm md:text-base font-inter space-y-4">
            <p>hey… you know those job platforms that dump thousands of listings, and all those online resume builders that make everyone’s pdf look the same? that’s not what job seekers actually need.</p>
            
            
            
            <p>we’re not like them… we built our platform for genuine job seekers like you. people who need something that actually helps them land jobs.</p>
            
            <p><p>we're not here to trap you with subscriptions. <strong>start free</strong>, pay-as-you-go only if you want more. no hidden tricks.</p></p>
            
            <p><p>first, we made <strong>Telegram AI Job Agents</strong> just for you.. if you're wondering why Telegram… who has time to go through websites every day when you already have a lot going on? just open a chat, and your agents are there - fixing resumes, sending alerts, writing cover letters, prepping interviews, even pointing to the right HR contacts. it's like having a friend helping you land the job.</p></p>
            
            <p><p>this is the stuff that actually works. stuff that <strong>actually gets you ahead</strong>.</p></p>
            
            <p>👇 try your AI Job Agents and see it yourself</p>
          </div>
          
          <div className="flex flex-col md:flex-row items-start justify-start md:items-center md:justify-center space-y-3 md:space-y-0 md:space-x-3">
            <a href="https://t.me/Resume_builder_AI_bot" target="_blank" rel="noopener noreferrer" className="hover:scale-105 transition-all duration-200 cursor-pointer flex items-center gap-2 border border-gray-700 dark:border-gray-200 rounded-xl px-3 py-2 bg-gray-700 hover:bg-gray-800 dark:bg-gray-200 dark:hover:bg-gray-100">
              <span className="text-lg">📝</span>
              <span className="italic text-white dark:text-gray-900 text-sm">Resume Builder Agent</span>
            </a>
            
            <a href="https://t.me/Job_AI_update_bot" target="_blank" rel="noopener noreferrer" className="hover:scale-105 transition-all duration-200 cursor-pointer flex items-center gap-2 border border-gray-700 dark:border-gray-200 rounded-xl px-3 py-2 bg-gray-700 hover:bg-gray-800 dark:bg-gray-200 dark:hover:bg-gray-100">
              <span className="text-lg">🔔</span>
              <span className="italic text-white dark:text-gray-900 text-sm">Job Alerts Agent</span>
            </a>
            
            <a href="https://t.me/add_job_aspirelyai_bot" target="_blank" rel="noopener noreferrer" className="hover:scale-105 transition-all duration-200 cursor-pointer flex items-center gap-2 border border-gray-700 dark:border-gray-200 rounded-xl px-3 py-2 bg-gray-700 hover:bg-gray-800 dark:bg-gray-200 dark:hover:bg-gray-100">
              <span className="text-lg">👔</span>
              <span className="italic text-white dark:text-gray-900 text-sm">Job Application Agent</span>
            </a>
          </div>
          
          {/* Demo Image */}
          <div className="mt-8 flex justify-center">
            <img 
              src="/lovable-uploads/5b725964-9ba7-4dca-993d-0bac747cccb5.png" 
              alt="Telegram AI Job Agents Demo - showing Job Application, Resume Builder, and Job Alerts agents in action"
              className="max-w-full h-auto rounded-lg shadow-lg"
            />
          </div>
        </div>
      </div>
    </section>
  </>;
};
export default HeroSection;