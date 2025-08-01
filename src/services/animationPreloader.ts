import { preloadLottieAnimation } from '@/hooks/useLottieOptimized';
import { logger } from '@/utils/logger';

interface PreloadConfig {
  url: string;
  priority: 'high' | 'medium' | 'low';
  threshold?: number; // Intersection observer threshold
  rootMargin?: string; // Intersection observer root margin
}

// Animation registry for the landing page
export const LANDING_PAGE_ANIMATIONS: PreloadConfig[] = [
  {
    url: 'https://fnzloyyhzhrqsvslhhri.supabase.co/storage/v1/object/public/animations//Businessman%20flies%20up%20with%20rocket.json',
    priority: 'high', // Hero animation
    threshold: 0.1,
    rootMargin: '200px'
  },
  {
    url: 'https://fnzloyyhzhrqsvslhhri.supabase.co/storage/v1/object/public/animations//alerts%20job.json',
    priority: 'medium',
    threshold: 0.1,
    rootMargin: '300px'
  },
  {
    url: 'https://fnzloyyhzhrqsvslhhri.supabase.co/storage/v1/object/public/animations/business%20workshop.json',
    priority: 'medium',
    threshold: 0.1,
    rootMargin: '300px'
  },
  {
    url: 'https://fnzloyyhzhrqsvslhhri.supabase.co/storage/v1/object/public/animations/Interview%20_%20Get%20Ready%20to%20work-%20Job%20Recruitment%20(isometric-hiring-process).json',
    priority: 'medium',
    threshold: 0.1,
    rootMargin: '300px'
  },
  {
    url: 'https://fnzloyyhzhrqsvslhhri.supabase.co/storage/v1/object/public/animations/resume%20cv.json',
    priority: 'low',
    threshold: 0.1,
    rootMargin: '400px'
  },
  {
    url: 'https://fnzloyyhzhrqsvslhhri.supabase.co/storage/v1/object/public/animations/Business%20Analytics.json',
    priority: 'low',
    threshold: 0.1,
    rootMargin: '400px'
  },
  {
    url: 'https://fnzloyyhzhrqsvslhhri.supabase.co/storage/v1/object/public/animations/linkedin%20icon.json',
    priority: 'low',
    threshold: 0.1,
    rootMargin: '400px'
  }
];

class AnimationPreloader {
  private observers: Map<string, IntersectionObserver> = new Map();
  private preloadedUrls: Set<string> = new Set();
  private preloadPromises: Map<string, Promise<void>> = new Map();

  constructor() {
    // Preload high priority animations immediately
    this.preloadHighPriorityAnimations();
  }

  private async preloadHighPriorityAnimations(): Promise<void> {
    const highPriorityAnimations = LANDING_PAGE_ANIMATIONS.filter(
      config => config.priority === 'high'
    );

    for (const config of highPriorityAnimations) {
      this.preloadAnimation(config.url, config.priority);
    }
  }

  public preloadAnimation(url: string, priority: 'high' | 'medium' | 'low' = 'medium'): Promise<void> {
    if (this.preloadedUrls.has(url)) {
      return Promise.resolve();
    }

    if (this.preloadPromises.has(url)) {
      return this.preloadPromises.get(url)!;
    }

    const promise = preloadLottieAnimation(url, priority)
      .then(() => {
        this.preloadedUrls.add(url);
        logger.info(`Animation preloaded: ${url}`);
      })
      .catch(error => {
        logger.warn(`Failed to preload animation: ${url}`, error);
      })
      .finally(() => {
        this.preloadPromises.delete(url);
      });

    this.preloadPromises.set(url, promise);
    return promise;
  }

  public setupIntersectionObserver(
    element: Element,
    config: PreloadConfig
  ): void {
    if (this.preloadedUrls.has(config.url)) {
      return; // Already preloaded
    }

    const observerKey = config.url;
    
    // Clean up existing observer if any
    if (this.observers.has(observerKey)) {
      this.observers.get(observerKey)!.disconnect();
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.preloadAnimation(config.url, config.priority);
            observer.disconnect();
            this.observers.delete(observerKey);
          }
        });
      },
      {
        threshold: config.threshold || 0.1,
        rootMargin: config.rootMargin || '300px'
      }
    );

    observer.observe(element);
    this.observers.set(observerKey, observer);
  }

  public preloadAllMediumPriority(): void {
    const mediumPriorityAnimations = LANDING_PAGE_ANIMATIONS.filter(
      config => config.priority === 'medium'
    );

    // Use requestIdleCallback for non-blocking preloading
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        mediumPriorityAnimations.forEach(config => {
          this.preloadAnimation(config.url, config.priority);
        });
      });
    } else {
      setTimeout(() => {
        mediumPriorityAnimations.forEach(config => {
          this.preloadAnimation(config.url, config.priority);
        });
      }, 1000);
    }
  }

  public preloadAllLowPriority(): void {
    const lowPriorityAnimations = LANDING_PAGE_ANIMATIONS.filter(
      config => config.priority === 'low'
    );

    // Delay low priority animations
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        lowPriorityAnimations.forEach(config => {
          this.preloadAnimation(config.url, config.priority);
        });
      }, { timeout: 5000 });
    } else {
      setTimeout(() => {
        lowPriorityAnimations.forEach(config => {
          this.preloadAnimation(config.url, config.priority);
        });
      }, 3000);
    }
  }

  public cleanup(): void {
    // Disconnect all observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }

  public getPreloadStats() {
    return {
      preloadedCount: this.preloadedUrls.size,
      preloadedUrls: Array.from(this.preloadedUrls),
      activeObservers: this.observers.size,
      pendingPreloads: this.preloadPromises.size
    };
  }
}

// Singleton instance
export const animationPreloader = new AnimationPreloader();

// Hook for easy integration
export const useAnimationPreloader = () => {
  return {
    preloadAnimation: (url: string, priority?: 'high' | 'medium' | 'low') => 
      animationPreloader.preloadAnimation(url, priority),
    setupObserver: (element: Element, config: PreloadConfig) => 
      animationPreloader.setupIntersectionObserver(element, config),
    preloadMediumPriority: () => animationPreloader.preloadAllMediumPriority(),
    preloadLowPriority: () => animationPreloader.preloadAllLowPriority(),
    getStats: () => animationPreloader.getPreloadStats()
  };
};