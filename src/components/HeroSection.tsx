import { SignedIn, SignedOut, SignUpButton } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { YouTubeHeroVideo } from '@/components/YouTubeHeroVideo';
import HandDrawnArrow from './HandDrawnArrow';
import { ArrowRight, Check } from 'lucide-react';
import jobApplicationPreview from '@/assets/job-application-preview.svg';
import jobAlertsAgentPreview from '@/assets/job-alerts-agent-preview.svg';
import resumeBuilderAgentPreview from '@/assets/resume-builder-agent-preview.svg';
import jobSuccessHero from '@/assets/job-success-hero-updated.jpg';

// Add heading animation hook at component level
const useHeadingAnimation = () => {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-20px 0px -50px 0px',
      threshold: 0.3
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !entry.target.classList.contains('animate-in')) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);

    if (headingRef.current) {
      observer.observe(headingRef.current);
    }

    return () => {
      if (headingRef.current) {
        observer.unobserve(headingRef.current);
      }
    };
  }, []);

  return headingRef;
};

const HeroSection = () => {
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();
  const videoRef = useRef<HTMLDivElement>(null);
  const [shouldAutoplay, setShouldAutoplay] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const jobHuntingHeadingRef = useHeadingAnimation();
  useEffect(() => {
    if (isLoaded && user) {
      navigate('/dashboard');
    }
  }, [user, isLoaded, navigate]);

  // Lazy load Elfsight testimonials script when section is visible
  useEffect(() => {
    const elfsightObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const script = document.createElement('script');
            script.src = 'https://elfsightcdn.com/platform.js';
            script.defer = true;
            document.body.appendChild(script);
            elfsightObserver.disconnect();
          }
        });
      },
      { rootMargin: '200px' }
    );

    const testimonialSection = document.querySelector('.elfsight-app-4951d48f-0df4-4724-a25f-ace7b5dfeb22');
    if (testimonialSection?.parentElement) {
      elfsightObserver.observe(testimonialSection.parentElement);
    }

    return () => {
      elfsightObserver.disconnect();
    };
  }, []);


  // Intersection Observer for video autoplay
  useEffect(() => {
    if (!videoRef.current) return;

    // Use higher threshold for mobile (95%) and lower for desktop (50%)
    const isMobile = window.innerWidth < 768;
    const threshold = isMobile ? 0.95 : 0.5;

    const videoObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !shouldAutoplay) {
            setShouldAutoplay(true);
          }
        });
      },
      {
        root: null,
        rootMargin: '0px',
        threshold // Trigger at 95% for mobile, 50% for desktop
      }
    );

    videoObserver.observe(videoRef.current);

    return () => {
      if (videoRef.current) {
        videoObserver.unobserve(videoRef.current);
      }
    };
  }, [shouldAutoplay]);
  const goToDashboard = () => {
    navigate('/dashboard');
  };
  return <>
    <section id="hero-section" className="relative min-h-[80vh] flex items-center justify-center px-4 pt-20 sm:pt-24 pb-2 overflow-hidden bg-background dark:bg-black" aria-labelledby="hero-heading">
      {/* bg-gradient-hero-mobile md:bg-gradient-hero - commented out for now */}
      <div className="absolute inset-0 z-10 bg-white/20 dark:bg-black/20" aria-hidden="true" />
      
      {/* Main Container with Grid Layout */}
      <div className="max-w-7xl mx-auto z-20 relative w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Column - Text Content */}
          <div className="text-center lg:text-left flex flex-col justify-center">
        
        {/* Fazier Badge */}
        <div className="flex justify-center lg:justify-start mb-6 mt-2 md:mt-6 lg:mt-8">
          <a 
            href="https://fazier.com/launches/aspirely-ai" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block hover:opacity-80 transition-opacity"
          >
            <div className="min-h-[42px] sm:min-h-[48px] md:min-h-[54px] flex items-center justify-center bg-background">
              <img 
                src="https://fazier.com/api/v1/public/badges/embed_image.svg?launch_id=5237&badge_type=daily&variant=2&theme=neutral" 
                width="180"
                alt="Fazier badge - Aspirely AI launch" 
                loading="eager"
                fetchPriority="high"
                className="w-[140px] sm:w-[160px] md:w-[180px] lg:hidden mt-3"
              />
            </div>
          </a>
        </div>

        <div className="relative mb-8 md:mt-4">
          <h1 
            id="hero-heading"
            className="relative z-30 text-[48px] md:text-[48px] lg:text-[52px] mb-1 leading-none font-notion-inter font-medium tracking-[-0.4px] text-notion-dark dark:text-white drop-shadow-2xl animate-fade-in dark:[text-shadow:_0_0_40px_rgba(255,255,255,0.5)] not-italic"
          >
            <span className="block text-center lg:text-left text-[42px] md:text-[48px] lg:text-[52px] leading-tight animate-fly-in-from-bottom">
              <span className="text-notion-dark dark:text-white px-0.5 py-0 font-notion-inter font-bold not-italic">Your </span>
              <span className="text-notion-dark dark:text-white px-0.5 py-0 font-notion-inter font-bold not-italic underline decoration-green-500 decoration-2 underline-offset-4">all-in-one</span>
              <br />
              <span className="text-notion-dark dark:text-white px-0.5 py-0 font-notion-inter font-bold not-italic"><span className="bg-notion-dark dark:bg-white text-white dark:text-notion-dark px-2 py-1 rounded">Resume</span> Assistant</span>
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
        

        <div className="text-foreground mb-8 md:mb-10 lg:mb-12 max-w-2xl lg:max-w-none mx-auto lg:mx-0 font-notion-inter font-light leading-relaxed text-[16px] md:text-[18px] lg:text-[20px] dark:[text-shadow:_0_2px_4px_rgba(0,0,0,0.9)] text-center lg:text-left [filter:brightness(1.1)_contrast(1.1)]">
          <p className="mb-8 text-[15px] md:text-[17px] lg:text-[18px] font-notion-inter font-medium text-foreground text-center lg:text-left">
            Upload your current resume. Chat with our AI agent on Telegram to update and improve it. Download your ATS-optimized PDF instantly. Save hours of work and land interviews faster 🏆—available 24/7.
          </p>
          
          <SignedOut>
            {/* Button Container */}
            <div className="flex flex-row items-center justify-center lg:justify-start mb-4">
              <SignUpButton mode="modal">
                <button className="bg-[rgb(0,117,222)] hover:bg-[#0066C3] text-[rgb(255,255,255)] dark:bg-[rgb(0,117,222)] dark:hover:bg-[#0066C3] dark:text-[rgb(255,255,255)] px-4 py-2 md:px-6 md:py-2.5 text-lg md:text-xl rounded-2xl transition-all duration-300 font-inter font-medium shadow-lg hover:shadow-primary/40 transform hover:scale-105 z-30 relative focus:outline-none focus:ring-4 focus:ring-[#0075DE]/20 flex items-center gap-2 justify-center w-auto border border-transparent">
                  Sign Up Free <ArrowRight className="w-5 h-5 inline ml-1" />
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
            <div className="flex items-center justify-center lg:justify-start gap-2 md:gap-4 mb-6">
              <div className="flex -space-x-1.5 md:-space-x-2">
                <Avatar className="h-6 w-6 md:h-8 md:w-8 border-2 border-white dark:border-white border-gray-300">
                  <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face" alt="Aspirely AI user success story - AI-powered job search testimonial" />
                  <AvatarFallback>RS</AvatarFallback>
                </Avatar>
                <Avatar className="h-6 w-6 md:h-8 md:w-8 border-2 border-white dark:border-white border-gray-300">
                  <AvatarImage src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face" alt="Professional landed dream job using Aspirely AI platform" />
                  <AvatarFallback>TH</AvatarFallback>
                </Avatar>
                <Avatar className="h-6 w-6 md:h-8 md:w-8 border-2 border-white dark:border-white border-gray-300">
                  <AvatarImage src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face" alt="Job seeker transformed career with Aspirely AI resume builder and job alerts" />
                  <AvatarFallback>AW</AvatarFallback>
                </Avatar>
                <Avatar className="h-6 w-6 md:h-8 md:w-8 border-2 border-white dark:border-white border-gray-300">
                  <AvatarImage src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face" alt="Tech professional using automated Telegram job search agent with Aspirely AI" />
                  <AvatarFallback>TH</AvatarFallback>
                </Avatar>
              </div>
              
              <div className="flex flex-col items-start">
                <div className="flex text-yellow-400 dark:text-yellow-400 mb-0.5 md:mb-1 text-sm md:text-base [text-shadow:_0_0_2px_rgba(0,0,0,0.8)] dark:[text-shadow:none]">
                  <span>⭐⭐⭐⭐⭐</span>
                </div>
                <div className="text-foreground text-xs md:text-sm text-left">
                  <span className="italic font-medium">Trusted by <span className="font-bold">10k+</span> job seekers</span>
                </div>
              </div>
            </div>
            
            {/* Success Image - Mobile and Tablet (below trust indicator) */}
            <div className="lg:hidden mb-4">
              <img 
                src="/lovable-uploads/ats-resume-format.png" 
                alt="ATS-optimized resume format examples - before and after comparison" 
                className="w-full h-auto rounded-2xl shadow-lg"
                loading="eager"
                decoding="async"
              />
            </div>
          </SignedOut>

        <SignedIn>
          <button onClick={goToDashboard} className="bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600 hover:from-sky-600 hover:to-blue-700 text-white px-12 py-4 text-lg sm:text-xl rounded-xl transition-all duration-300 font-inter font-bold shadow-2xl drop-shadow-xl hover:shadow-sky-500/60 transform hover:scale-105 z-30 relative focus:outline-none focus:ring-4 focus:ring-sky-400/50 mb-2">
            Go to Dashboard
          </button>
        </SignedIn>
        </div>
        
        </div>
          
          {/* Right Column - Hero Image (Desktop Only) */}
          <div className="hidden lg:block">
            <img 
              src="/lovable-uploads/ats-resume-format.png" 
              alt="ATS-optimized resume format examples - before and after comparison" 
              className="w-full max-w-[450px] xl:max-w-[500px] h-auto rounded-2xl lg:rounded-3xl shadow-2xl mx-auto"
              loading="eager"
              decoding="async"
            />
          </div>
          
          {/* YouTube Video - Full Width Below Grid */}
          <div className="col-span-1 lg:col-span-2 mt-4 md:mt-0 lg:mt-8">
            <div 
              ref={videoRef}
              className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] px-4 md:w-full md:max-w-5xl md:left-0 md:right-0 md:ml-0 md:mr-0 md:mx-auto md:px-0 lg:w-screen lg:max-w-none lg:left-1/2 lg:right-1/2 lg:-ml-[50vw] lg:-mr-[50vw] lg:px-16"
            >
              <div className="w-full aspect-video rounded-2xl overflow-hidden relative">
                {isVideoPlaying ? (
                  <iframe
                    className="w-full h-full"
                    src="https://www.youtube.com/embed/eVKtDxScOEo?autoplay=1&mute=1&controls=1&rel=0&modestbranding=1&loop=1&playlist=eVKtDxScOEo&enablejsapi=1"
                    title="Aspirely.ai Demo - AI Job Search Platform Features Walkthrough"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                  />
                ) : (
                  <div className="relative w-full h-full cursor-pointer" onClick={() => setIsVideoPlaying(true)}>
                    <img 
                      src="/video-thumbnail.png" 
                      alt="Aspirely AI platform demo - AI job search tools and Telegram agents walkthrough"
                      className="w-full h-full object-cover"
                      loading="eager"
                      decoding="async"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 md:w-20 md:h-20 bg-red-600 rounded-full flex items-center justify-center shadow-lg hover:bg-red-700 transition-colors">
                        <div className="w-0 h-0 border-l-[20px] md:border-l-[24px] border-l-white border-y-[12px] md:border-y-[14px] border-y-transparent ml-1"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    
    {/* Telegram Agents Section - Separate section below hero */}
    <section id="telegram-agents" className="relative pt-0 pb-4 bg-background" aria-labelledby="telegram-agents-heading">
      <div className="z-20 relative w-full px-4">
        <div className="max-w-2xl mx-auto mb-8">
          <div className="text-foreground mb-6 text-sm md:text-base font-inter space-y-4 text-center">
            <h2 id="telegram-agents-heading" ref={jobHuntingHeadingRef} className="animate-on-scroll text-2xl md:text-3xl lg:text-4xl font-bold text-center text-foreground mb-4 font-inter mt-8">Your Complete Job Search Solution (Not Just Alerts)</h2>
            
            <p className="text-left">Job searching is exhausting.</p>
            
            <p className="text-left">Tailoring resumes, writing cover letters, researching roles, finding HR contacts—it's overwhelming.</p>
            
            <p className="text-left"><strong>We fixed it.</strong> Our AI Job Agents handle everything through simple Telegram chats. No logins. No stress. Just results.</p>
            
          </div>
        </div>
          
        {/* AI Job Agents Structured Section */}
        <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center text-foreground mb-8 font-inter">Meet Your Three AI Job Agents —</h3>
        <div className="space-y-8">
            {/* 1. Job Alerts AI Agent */}
            <div 
              className="rounded-3xl p-6 md:p-8 lg:p-10 bg-card max-w-7xl mx-auto border-4 border-border"
            >
              {/* Mobile Layout */}
              <div className="lg:hidden space-y-6">
                <div>
                  <h4 className="text-2xl md:text-3xl mb-2 font-inter text-primary font-bold">
                    1. Job Alerts AI Agent
                  </h4>
                  <p className="text-base md:text-lg text-foreground/70 font-inter mb-4">
                    Fresh jobs + instant application files
                  </p>
                </div>
                <div className="flex justify-center">
                  <img 
                    src={jobAlertsAgentPreview} 
                    alt="Job Alerts AI Agent - Daily fresh jobs via Telegram with Aspirely AI platform" 
                    className="w-full h-auto rounded-lg"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div>
                  <p className="leading-relaxed font-inter text-foreground text-sm mb-4">
                    Receive daily job alerts with only the latest postings—less than 24 hours old. Each job is matched to your profile.
                  </p>
                  <p className="leading-relaxed font-inter text-foreground text-sm mb-3">
                    See a job you like? With just one click, instantly generate:
                  </p>
                  <ul className="space-y-1.5 mb-6">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground text-sm font-inter">Tailored CV/resume</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground text-sm font-inter">Cover letter</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground text-sm font-inter">Interview prep materials</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground text-sm font-inter">Job-fit analysis</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground text-sm font-inter">HR contacts to message</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground text-sm font-inter">Company insights</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground text-sm font-inter">Visa sponsorship details (for foreign nationals)</span>
                    </li>
                  </ul>
                  <p className="leading-relaxed font-inter text-foreground text-sm">
                    Everything is personalized for that specific role and ready to apply instantly.
                  </p>
                </div>
                <div>
                  <a href="https://t.me/Job_AI_update_bot" target="_blank" rel="noopener noreferrer" className="w-fit bg-gray-700 text-white dark:bg-white dark:text-black font-medium py-1.5 px-4 rounded-full flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl text-sm">
                    Start on Telegram
                    <ArrowRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
              
              {/* Desktop Layout */}
              <div className="hidden lg:grid grid-cols-2 gap-16 items-center">
                <div className="flex flex-col justify-center space-y-8">
                  <div>
                    <h4 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 font-inter text-primary whitespace-nowrap">
                      1. Job Alerts AI Agent
                    </h4>
                    <p className="text-lg md:text-xl text-foreground/70 font-inter mb-4">
                      Fresh jobs + instant application files
                    </p>
                    <p className="text-base leading-relaxed font-inter text-foreground mb-3">
                      Receive daily job alerts with only the latest postings—less than 24 hours old. Each job is matched to your profile.
                    </p>
                    <p className="text-base leading-relaxed font-inter text-foreground mb-3">
                      See a job you like? With just one click, instantly generate:
                    </p>
                    <ul className="space-y-1.5 mb-4">
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-foreground text-base font-inter">Tailored CV/resume</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-foreground text-base font-inter">Cover letter</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-foreground text-base font-inter">Interview prep materials</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-foreground text-base font-inter">Job-fit analysis</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-foreground text-base font-inter">HR contacts to message</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-foreground text-base font-inter">Company insights</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-foreground text-base font-inter">Visa sponsorship details (for foreign nationals)</span>
                      </li>
                    </ul>
                    <p className="text-base leading-relaxed font-inter text-foreground">
                      Everything is personalized for that specific role and ready to apply instantly.
                    </p>
                  </div>
                  
                  <a href="https://t.me/Job_AI_update_bot" target="_blank" rel="noopener noreferrer" className="w-fit bg-gray-700 text-white dark:bg-white dark:text-black font-bold py-3 px-8 rounded-full flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl">
                    Start on Telegram
                    <ArrowRight className="w-5 h-5" />
                  </a>
                </div>
                <div className="flex items-center justify-center w-full">
                  <div className="w-full max-w-full lg:max-w-3xl">
                    <img src={jobAlertsAgentPreview} alt="Job Alerts AI Agent demonstration" className="w-full h-auto rounded-lg" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* 2. Resume Builder AI Agent */}
            <div 
              className="rounded-3xl p-6 md:p-8 lg:p-10 bg-card max-w-7xl mx-auto border-4 border-border"
            >
              {/* Mobile Layout */}
              <div className="lg:hidden space-y-6">
                <div>
                  <h4 className="text-2xl md:text-3xl mb-2 font-inter text-primary font-bold">
                    2. Resume Builder AI Agent
                  </h4>
                  <p className="text-base md:text-lg text-foreground/70 font-inter mb-4">
                    Build ATS-friendly resumes fast
                  </p>
                </div>
                <div className="flex justify-center">
                  <img 
                    src={resumeBuilderAgentPreview} 
                    alt="Resume Builder AI Agent - Chat-based ATS-friendly resume creation with Aspirely AI" 
                    className="w-full h-auto rounded-lg"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div>
                  <ul className="space-y-1.5 mb-6">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground text-sm font-inter">Just chat to update skills, certifications, projects, or work experience</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground text-sm font-inter">AI generates a polished resume in final PDF format instantly</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground text-sm font-inter">No forms, no copy-pasting, no starting over</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground text-sm font-inter">Each update remembers your previous changes and improves your resume</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground text-sm font-inter">Save hours of manual work</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <a href="https://t.me/Resume_builder_AI_bot" target="_blank" rel="noopener noreferrer" className="w-fit bg-gray-700 text-white dark:bg-white dark:text-black font-medium py-1.5 px-4 rounded-full flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl text-sm">
                    Start on Telegram
                    <ArrowRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
              
              {/* Desktop Layout - Reversed */}
              <div className="hidden lg:grid grid-cols-2 gap-16 items-center lg:grid-flow-col-dense">
                <div className="lg:col-start-2 flex flex-col justify-center space-y-8">
                  <div>
                    <h4 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 font-inter text-primary whitespace-nowrap">
                      2. Resume Builder AI Agent
                    </h4>
                    <p className="text-lg md:text-xl text-foreground/70 font-inter mb-4">
                      Build ATS-friendly resumes fast
                    </p>
                    <ul className="space-y-1.5 mb-4">
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-foreground text-base font-inter">Just chat to update skills, certifications, projects, or work experience</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-foreground text-base font-inter">AI generates a polished resume in final PDF format instantly</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-foreground text-base font-inter">No forms, no copy-pasting, no starting over</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-foreground text-base font-inter">Each update remembers your previous changes and improves your resume</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-foreground text-base font-inter">Save hours of manual work</span>
                      </li>
                    </ul>
                  </div>
                  
                  <a href="https://t.me/Resume_builder_AI_bot" target="_blank" rel="noopener noreferrer" className="w-fit bg-gray-700 text-white dark:bg-white dark:text-black font-bold py-3 px-8 rounded-full flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl">
                    Start on Telegram
                    <ArrowRight className="w-5 h-5" />
                  </a>
                </div>
                <div className="lg:col-start-1 flex items-center justify-center w-full">
                  <div className="w-full max-w-full lg:max-w-3xl">
                    <img 
                      src={resumeBuilderAgentPreview} 
                      alt="Resume Builder AI Agent interface showing chat-based resume creation with ATS-friendly PDF output" 
                      className="w-full h-auto rounded-lg"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* 3. Job Application AI Agent */}
            <div 
              className="rounded-3xl p-6 md:p-8 lg:p-10 bg-card max-w-7xl mx-auto border-4 border-border"
            >
              {/* Mobile Layout */}
              <div className="lg:hidden space-y-6">
                <div>
                  <h4 className="text-2xl md:text-3xl mb-2 font-inter text-primary font-bold">
                    3. Job Application AI Agent
                  </h4>
                  <p className="text-base md:text-lg text-foreground/70 font-inter mb-4">
                    Apply to any job in minutes
                  </p>
                </div>
                <div className="flex justify-center">
                  <img 
                    src={jobApplicationPreview} 
                    alt="Job Application AI Agent - Complete application packages with Aspirely AI including resumes and cover letters"
                    className="w-full h-auto rounded-lg"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div>
                  <p className="leading-relaxed font-inter text-foreground text-sm mb-3">
                    Planning to apply for a job you discovered? Simply share the job posting and instantly receive:
                  </p>
                  <ul className="space-y-1.5 mb-3">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground text-sm font-inter">Tailored CV/resume</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground text-sm font-inter">Cover letter</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground text-sm font-inter">Interview prep materials</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground text-sm font-inter">Job-fit analysis</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground text-sm font-inter">HR contacts to message</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground text-sm font-inter">Company insights</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground text-sm font-inter">Visa sponsorship details (for foreign nationals)</span>
                    </li>
                  </ul>
                  <p className="leading-relaxed font-inter text-foreground text-sm">
                    Everything is customized for that specific role and ready to submit immediately.
                  </p>
                </div>
                <div>
                  <a href="https://t.me/add_job_aspirelyai_bot" target="_blank" rel="noopener noreferrer" className="w-fit bg-gray-700 text-white dark:bg-white dark:text-black font-medium py-1.5 px-4 rounded-full flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl text-sm">
                    Start on Telegram
                    <ArrowRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
              
              {/* Desktop Layout */}
              <div className="hidden lg:grid grid-cols-2 gap-16 items-center">
                <div className="flex flex-col justify-center space-y-8">
                  <div>
                    <h4 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 font-inter text-primary whitespace-nowrap">
                      3. Job Application AI Agent
                    </h4>
                    <p className="text-lg md:text-xl text-foreground/70 font-inter mb-4">
                      Apply to any job in minutes
                    </p>
                    <p className="text-base leading-relaxed font-inter text-foreground mb-3">
                      Planning to apply for a job you discovered? Simply share the job posting and instantly receive:
                    </p>
                    <ul className="space-y-1.5 mb-3">
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-foreground text-base font-inter">Tailored CV/resume</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-foreground text-base font-inter">Cover letter</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-foreground text-base font-inter">Interview prep materials</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-foreground text-base font-inter">Job-fit analysis</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-foreground text-base font-inter">HR contacts to message</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-foreground text-base font-inter">Company insights</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-foreground text-base font-inter">Visa sponsorship details (for foreign nationals)</span>
                      </li>
                    </ul>
                    <p className="text-base leading-relaxed font-inter text-foreground">
                      Everything is customized for that specific role and ready to submit immediately.
                    </p>
                  </div>
                  
                  <a href="https://t.me/add_job_aspirelyai_bot" target="_blank" rel="noopener noreferrer" className="w-fit bg-gray-700 text-white dark:bg-white dark:text-black font-bold py-3 px-8 rounded-full flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl">
                    Start on Telegram
                    <ArrowRight className="w-5 h-5" />
                  </a>
                </div>
                <div className="flex items-center justify-center w-full">
                  <div className="w-full max-w-full lg:max-w-3xl">
                    <img 
                      src={jobApplicationPreview} 
                      alt="Job Application AI Agent showing automated generation of resumes, cover letters, and interview prep materials"
                      className="w-full h-auto rounded-lg"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Demo Video Section - All screen sizes */}
            {/* <div className="mt-12 mb-8">
              <div className="flex flex-col items-center justify-center">
                <div className="mb-6">
                  <YouTubeHeroVideo className="w-full max-w-[320px] md:max-w-xs" />
                </div>
                
                <div className="flex items-start gap-3 justify-center px-4">
                  <HandDrawnArrow direction="up" className="flex-shrink-0 mt-1" />
                  <p className="text-foreground text-sm font-inter leading-relaxed max-w-sm text-left md:text-center">
                    check out this demo… our 3 Telegram AI Job Agents are right here, showing how they can help you stand out like the top 1%.
                  </p>
                </div>
              </div>
          </div> */}
        </div>
      </div>
    </section>
  </>;
};
export default HeroSection;