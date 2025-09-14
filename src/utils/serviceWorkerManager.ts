// Service Worker registration and management
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });

    console.log('Service Worker registered successfully');

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New content is available, prompt user to refresh
            if (confirm('New content is available. Refresh to update?')) {
              window.location.reload();
            }
          }
        });
      }
    });

    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
};

// Preload critical resources
export const preloadCriticalResources = () => {
  const criticalResources = [
    { href: '/', as: 'document' },
    { href: '/manifest.json', as: 'fetch', crossorigin: 'anonymous' }
  ];

  criticalResources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = resource.href;
    if (resource.as) link.as = resource.as;
    if (resource.crossorigin) link.crossOrigin = resource.crossorigin;
    document.head.appendChild(link);
  });
};

// Performance monitoring
export const initializePerformanceMonitoring = () => {
  if ('PerformanceObserver' in window) {
    // Monitor Core Web Vitals
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const metricName = entry.name;
        const value = Math.round(entry.startTime);
        
        // Log performance metrics (in production, send to analytics)
        console.log(`${metricName}: ${value}ms`);
        
        // Track specific metrics
        if (metricName === 'first-contentful-paint' && value > 2000) {
          console.warn('FCP is slower than recommended (>2s)');
        }
        
        if (metricName === 'largest-contentful-paint' && value > 2500) {
          console.warn('LCP is slower than recommended (>2.5s)');
        }
      }
    });

    try {
      observer.observe({ 
        entryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] 
      });
    } catch (e) {
      // Fallback for older browsers
      console.log('Performance Observer not fully supported');
    }
  }
};