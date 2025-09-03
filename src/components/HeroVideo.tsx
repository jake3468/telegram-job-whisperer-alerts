import React, { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface HeroVideoProps {
  videoPath?: string;
  className?: string;
  showControls?: boolean;
}

export const HeroVideo: React.FC<HeroVideoProps> = ({ 
  videoPath = 'hero-demo.mp4', 
  className = '',
  showControls = true 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
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

  // Load video URL from Supabase Storage
  useEffect(() => {
    const loadVideo = async () => {
      try {
        const { data } = supabase.storage
          .from('hero-videos')
          .getPublicUrl(videoPath);

        setVideoUrl(data.publicUrl);
      } catch (err) {
        console.error('Error loading video:', err);
        setError('Failed to load video');
      } finally {
        setIsLoading(false);
      }
    };

    loadVideo();
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
      <div className={`relative bg-muted/20 rounded-xl overflow-hidden flex items-center justify-center ${className}`}>
        <div className="animate-pulse bg-muted/40 w-full h-full min-h-[200px] flex items-center justify-center">
          <div className="text-muted-foreground text-sm">Loading video...</div>
        </div>
      </div>
    );
  }

  if (error || !videoUrl) {
    return (
      <div className={`relative bg-muted/20 rounded-xl overflow-hidden flex items-center justify-center ${className}`}>
        <div className="text-muted-foreground text-sm p-8 text-center">
          <div className="mb-2">📹</div>
          <div>Video coming soon!</div>
          <div className="text-xs mt-1 opacity-70">Demo video will be available here</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-black/20 rounded-xl overflow-hidden group ${className}`}>
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        loop
        playsInline
        muted={isMuted}
        preload="metadata"
        autoPlay
        onLoadedData={() => setIsLoading(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      >
        <source src={videoUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {showControls && (
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200">
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={togglePlayPause}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-colors"
            >
              {isPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white ml-0.5" />}
            </button>
            <button
              onClick={toggleMute}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};