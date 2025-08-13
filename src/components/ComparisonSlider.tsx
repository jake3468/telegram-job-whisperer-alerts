import React, { useState, useRef, useCallback } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

const ComparisonSlider = () => {
  const isMobile = useIsMobile();
  const [sliderPosition, setSliderPosition] = useState(isMobile ? 75 : 50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    e.preventDefault();
  }, []);

  const updateSliderPosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      updateSliderPosition(e.clientX);
    }
  }, [isDragging, updateSliderPosition]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (isDragging && e.touches[0]) {
      updateSliderPosition(e.touches[0].clientX);
    }
  }, [isDragging, updateSliderPosition]);

  const handleEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleEnd);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleEnd);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleEnd);
      };
    }
  }, [isDragging, handleMouseMove, handleTouchMove, handleEnd]);

  const withoutItems = [
    "Old job postings",
    "Hours wasted searching", 
    "Late to apply",
    "No tracking system",
    "Same resume for all",
    "No interview prep",
    "Missed opportunities"
  ];

  const withItems = [
    "Apply before others, with all files ready in 1 click",
    "Only jobs from last 24 hours",
    "Matches your title and location", 
    "Daily alerts on Telegram",
    "All applications tracked",
    "Cover letters, resume, company insights, job fit check instantly",
    "Visa info for international students",
    "Interview prep and AI mock interviews on your phone"
  ];

  return (
    <section className="pt-8 pb-16 px-4 bg-black relative overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div 
          ref={containerRef}
          className="relative rounded-2xl overflow-hidden shadow-2xl cursor-grab active:cursor-grabbing"
          style={{ userSelect: 'none' }}
        >
          {/* Left Side - With Aspirely.ai */}
          <div 
            className="bg-gradient-to-br from-green-950 to-green-900 p-4 md:p-6 font-sans"
            style={{ 
              clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 'fit-content',
              minHeight: '100%'
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl md:text-3xl">🚀</span>
              <h3 className="text-xl md:text-2xl font-bold text-white">
                With Aspirely.ai
              </h3>
            </div>
            <p className="text-green-200 mb-4 text-sm md:text-base">
              This changes everything. Set up in less than 2 minutes and start getting results.
            </p>
            <div className="space-y-2 pb-4">
              {withItems.map((item, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-green-400 text-base mt-0.5">✅</span>
                  <span className="text-green-100 text-xs md:text-sm leading-snug">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - Without Aspirely.ai */}
          <div 
            className="bg-gradient-to-br from-red-950 to-red-900 p-4 md:p-6 font-sans"
            style={{ 
              clipPath: `polygon(${sliderPosition}% 0, 100% 0, 100% 100%, ${sliderPosition}% 100%)`,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 'fit-content',
              minHeight: '100%'
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl md:text-3xl">🚫</span>
              <h3 className="text-xl md:text-2xl font-bold text-white">
                Without Aspirely.ai
              </h3>
            </div>
            <p className="text-red-200 mb-4 text-sm md:text-base">
              Leaving now means repeating the same mistakes and missing better opportunities.
            </p>
            <div className="space-y-2 pb-4">
              {withoutItems.map((item, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-red-400 text-base mt-0.5">❌</span>
                  <span className="text-red-100 text-xs md:text-sm leading-snug">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Hidden content for height reference */}
          <div className="invisible p-4 md:p-6 font-sans">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl md:text-3xl">🚀</span>
              <h3 className="text-xl md:text-2xl font-bold">
                With Aspirely.ai
              </h3>
            </div>
            <p className="mb-4 text-sm md:text-base">
              This changes everything. Set up in less than 2 minutes and start getting results.
            </p>
            <div className="space-y-2 pb-4">
              {withItems.map((item, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-base mt-0.5">✅</span>
                  <span className="text-xs md:text-sm leading-snug">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Slider Handle */}
          <div 
            className="absolute top-0 bottom-0 flex items-center z-10 touch-none"
            style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          >
            <div className="bg-white shadow-lg rounded-full p-3 md:p-4 cursor-grab active:cursor-grabbing transition-transform hover:scale-110">
              <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-r from-red-500 to-green-500 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 md:w-4 md:h-4 bg-white rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Center Line */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-white/30 pointer-events-none"
            style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
          />
        </div>

        {/* Instructions */}
        <div className="text-center mt-6">
          <p className="text-gray-400 text-sm">
            {isMobile ? '👈 Drag the slider to the left to compare' : 'Click and drag the slider to compare'}
          </p>
        </div>
      </div>
    </section>
  );
};

export default ComparisonSlider;