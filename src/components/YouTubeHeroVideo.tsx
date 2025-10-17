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
  const [showThumbnailDelay, setShowThumbnailDelay] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const videoId = 'rJG9q1kn80I';
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=1&rel=0&modestbranding=1&loop=1&playlist=${videoId}&enablejsapi=1`;

  // Set loading to false
  useEffect(() => {
    setIsLoading(false);
  }, []);

  // Disable autoplay - video stays paused until user clicks play
  useEffect(() => {
    setShowThumbnailDelay(false);
  }, []);

  // Desktop: Intersection Observer for visibility tracking only
  useEffect(() => {
    if (!isMobile) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        },
        { threshold: 0.5 }
      );

      if (containerRef.current) {
        observer.observe(containerRef.current);
      }

      return () => {
        if (containerRef.current) {
          observer.unobserve(containerRef.current);
        }
      };
    }
  }, [isMobile]);

  if (isLoading) {
    return (
      <div ref={containerRef} className={`relative ${className}`}>
        {/* Mobile Phone Frame - Loading State */}
        <div className="relative w-64 h-[550px] mx-auto">
          {/* Phone Outer Frame with thin bezels */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-800 via-slate-900 to-black rounded-[2rem] shadow-2xl border border-slate-600">
            {/* Phone Inner Screen - Very thin bezels */}
            <div className="absolute top-2 left-2 right-2 bottom-2 bg-slate-800 rounded-[1.5rem] overflow-hidden">
              {/* Thumbnail Loading State */}
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-slate-700 to-slate-800">
                <img 
                  src={thumbnailUrl} 
                  alt="Video preview"
                  className="w-full h-full object-cover rounded-[1.5rem]"
                  onLoad={() => !isMobile && setIsLoading(false)}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                    <div className="w-0 h-0 border-l-[20px] border-l-white border-y-[12px] border-y-transparent ml-1"></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Phone Details - Thin */}
            <div className="absolute top-0.5 left-1/2 transform -translate-x-1/2 flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-slate-500 rounded-full"></div>
              <div className="w-8 h-0.5 bg-slate-500 rounded-full"></div>
            </div>
            <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-12 h-0.5 bg-slate-500 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Mobile Phone Frame - Full outline with thin edges */}
      <div className="relative w-64 h-[550px] mx-auto">
        {/* Phone Outer Frame with thinner bezels */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-800 via-slate-900 to-black rounded-[2rem] shadow-2xl border border-slate-600">
          {/* Phone Inner Screen - Very thin bezels to show full video */}
          <div className="absolute top-2 left-2 right-2 bottom-2 bg-black rounded-[1.5rem] overflow-hidden">
            {shouldPlay && (!isMobile || !showThumbnailDelay) ? (
              /* YouTube Video Embed */
              <iframe
                src={embedUrl}
                className="w-full h-full rounded-[1.5rem]"
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
                  className="w-full h-full object-cover rounded-[1.5rem]"
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
          
          {/* Phone Details - Thin and minimal */}
          {/* Top notch area */}
          <div className="absolute top-0.5 left-1/2 transform -translate-x-1/2 flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-slate-500 rounded-full"></div>
            <div className="w-8 h-0.5 bg-slate-500 rounded-full"></div>
          </div>
          {/* Bottom home indicator */}
          <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-12 h-0.5 bg-slate-500 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};