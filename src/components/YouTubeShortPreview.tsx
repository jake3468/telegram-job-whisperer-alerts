import { useState, useRef, useEffect } from 'react';
import { Play } from 'lucide-react';
const YouTubeShortPreview = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, {
      threshold: 0.1
    });
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);
  const handlePlay = () => {
    setIsPlaying(true);
  };
  const embedUrl = "https://www.youtube.com/embed/Ksoi_V9MjF8?autoplay=1&mute=0&controls=1&rel=0&modestbranding=1";
  const thumbnailUrl = "https://img.youtube.com/vi/Ksoi_V9MjF8/maxresdefault.jpg";
  return <section className="bg-black py-8 px-4" ref={containerRef}>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-center">
          <div className="relative w-[280px] h-[498px] sm:w-[320px] sm:h-[568px] lg:w-[360px] lg:h-[640px] rounded-2xl overflow-hidden shadow-2xl border border-gray-800/50 bg-gray-900">
            {!isPlaying ? <div className="w-full h-full cursor-pointer group relative" onClick={handlePlay} role="button" tabIndex={0} onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handlePlay();
            }
          }} aria-label="Play YouTube short video">
                {isVisible && <img src={thumbnailUrl} alt="YouTube Short Preview" className="w-full h-full object-cover" loading="lazy" />}
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors duration-300" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Play className="w-6 h-6 text-white ml-1" fill="currentColor" />
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-white font-medium drop-shadow-lg text-xl">Watch How It Works in 30 Seconds</p>
                </div>
              </div> : <iframe src={embedUrl} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title="Aspirely.ai Demo Short" />}
          </div>
        </div>
      </div>
    </section>;
};
export default YouTubeShortPreview;