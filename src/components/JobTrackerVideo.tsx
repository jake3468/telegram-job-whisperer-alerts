import React, { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Play, Pause } from 'lucide-react';

interface JobTrackerVideoProps {
  className?: string;
  showControls?: boolean;
}

export const JobTrackerVideo: React.FC<JobTrackerVideoProps> = ({ 
  className = '',
  showControls = true 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationData, setAnimationData] = useState<any>(null);
  const [LottieComponent, setLottieComponent] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const lottieRef = useRef<any>(null);

  // Dynamic import of Lottie
  useEffect(() => {
    const loadLottie = async () => {
      try {
        const Lottie = await import('lottie-react');
        setLottieComponent(() => Lottie.default);
      } catch (err) {
        console.error('Failed to load Lottie:', err);
        setError('Failed to load animation component');
      }
    };
    loadLottie();
  }, []);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        setIsInView(entry.isIntersecting);
        
        if (entry.isIntersecting && !hasLoaded) {
          // Start loading animation when it comes into view
          loadAnimation();
        } else if (!entry.isIntersecting && lottieRef.current) {
          // Pause animation when it goes out of view
          lottieRef.current.pause();
          setIsPlaying(false);
        }
      },
      {
        threshold: 0.3, // Trigger when 30% of the video is visible
        rootMargin: '50px' // Start loading 50px before it's visible
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [hasLoaded]);

  // Load animation data from Supabase Storage
  const loadAnimation = useCallback(async () => {
    if (hasLoaded) return; // Prevent multiple loads
    
    setIsLoading(true);
    setHasLoaded(true);
    
    try {
      const animationUrl = supabase.storage
        .from('animations')
        .getPublicUrl('business workshop.json');

      const response = await fetch(animationUrl.data.publicUrl);
      if (!response.ok) throw new Error('Failed to fetch animation');
      
      const data = await response.json();
      setAnimationData(data);
    } catch (err) {
      console.error('Error loading animation:', err);
      setError('Failed to load animation');
    } finally {
      setIsLoading(false);
    }
  }, [hasLoaded]);

  // Auto-play when animation comes into view and is loaded
  useEffect(() => {
    if (isInView && lottieRef.current && animationData && !isPlaying) {
      lottieRef.current.play();
      setIsPlaying(true);
    }
  }, [isInView, animationData, isPlaying]);

  const togglePlayPause = () => {
    if (!lottieRef.current) return;

    if (isPlaying) {
      lottieRef.current.pause();
      setIsPlaying(false);
    } else {
      lottieRef.current.play();
      setIsPlaying(true);
    }
  };

  // Show placeholder when not loaded yet
  if (!hasLoaded || isLoading) {
    return (
      <div ref={containerRef} className={`relative ${className}`}>
        <div className="relative h-[160px] md:h-[200px] lg:h-[240px] rounded-3xl overflow-hidden shadow-2xl border border-gray-800/50">
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-gray-900 to-black">
            <div className="text-center">
              <div className="text-4xl mb-3">🏢</div>
              <div className="text-gray-400 text-sm">
                {isLoading ? 'Loading workshop animation...' : 'Scroll to view workshop'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !animationData) {
    return (
      <div ref={containerRef} className={`relative ${className}`}>
        <div className="relative h-[160px] md:h-[200px] lg:h-[240px] rounded-3xl overflow-hidden shadow-2xl border border-gray-800/50">
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-black p-6 text-center">
            <div className="text-4xl mb-3">🏢</div>
            <div className="text-gray-300 text-sm mb-1">
              Business Workshop Coming Soon!
            </div>
            <div className="text-gray-500 text-xs">
              Interactive workshop animation will appear here
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative group ${className}`}>
        <div className="relative h-[160px] md:h-[200px] lg:h-[240px] rounded-3xl overflow-hidden shadow-2xl border border-gray-800/50">
        {/* Lottie Animation */}
        {LottieComponent && animationData ? (
          <LottieComponent
            lottieRef={lottieRef}
            animationData={animationData}
            className="w-full h-full"
            loop={true}
            autoplay={false}
            onComplete={() => {
              if (lottieRef.current) {
                lottieRef.current.goToAndPlay(0, true);
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-gray-900 to-black">
            <div className="text-center">
              <div className="text-4xl mb-3">🏢</div>
              <div className="text-gray-400 text-sm">Loading workshop...</div>
            </div>
          </div>
        )}

        {/* Animation Controls Overlay */}
        {showControls && (
          <div className="absolute inset-0 bg-transparent group-hover:bg-black/10 transition-colors duration-200 pointer-events-none">
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-auto">
              <button
                onClick={togglePlayPause}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-colors"
                aria-label={isPlaying ? 'Pause workshop' : 'Play workshop'}
              >
                {isPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white ml-0.5" />}
              </button>
            </div>
          </div>
        )}

        {/* Overlay Content */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/80 via-black/50 to-transparent pointer-events-none" />
      </div>
    </div>
  );
};