import { SignedIn, SignedOut, SignUpButton } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import Lottie from 'lottie-react';
import { lazy, Suspense } from 'react';

// Lazy load particles for performance
const Particles = lazy(() => import('./Particles'));
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

  // Load Lottie animation
  useEffect(() => {
    const loadLottieAnimation = async () => {
      try {
        const response = await fetch('https://fnzloyyhzhrqsvslhhri.supabase.co/storage/v1/object/public/animations//Businessman%20flies%20up%20with%20rocket.json');
        const animationData = await response.json();
        setLottieAnimationData(animationData);

        // Load particles immediately
        setShowParticles(true);
      } catch (error) {
        console.error('Failed to load Lottie animation:', error);
        // Still show particles even if Lottie fails
        setTimeout(() => setShowParticles(true), 100);
      }
    };
    loadLottieAnimation();
  }, []);
  const goToDashboard = () => {
    navigate('/dashboard');
  };
  return <section className="relative min-h-[60vh] sm:min-h-[70vh] flex flex-col items-center justify-center px-4 pt-20 sm:pt-24 pb-2 overflow-hidden bg-black">
      {/* Animated Cosmic Stars Background - Lazy Loaded */}
      {showParticles && <div className="absolute inset-0 z-0">
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
        
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-1 leading-tight font-playfair tracking-tight text-white drop-shadow-2xl animate-fade-in [text-shadow:_0_0_40px_rgba(255,255,255,0.5)]">
          {fullText}
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
          <span className="text-sm font-playfair font-medium text-white drop-shadow-lg">Powered by</span>
          <div className="flex items-center">
            <img alt="AI Services - OpenAI, Claude, and Perplexity" className="h-8 object-contain hover:scale-110 transition-transform duration-200" loading="lazy" src="/lovable-uploads/061e42ad-45f4-4e4c-b642-9efff932bddd.png" />
          </div>
        </div>

        <p className="text-white mb-4 md:mb-6 lg:mb-8 max-w-2xl mx-auto font-playfair font-light leading-relaxed drop-shadow-lg text-left md:text-base text-sm [text-shadow:_0_1px_2px_rgba(0,0,0,0.8)]">
          Perfect job matches delivered to your{' '}
          <span className="font-bold italic bg-gradient-to-r from-[#00BFFF] to-[#1E90FF] bg-clip-text text-transparent drop-shadow-md">Telegram</span>
          {' '}like personal messages.{' '}
          <span className="font-bold italic bg-gradient-to-r from-[#00FF7F] to-[#32CD32] bg-clip-text text-transparent drop-shadow-md">One click</span>
          {' '}gets you custom resumes, cover letters, interview prep, company insights, and visa sponsorship info.{' '}
          <span className="font-bold italic bg-gradient-to-r from-[#DA70D6] to-[#BA55D3] bg-clip-text text-transparent drop-shadow-md">Premium dashboard</span>
          {' '}included. Apply anywhere,{' '}
          <span className="font-bold italic bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent drop-shadow-md">fully prepared</span>
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
        
        {/* More prominent Privacy Policy Link for Google OAuth Verification */}
        <div className="mt-4 mb-2">
          <p className="text-gray-300 text-sm font-inter font-medium">
            By using Aspirely.ai, you agree to our{' '}
            <a href="/privacy-policy" className="text-white hover:text-gray-200 underline transition-colors font-semibold">
              Privacy Policy
            </a>
            {' '}and{' '}
            <a href="/terms-of-service" className="text-white hover:text-gray-200 underline transition-colors font-semibold">
              Terms of Service
            </a>
            .
          </p>
        </div>
      </div>
    </section>;
};
export default HeroSection;