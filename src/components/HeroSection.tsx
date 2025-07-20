import { SignedIn, SignedOut, SignUpButton } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import Lottie from 'lottie-react';
import Particles from './Particles';
const HeroSection = () => {
  const navigate = useNavigate();
  const {
    user,
    isLoaded
  } = useUser();
  const [lottieAnimationData, setLottieAnimationData] = useState(null);
  const fullText = 'Yeah, finally — a premium job hunt tool for top 0.1% candidates';
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
      {/* Animated Cosmic Stars Background */}
      <div className="absolute inset-0 z-0">
        <Particles particleColors={['#ffffff', '#ffffff']} particleCount={200} particleSpread={10} speed={0.1} particleBaseSize={100} moveParticlesOnHover={false} alphaParticles={false} disableRotation={false} />
      </div>
      <div className="absolute inset-0 z-10 bg-black/20" aria-hidden="true" />
      
      <div className="text-center max-w-4xl mx-auto z-20 relative">
        <h1 className="text-2xl md:text-4xl font-extrabold text-white mb-1 leading-tight font-inter drop-shadow-xl animate-fade-in">
          {fullText.split(' ').map((word, wordIndex) => {
            const cleanWord = word.replace(/[.,—]/g, ''); // Remove punctuation for matching
            const punctuation = word.match(/[.,—]/g)?.[0] || '';
            if (cleanWord === 'Yeah') {
              return <span key={wordIndex} className="italic font-black bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
                        {wordIndex === 0 ? cleanWord : ` ${cleanWord}`}{punctuation}
                      </span>;
            } else if (cleanWord === 'finally') {
              return <span key={wordIndex} className="italic font-black bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
                        {wordIndex === 0 ? cleanWord : ` ${cleanWord}`}{punctuation}
                      </span>;
            } else if (cleanWord === 'premium') {
              return <span key={wordIndex} className="italic font-black bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 bg-clip-text text-transparent">
                        {wordIndex === 0 ? cleanWord : ` ${cleanWord}`}{punctuation}
                      </span>;
            } else if (cleanWord === 'top' || cleanWord === '0.1%') {
              return <span key={wordIndex} className="italic font-black bg-gradient-to-r from-purple-400 via-pink-500 to-rose-500 bg-clip-text text-transparent">
                        {wordIndex === 0 ? cleanWord : ` ${cleanWord}`}{punctuation}
                      </span>;
            } else {
              return <span key={wordIndex}>{wordIndex === 0 ? word : ` ${word}`}</span>;
            }
          })}
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

        <p className="text-gray-200 mb-4 md:mb-6 lg:mb-8 max-w-2xl mx-auto font-inter font-light leading-relaxed drop-shadow shadow-black text-left md:text-sm text-sm">Everything you need for your job hunt - all in one place, no clutter. We help you apply in the first 24 hours - before 3000 others do. Build resumes, decode job fit, and prep with real AI mock interviews.</p>
        
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