import React, { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface HeroVideoProps {
  videoPath?: string;
  className?: string;
  showControls?: boolean;
}

export const HeroVideo: React.FC<HeroVideoProps> = ({ 
  videoPath = 'hero-demo', 
  className = '',
  showControls = true 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [videoUrls, setVideoUrls] = useState<{ webm: string | null; mp4: string | null }>({ webm: null, mp4: null });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Generate session ID for tracking
  const sessionId = useCallback(() => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }, []);

  // Track video analytics
  const trackVideoPlay = useCallback(async () => {
    try {
      const { error } = await supabase
        .from('video_analytics')
        .insert({
          video_path: videoPath,
          user_agent: navigator.userAgent,
          session_id: sessionId()
        });

      if (error) {
        console.warn('Failed to track video play:', error);
      }
    } catch (err) {
      console.warn('Analytics tracking error:', err);
    }
  }, [videoPath, sessionId]);

  // Load video URLs from Supabase Storage
  useEffect(() => {
    const loadVideos = async () => {
      try {
        const webmData = supabase.storage
          .from('hero-videos')
          .getPublicUrl(`${videoPath}.webm`);

        const mp4Data = supabase.storage
          .from('hero-videos')
          .getPublicUrl(`${videoPath}.mp4`);

        setVideoUrls({
          webm: webmData.data.publicUrl,
          mp4: mp4Data.data.publicUrl
        });
      } catch (err) {
        console.error('Error loading videos:', err);
        setError('Failed to load videos');
      } finally {
        setIsLoading(false);
      }
    };

    loadVideos();
  }, [videoPath]);

  const togglePlayPause = async () => {
    if (!videoRef.current) return;

    try {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        await videoRef.current.play();
        setIsPlaying(true);
        trackVideoPlay();
      }
    } catch (err) {
      console.error('Play/pause error:', err);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  if (isLoading) {
    return (
      <div className={`relative ${className}`}>
        {/* Mobile Phone Frame */}
        <div className="relative w-72 h-[600px] mx-auto">
          {/* Phone Outer Frame */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-800 via-slate-900 to-black rounded-[2.5rem] shadow-2xl border-2 border-slate-700">
            {/* Phone Inner Screen */}
            <div className="absolute top-6 left-6 right-6 bottom-6 bg-slate-800 rounded-[2rem] overflow-hidden">
              {/* Loading State */}
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-slate-700 to-slate-800">
                <div className="text-slate-400 text-sm animate-pulse">Loading demo...</div>
              </div>
            </div>
            
            {/* Phone Details */}
            <div className="absolute top-3 left-1/2 transform -translate-x-1/2 flex items-center gap-2">
              <div className="w-2 h-2 bg-slate-600 rounded-full"></div>
              <div className="w-12 h-1 bg-slate-600 rounded-full"></div>
            </div>
            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-slate-600 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || (!videoUrls.webm && !videoUrls.mp4)) {
    return (
      <div className={`relative ${className}`}>
        {/* Mobile Phone Frame */}
        <div className="relative w-72 h-[600px] mx-auto">
          {/* Phone Outer Frame */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-800 via-slate-900 to-black rounded-[2.5rem] shadow-2xl border-2 border-slate-700">
            {/* Phone Inner Screen */}
            <div className="absolute top-6 left-6 right-6 bottom-6 bg-slate-800 rounded-[2rem] overflow-hidden">
              {/* Error State */}
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-700 to-slate-800 p-6 text-center">
                <div className="text-4xl mb-3">📱</div>
                <div className="text-slate-300 text-sm mb-1">Demo Coming Soon!</div>
                <div className="text-slate-500 text-xs">Video will appear here</div>
              </div>
            </div>
            
            {/* Phone Details */}
            <div className="absolute top-3 left-1/2 transform -translate-x-1/2 flex items-center gap-2">
              <div className="w-2 h-2 bg-slate-600 rounded-full"></div>
              <div className="w-12 h-1 bg-slate-600 rounded-full"></div>
            </div>
            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-slate-600 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative group ${className}`}>
      {/* Mobile Phone Frame */}
      <div className="relative w-72 h-[600px] mx-auto">
        {/* Phone Outer Frame with proper proportions */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-800 via-slate-900 to-black rounded-[2.5rem] shadow-2xl border-2 border-slate-700">
          {/* Phone Inner Screen - matches 574x1216 aspect ratio */}
          <div className="absolute top-6 left-6 right-6 bottom-6 bg-black rounded-[2rem] overflow-hidden">
            {/* Video - show entire video without cropping */}
            <video
              ref={videoRef}
              className="w-full h-full object-contain bg-black"
              loop
              playsInline
              muted={isMuted}
              preload="auto"
              autoPlay
              onLoadedData={() => {
                setIsLoading(false);
                // Force immediate play after loading
                if (videoRef.current) {
                  videoRef.current.play().catch(console.warn);
                }
              }}
              onCanPlay={() => {
                // Ensure autoplay starts as soon as possible
                if (videoRef.current && !isPlaying) {
                  videoRef.current.play().catch(console.warn);
                }
              }}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            >
              {videoUrls.webm && <source src={videoUrls.webm} type="video/webm" />}
              {videoUrls.mp4 && <source src={videoUrls.mp4} type="video/mp4" />}
              Your browser does not support the video tag.
            </video>

            {/* Video Controls Overlay */}
            {showControls && (
              <div className="absolute inset-0 bg-transparent group-hover:bg-black/10 transition-colors duration-200 pointer-events-none">
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-auto">
                  <button
                    onClick={togglePlayPause}
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-colors"
                  >
                    {isPlaying ? <Pause className="w-3 h-3 text-white" /> : <Play className="w-3 h-3 text-white ml-0.5" />}
                  </button>
                  <button
                    onClick={toggleMute}
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-colors"
                  >
                    {isMuted ? <VolumeX className="w-3 h-3 text-white" /> : <Volume2 className="w-3 h-3 text-white" />}
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Phone Details - More realistic */}
          {/* Camera and speaker */}
          <div className="absolute top-3 left-1/2 transform -translate-x-1/2 flex items-center gap-2">
            <div className="w-2 h-2 bg-slate-600 rounded-full"></div>
            <div className="w-12 h-1 bg-slate-600 rounded-full"></div>
          </div>
          {/* Home indicator */}
          <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-slate-600 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};