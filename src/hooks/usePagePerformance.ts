import { useEffect, useRef } from 'react';
import { logger } from '@/utils/logger';
import { getLottieCacheStats, cleanupLottieCache } from './useLottieOptimized';

interface PerformanceMetrics {
  pageLoad: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
}

export const usePagePerformance = (pageName: string) => {
  const metricsRef = useRef<Partial<PerformanceMetrics>>({});
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    // Measure page load time
    const pageLoadTime = Date.now() - startTimeRef.current;
    metricsRef.current.pageLoad = pageLoadTime;

    // Web Vitals measurements
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        metricsRef.current.largestContentfulPaint = lastEntry?.startTime || 0;
      });
      
      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (error) {
        logger.warn('LCP observer not supported', error);
      }

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          metricsRef.current.firstInputDelay = entry.processingStart - entry.startTime;
        });
      });
      
      try {
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (error) {
        logger.warn('FID observer not supported', error);
      }

      // Cumulative Layout Shift
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        metricsRef.current.cumulativeLayoutShift = clsValue;
      });
      
      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (error) {
        logger.warn('CLS observer not supported', error);
      }

      return () => {
        lcpObserver.disconnect();
        fidObserver.disconnect();
        clsObserver.disconnect();
      };
    }
  }, []);

  // Log performance metrics and Lottie cache stats
  useEffect(() => {
    const logMetrics = () => {
      const cacheStats = getLottieCacheStats();
      
      logger.info(`Performance metrics for ${pageName}:`, {
        metrics: metricsRef.current,
        lottieCache: cacheStats,
        timestamp: new Date().toISOString()
      });
    };

    // Log metrics after a delay to capture all measurements
    const timer = setTimeout(logMetrics, 5000);
    
    return () => clearTimeout(timer);
  }, [pageName]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up expired Lottie cache entries
      cleanupLottieCache();
    };
  }, []);

  return {
    getMetrics: () => metricsRef.current,
    getCacheStats: getLottieCacheStats
  };
};