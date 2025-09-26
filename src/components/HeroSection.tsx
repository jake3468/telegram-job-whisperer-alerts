import { SignedIn, SignedOut, SignUpButton } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
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
const TELEGRAM_ANIMATION_URL = 'https://fnzloyyhzhrqsvslhhri.supabase.co/storage/v1/object/public/animations/telegram.json';
const TELEGRAM_CACHE_KEY = 'telegram-animation-data-v2';

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
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
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

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-20px 0px -50px 0px', // Trigger when 20px from top
      threshold: 0.3 // Trigger when 30% of element is visible
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !entry.target.classList.contains('animate-in')) {
          // Find the index of this card
          const cardIndex = cardsRef.current.findIndex(card => card === entry.target);
          
          // Add animation with staggered delay
          setTimeout(() => {
            entry.target.classList.add('animate-in');
          }, cardIndex * 200); // 200ms delay between each card
        }
      });
    }, observerOptions);

    // Observe each card
    cardsRef.current.forEach((card) => {
      if (card) {
        observer.observe(card);
      }
    });

    return () => {
      cardsRef.current.forEach((card) => {
        if (card) {
          observer.unobserve(card);
        }
      });
    };
  }, []);
  const goToDashboard = () => {
    navigate('/dashboard');
  };
  return <>
    <section className="relative min-h-[80vh] flex items-center justify-center px-4 pt-20 sm:pt-24 pb-8 overflow-hidden bg-gradient-hero-mobile md:bg-gradient-hero dark:bg-black">
      <div className="absolute inset-0 z-10 bg-white/20 dark:bg-black/20" aria-hidden="true" />
      
      {/* Main Container with Grid Layout */}
      <div className="max-w-7xl mx-auto z-20 relative w-full">
        <div className="flex justify-center items-center">
          {/* Hero Content - Center aligned */}
          <div className="text-left max-w-2xl mx-auto flex flex-col justify-center mt-8 md:mt-0">
        
        <div className="relative mb-8">
          <h1 className="relative z-30 text-[36px] md:text-[54px] mb-1 leading-none font-notion-inter font-medium tracking-[-0.4px] text-notion-dark dark:text-white drop-shadow-2xl animate-fade-in dark:[text-shadow:_0_0_40px_rgba(255,255,255,0.5)] not-italic">
            {/* Mobile view only */}
            <div className="block md:hidden text-left text-[32px] leading-tight animate-fly-in-from-bottom">
              <span className="text-notion-dark dark:text-white px-0.5 py-0 font-notion-inter font-normal not-italic whitespace-nowrap">Effortless Job Hunting.</span>
              <br />
              <span className="text-notion-dark dark:text-white px-0.5 py-0 inline-block font-notion-inter font-semibold not-italic">Our AI agents will do</span>
              <br />
              <span className="text-notion-dark dark:text-white px-0.5 py-0 inline-block font-notion-inter font-semibold not-italic"><span className="underline decoration-red-500 decoration-4 underline-offset-4 font-bold">all the work</span> for you</span>
              <br />
              <div className="flex items-center gap-2">
                <span className="text-notion-dark dark:text-white px-0.5 py-0 font-notion-inter font-semibold not-italic">on Telegram</span>
                {telegramAnimationData && <div className="flex-shrink-0">
                    <Lottie animationData={telegramAnimationData} loop={true} autoplay={true} className="w-10 h-10" />
                  </div>}
              </div>
            </div>
            
            {/* Desktop view only */}
            <div className="hidden lg:block text-center leading-tight animate-fly-in-from-bottom">
              <span className="text-notion-dark dark:text-white px-0.5 py-0 font-notion-inter font-normal not-italic">Effortless Job Hunting.</span>
              <br />
              <span className="text-notion-dark dark:text-white px-0.5 py-0 inline-block font-notion-inter font-medium not-italic">Our AI agents will do</span>
              <br />
               <span className="text-notion-dark dark:text-white px-0.5 py-0 inline-block font-notion-inter font-medium not-italic"><span className="underline decoration-red-500 decoration-4 underline-offset-4 font-bold">all the work</span> for you</span>
              <br />
              <div className="flex items-center justify-center gap-2">
                <span className="text-notion-dark dark:text-white px-0.5 py-0 font-notion-inter font-medium not-italic">on Telegram</span>
                {telegramAnimationData && <div className="flex-shrink-0">
                    <Lottie animationData={telegramAnimationData} loop={true} autoplay={true} className="w-16 h-16" />
                  </div>}
              </div>
            </div>
            
            {/* Tablet view only */}
            <div className="hidden md:block lg:hidden text-center leading-tight animate-fly-in-from-bottom">
              <span className="text-notion-dark dark:text-white px-0.5 py-0 font-notion-inter font-normal not-italic">Effortless Job Hunting.</span>
              <br />
              <span className="text-notion-dark dark:text-white px-0.5 py-0 inline-block font-notion-inter font-medium not-italic">Our AI agents will do</span>
              <br />
              <span className="text-notion-dark dark:text-white px-0.5 py-0 inline-block font-notion-inter font-medium not-italic"><span className="underline decoration-red-500 decoration-4 underline-offset-4 font-bold">all the work</span> for you</span>
              <br />
              <div className="flex items-center justify-center gap-2">
                <span className="text-notion-dark dark:text-white px-0.5 py-0 font-notion-inter font-medium not-italic">on Telegram</span>
                {telegramAnimationData && <div className="flex-shrink-0">
                    <Lottie animationData={telegramAnimationData} loop={true} autoplay={true} className="w-16 h-16 md:w-20 md:h-20" />
                  </div>}
              </div>
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
        

        <div className="text-foreground mb-8 md:mb-10 lg:mb-12 max-w-2xl mx-auto font-notion-inter font-light leading-relaxed text-[14px] md:text-[16px] dark:[text-shadow:_0_2px_4px_rgba(0,0,0,0.9)] text-left [filter:brightness(1.1)_contrast(1.1)]">
          <p className="mb-8 text-[14px] md:text-[16px] font-notion-inter font-medium text-foreground text-left md:text-center">
            Finding your perfect job is now quicker and easier with our AI agents! <br />
            Get personalized job alerts, custom resumes, cover letters, interview prep, <br />
            and direct hiring manager contacts through effortless chat. <br />
            It's never been this simple before.
          </p>
          
          <SignedOut>
            {/* Button Container */}
            <div className="flex flex-row items-center justify-center mb-8">
              <SignUpButton mode="modal">
                <button className="bg-[rgb(0,117,222)] hover:bg-[#0066C3] text-[rgb(255,255,255)] dark:bg-[rgb(0,117,222)] dark:hover:bg-[#0066C3] dark:text-[rgb(255,255,255)] px-6 py-3 md:px-8 md:py-3 text-base md:text-lg rounded-2xl transition-all duration-300 font-inter font-medium shadow-lg hover:shadow-primary/40 transform hover:scale-105 z-30 relative focus:outline-none focus:ring-4 focus:ring-[#0075DE]/20 flex items-center gap-2 justify-center w-auto border border-transparent">
                  Try Aspirely for Free
                </button>
              </SignUpButton>
              
              {/* Discount Badge */}
              {/* <div className="bg-white border border-green-600 dark:bg-green-900/30 dark:border-green-700 rounded-full px-4 py-2 md:px-4 md:py-2 w-auto text-left md:text-center">
                <span className="text-green-700 dark:text-green-300 text-xs md:text-sm font-semibold font-inter">
                  Get 50% off with code "ASP123"
                </span>
               </div> */}
            </div>
            {/* Avatar Group with Rating */}
            <div className="flex items-center justify-center gap-4 mb-6">
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
                  <span className="italic text-sm font-medium">Trusted by <span className="font-bold">3000+</span> job seekers worldwide</span>
                </div>
              </div>
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
    
    {/* Desktop/Tablet Video Demo Section */}
    <section className="hidden md:block relative py-8 bg-background">
      <div className="max-w-4xl mx-auto z-20 relative w-full px-4">
        <div className="flex flex-col items-center justify-center">
          {/* Video Component */}
          <div className="mb-6">
            <YouTubeHeroVideo className="w-full max-w-xs" />
          </div>
          
          {/* Demo Text with Arrow - centrally aligned */}
          <div className="flex items-start gap-3 justify-center">
            <HandDrawnArrow direction="up" className="flex-shrink-0 mt-1" />
            <p className="text-foreground text-sm font-inter leading-relaxed max-w-sm text-center">
              check out this demo… our 3 Telegram AI Job Agents are right here, showing how they can help you stand out like the top 1%.
            </p>
          </div>
        </div>
      </div>
    </section>
    
    {/* Telegram Agents Section - Separate section below hero */}
    <section id="telegram-agents" className="relative py-4 bg-background">
      <div className="max-w-4xl mx-auto z-20 relative w-full px-4">
        <div className="text-left">
          <div className="text-foreground mb-6 text-sm md:text-base font-inter space-y-4">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center text-foreground mb-4 font-inter">Get access to the world's first Telegram AI Job Agents</h2>
            
            <p>Job platforms are broken. Old postings everywhere. Even when you see a matching job, you skip it because customizing resumes and finding HR contacts takes forever.</p>
            
            <p>That's exactly why we built 3 AI Job Agents on Telegram.</p>
            
          </div>
          
          {/* AI Job Agents Structured Section */}
          <div className="space-y-8">
            {/* 1. Job Alerts AI Agent */}
            <div 
              ref={(el) => cardsRef.current[0] = el}
              className="animate-on-scroll rounded-3xl p-6 md:p-8 lg:p-10 bg-card border border-black dark:border-white max-w-4xl mx-auto"
            >
              <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-6 font-inter text-center">1. Job Alerts AI Agent</h3>
              
              <div className="flex justify-center mb-6">
                <img src="/telegram-job-alerts-agent.png" alt="Job Alerts AI Agent demonstration showing personalized job alerts with tailored resumes and cover letters" className="max-w-full h-auto rounded-lg shadow-lg" />
              </div>
              
              <p className="text-foreground mb-6 text-sm md:text-base font-inter leading-relaxed text-center max-w-3xl mx-auto">
                1 job alert = 7 instant files. Get tailored resumes, cover letters, interview prep, job fit analysis, and HR contacts - all personalized for each role.
              </p>
              
              <div className="flex justify-center">
                <a href="https://t.me/Job_AI_update_bot" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-white hover:opacity-90 px-6 py-3 rounded-xl transition-all duration-200 font-medium" style={{backgroundColor: '#30313d'}}>
                  Try it 👉
                </a>
              </div>
            </div>
            
            {/* 2. Resume Builder AI Agent */}
            <div 
              ref={(el) => cardsRef.current[1] = el}
              className="animate-on-scroll rounded-3xl p-6 md:p-8 lg:p-10 bg-card border border-black dark:border-white max-w-4xl mx-auto"
            >
              <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-6 font-inter text-center">2. Resume Builder AI Agent</h3>
              
              <div className="flex justify-center mb-6">
                <img src="/telegram-resume-builder-agent.png" alt="Resume Builder AI Agent interface showing conversational resume building and customization" className="max-w-full h-auto rounded-lg shadow-lg" />
              </div>
              
              <p className="text-foreground mb-6 text-sm md:text-base font-inter leading-relaxed text-center max-w-3xl mx-auto">
                Just chat and get your resume tailored for every role - add new certifications, skills, projects, work experience by just telling it. No long forms, it remembers everything about you. It's like having a resume coach.
              </p>
              
              <div className="flex justify-center">
                <a href="https://t.me/Resume_builder_AI_bot" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-white hover:opacity-90 px-6 py-3 rounded-xl transition-all duration-200 font-medium" style={{backgroundColor: '#30313d'}}>
                  Try it 👉
                </a>
              </div>
            </div>
            
            {/* 3. Job Application AI Agent */}
            <div 
              ref={(el) => cardsRef.current[2] = el}
              className="animate-on-scroll rounded-3xl p-6 md:p-8 lg:p-10 bg-card border border-black dark:border-white max-w-4xl mx-auto"
            >
              <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-6 font-inter text-center">3. Job Application AI Agent</h3>
              
              <p className="text-foreground mb-6 text-sm md:text-base font-inter leading-relaxed text-center max-w-3xl mx-auto">
                Tell it what job you're planning to apply for → Get the full application package, so you can apply to that job fully prepared in minutes.
              </p>
              
              <div className="flex justify-center">
                <a href="https://t.me/add_job_aspirelyai_bot" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-white hover:opacity-90 px-6 py-3 rounded-xl transition-all duration-200 font-medium" style={{backgroundColor: '#30313d'}}>
                  Try it 👉
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </>;
};
export default HeroSection;