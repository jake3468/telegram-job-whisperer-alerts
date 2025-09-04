import React, { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { useVideoRateLimiter } from '@/hooks/useVideoRateLimiter';

interface JobTrackerVideoProps {
  className?: string;
  showControls?: boolean;
}

export const JobTrackerVideo: React.FC<JobTrackerVideoProps> = ({ 
  className = '',
  showControls = true 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [videoUrls, setVideoUrls] = useState<{ webm: string | null; mp4: string | null }>({ webm: null, mp4: null });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rateLimitBlocked, setRateLimitBlocked] = useState(false);
  
  const { checkRateLimit } = useVideoRateLimiter();
  const videoPath = 'job-tracker-demo';

  // Generate session ID for tracking
  const sessionId = useCallback(() => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }, []);

  // Track video analytics with rate limiting
  const trackVideoPlay = useCallback(async () => {
    try {
      const rateCheck = await checkRateLimit(videoPath, navigator.userAgent, sessionId());
      
      if (!rateCheck.allowed) {
        console.warn('Video access blocked:', rateCheck.reason);
        setRateLimitBlocked(true);
        return false;
      }

      return true;
    } catch (err) {
      console.warn('Rate limiting check failed:', err);
      return true; // Allow if rate limiter fails
    }
  }, [videoPath, sessionId, checkRateLimit]);

  // Load video URLs from Supabase Storage
  useEffect(() => {
    const loadVideos = async () => {
      try {
        // Check rate limits before loading videos
        const canAccess = await trackVideoPlay();
        if (!canAccess) {
          setError('Access temporarily limited');
          setIsLoading(false);
          return;
        }

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
  }, [videoPath, trackVideoPlay]);

  const togglePlayPause = async () => {
    if (!videoRef.current) return;

    try {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        // Check rate limits before playing
        const canPlay = await trackVideoPlay();
        if (!canPlay) {
          setRateLimitBlocked(true);
          return;
        }

        await videoRef.current.play();
        setIsPlaying(true);
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
        <div className="relative h-[300px] sm:h-[350px] md:h-[400px] lg:h-[450px] rounded-3xl overflow-hidden shadow-2xl border border-gray-800/50">
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-gray-900 to-black">
            <div className="text-gray-400 text-sm animate-pulse">Loading job tracker demo...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || rateLimitBlocked || (!videoUrls.webm && !videoUrls.mp4)) {
    return (
      <div className={`relative ${className}`}>
        <div className="relative h-[300px] sm:h-[350px] md:h-[400px] lg:h-[450px] rounded-3xl overflow-hidden shadow-2xl border border-gray-800/50">
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-black p-6 text-center">
            <div className="text-4xl mb-3">📋</div>
            <div className="text-gray-300 text-sm mb-1">
              {rateLimitBlocked ? 'Demo Temporarily Limited' : 'Job Tracker Demo Coming Soon!'}
            </div>
            <div className="text-gray-500 text-xs">
              {rateLimitBlocked ? 'Please try again later' : 'Interactive demo will appear here'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative group ${className}`}>
      <div className="relative h-[300px] sm:h-[350px] md:h-[400px] lg:h-[450px] rounded-3xl overflow-hidden shadow-2xl border border-gray-800/50">
        {/* Video */}
        <video
          ref={videoRef}
          className="w-full h-full object-cover bg-black"
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
                className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-colors"
                aria-label={isPlaying ? 'Pause demo' : 'Play demo'}
              >
                {isPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white ml-0.5" />}
              </button>
              <button
                onClick={toggleMute}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-colors"
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
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