import { useState, useEffect, useRef, useCallback } from 'react';
import { logger } from '@/utils/logger';
import React from 'react';

interface UseLazyLottieOptions {
  animationUrl: string;
  threshold?: number;
  rootMargin?: string;
  cacheKey?: string;
}

export const useLazyLottie = ({ 
  animationUrl, 
  threshold = 0.1, 
  rootMargin = '50px',
  cacheKey 
}: UseLazyLottieOptions) => {
  const [LottieComponent, setLottieComponent] = useState<React.ComponentType<any> | null>(null);
  const [animationData, setAnimationData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!elementRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(elementRef.current);

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  // Load animation only when in view
  useEffect(() => {
    if (!isInView) return;

    const loadAnimation = async () => {
      try {
        setIsLoading(true);
        setHasError(false);

        // Check cache first if cacheKey provided
        if (cacheKey) {
          const cachedData = localStorage.getItem(cacheKey);
          if (cachedData) {
            setAnimationData(JSON.parse(cachedData));
            setIsLoading(false);
            return;
          }
        }

        // Load Lottie React component dynamically
        const lottieModule = await import('lottie-react');
        setLottieComponent(() => lottieModule.default);

        // Fetch animation data
        const response = await fetch(animationUrl, {
          cache: 'force-cache'
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch animation: ${response.status}`);
        }

        const data = await response.json();
        setAnimationData(data);

        // Cache the data if cacheKey provided
        if (cacheKey) {
          localStorage.setItem(cacheKey, JSON.stringify(data));
        }

      } catch (error) {
        logger.error('Failed to load Lottie animation:', error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadAnimation();
  }, [isInView, animationUrl, cacheKey]);

  const LottieRenderer = useCallback((props: any) => {
    if (hasError) {
      return React.createElement('div', 
        { className: `flex items-center justify-center bg-muted rounded-lg ${props.className || ''}` },
        React.createElement('div', 
          { className: 'text-center text-muted-foreground' },
          React.createElement('div', { className: 'text-2xl mb-2' }, '🎬'),
          React.createElement('div', { className: 'text-sm' }, 'Animation unavailable')
        )
      );
    }

    if (isLoading || !LottieComponent || !animationData) {
      return React.createElement('div', 
        { className: `flex items-center justify-center bg-muted animate-pulse rounded-lg ${props.className || ''}` },
        React.createElement('div', { className: 'text-muted-foreground text-sm' }, 'Loading animation...')
      );
    }

    if (LottieComponent && animationData) {
      return React.createElement(LottieComponent, {
        animationData,
        loop: true,
        autoplay: true,
        ...props
      });
    }

    return null;
  }, [LottieComponent, animationData, isLoading, hasError]);

  return {
    elementRef,
    isLoading,
    hasError,
    isInView,
    LottieRenderer
  };
};