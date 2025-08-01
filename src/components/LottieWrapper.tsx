import React, { useRef, useEffect, memo } from 'react';
import { useLottieOptimized } from '@/hooks/useLottieOptimized';
import { useAnimationPreloader } from '@/services/animationPreloader';
import { logger } from '@/utils/logger';

interface LottieWrapperProps {
  url: string;
  fallbackImage?: string;
  fallbackIcon?: string;
  className?: string;
  style?: React.CSSProperties;
  priority?: 'high' | 'medium' | 'low';
  preload?: boolean;
  retryCount?: number;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  loop?: boolean;
  autoplay?: boolean;
  title?: string; // For accessibility and logging
}

const LottieWrapper: React.FC<LottieWrapperProps> = memo(({
  url,
  fallbackImage,
  fallbackIcon = '🎬',
  className = '',
  style = {},
  priority = 'medium',
  preload = true,
  retryCount = 3,
  onLoad,
  onError,
  loop = true,
  autoplay = true,
  title = 'Animation'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { setupObserver } = useAnimationPreloader();
  
  const { animationData, isLoading, hasError, LottieComponent } = useLottieOptimized({
    url,
    priority,
    retryCount,
    preload
  });

  // Setup intersection observer for preloading
  useEffect(() => {
    if (containerRef.current && preload) {
      setupObserver(containerRef.current, {
        url,
        priority,
        threshold: 0.1,
        rootMargin: priority === 'high' ? '200px' : '300px'
      });
    }
  }, [url, priority, preload, setupObserver]);

  // Handle load/error callbacks
  useEffect(() => {
    if (animationData && !isLoading && !hasError) {
      onLoad?.();
      logger.info(`Lottie animation loaded successfully: ${title}`);
    }
  }, [animationData, isLoading, hasError, onLoad, title]);

  useEffect(() => {
    if (hasError) {
      const error = new Error(`Failed to load Lottie animation: ${url}`);
      onError?.(error);
      logger.error(`Lottie animation failed to load: ${title}`, error);
    }
  }, [hasError, onError, url, title]);

  // Loading state with skeleton
  if (isLoading) {
    return (
      <div 
        ref={containerRef}
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse ${className}`}
        style={style}
        role="img"
        aria-label={`Loading ${title} animation`}
      >
        <div className="text-gray-400 dark:text-gray-500 text-sm font-medium">
          <div className="text-2xl mb-2">{fallbackIcon}</div>
          <div>Loading animation...</div>
        </div>
      </div>
    );
  }

  // Error state with fallback
  if (hasError) {
    return (
      <div 
        ref={containerRef}
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 ${className}`}
        style={style}
        role="img"
        aria-label={`${title} animation unavailable`}
      >
        {fallbackImage ? (
          <img 
            src={fallbackImage} 
            alt={title}
            className="w-full h-full object-contain"
            loading="lazy"
          />
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400">
            <div className="text-2xl mb-2">{fallbackIcon}</div>
            <div className="text-sm">Animation unavailable</div>
          </div>
        )}
      </div>
    );
  }

  // Success state with animation
  if (LottieComponent && animationData) {
    return (
      <div 
        ref={containerRef}
        className={className}
        style={style}
        role="img"
        aria-label={`${title} animation`}
      >
        <LottieComponent 
          animationData={animationData}
          loop={loop}
          autoplay={autoplay}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    );
  }

  // Fallback loading state
  return (
    <div 
      ref={containerRef}
      className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg ${className}`}
      style={style}
      role="img"
      aria-label={`Loading ${title} animation`}
    >
      <div className="text-gray-400 dark:text-gray-500 text-sm">
        <div className="text-2xl mb-2">{fallbackIcon}</div>
        <div>Loading animation...</div>
      </div>
    </div>
  );
});

LottieWrapper.displayName = 'LottieWrapper';

export default LottieWrapper;