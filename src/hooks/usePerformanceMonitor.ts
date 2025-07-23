
import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  jwtRefreshCount: number;
  jwtFailureCount: number;
  webhookSuccessCount: number;
  webhookFailureCount: number;
  componentRenderCount: number;
  lastActivity: number;
}

const performanceMetrics: PerformanceMetrics = {
  jwtRefreshCount: 0,
  jwtFailureCount: 0,
  webhookSuccessCount: 0,
  webhookFailureCount: 0,
  componentRenderCount: 0,
  lastActivity: Date.now()
};

export const usePerformanceMonitor = (componentName: string) => {
  const renderCountRef = useRef(0);

  useEffect(() => {
    renderCountRef.current++;
    performanceMetrics.componentRenderCount++;
    performanceMetrics.lastActivity = Date.now();
    
    // Log excessive renders in development
    if (process.env.NODE_ENV === 'development' && renderCountRef.current > 10) {
      console.warn(`[PerformanceMonitor] ${componentName} has rendered ${renderCountRef.current} times`);
    }
  });

  const trackJWTRefresh = (success: boolean) => {
    if (success) {
      performanceMetrics.jwtRefreshCount++;
    } else {
      performanceMetrics.jwtFailureCount++;
    }
  };

  const trackWebhookCall = (success: boolean) => {
    if (success) {
      performanceMetrics.webhookSuccessCount++;
    } else {
      performanceMetrics.webhookFailureCount++;
    }
  };

  const getMetrics = () => ({ ...performanceMetrics });

  return {
    trackJWTRefresh,
    trackWebhookCall,
    getMetrics,
    renderCount: renderCountRef.current
  };
};
