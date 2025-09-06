import React, { useEffect, useRef, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface YouTubeHeroVideoProps {
  className?: string;
}

export const YouTubeHeroVideo: React.FC<YouTubeHeroVideoProps> = ({ 
  className = '' 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldPlay, setShouldPlay] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const videoId = 'rJG9q1kn80I';
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=1&rel=0&modestbranding=1&loop=1&playlist=${videoId}&enablejsapi=1`;

  // Desktop: Autoplay after 1 second
  useEffect(() => {
    if (!isMobile) {
      const timer = setTimeout(() => {
        setShouldPlay(true);
        setIsLoading(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isMobile]);

  // Mobile: Intersection Observer for scroll-triggered autoplay
  useEffect(() => {
    if (!isMobile || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsVisible(true);
          setShouldPlay(true);
          setIsLoading(false);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isMobile]);

  if (isLoading) {
    return (
      <div ref={containerRef} className={`relative ${className}`}>
        {/* iPhone Frame - Loading State */}
        <div className="relative w-56 h-[480px] mx-auto">
          {/* iPhone Outer Frame */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-800 via-slate-900 to-black rounded-[2.5rem] shadow-2xl border-2 border-slate-700">
            {/* iPhone Notch */}
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-black rounded-b-2xl z-10"></div>
            
            {/* iPhone Inner Screen */}
            <div className="absolute top-3 left-3 right-3 bottom-3 bg-black rounded-[2rem] overflow-hidden">
              {/* Thumbnail Loading State */}
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-slate-700 to-slate-800">
                <img 
                  src={thumbnailUrl} 
                  alt="Video preview"
                  className="w-full h-full object-cover rounded-[2rem]"
                  onLoad={() => !isMobile && setIsLoading(false)}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                    <div className="w-0 h-0 border-l-[20px] border-l-white border-y-[12px] border-y-transparent ml-1"></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* iPhone Home Indicator */}
            <div className="absolute bottom-1.5 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-slate-600 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* iPhone Frame */}
      <div className="relative w-56 h-[480px] mx-auto">
        {/* iPhone Outer Frame */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-800 via-slate-900 to-black rounded-[2.5rem] shadow-2xl border-2 border-slate-700">
          {/* iPhone Notch */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-black rounded-b-2xl z-10"></div>
          
          {/* iPhone Inner Screen */}
          <div className="absolute top-3 left-3 right-3 bottom-3 bg-black rounded-[2rem] overflow-hidden">
            {shouldPlay ? (
              /* YouTube Video Embed */
              <iframe
                src={embedUrl}
                className="w-full h-full rounded-[2rem]"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="YouTube video player"
              />
            ) : (
              /* Thumbnail with play button */
              <div className="relative w-full h-full">
                <img 
                  src={thumbnailUrl} 
                  alt="Video preview"
                  className="w-full h-full object-cover rounded-[2rem]"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <button 
                    onClick={() => setShouldPlay(true)}
                    className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg hover:bg-red-700 transition-colors"
                  >
                    <div className="w-0 h-0 border-l-[20px] border-l-white border-y-[12px] border-y-transparent ml-1"></div>
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* iPhone Home Indicator */}
          <div className="absolute bottom-1.5 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-slate-600 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};