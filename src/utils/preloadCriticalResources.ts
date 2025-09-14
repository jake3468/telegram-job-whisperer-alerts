// Preload critical resources for faster initial page load
export const preloadCriticalResources = () => {
  // Preload critical fonts
  const fontUrls = [
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
  ];
  
  fontUrls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = url;
    document.head.appendChild(link);
  });

  // Preload critical animation (only telegram for hero)
  const criticalAnimations = [
    'https://fnzloyyhzhrqsvslhhri.supabase.co/storage/v1/object/public/animations/telegram.json'
  ];
  
  criticalAnimations.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
  });

  // Preconnect to external domains
  const externalDomains = [
    'https://fnzloyyhzhrqsvslhhri.supabase.co',
    'https://images.unsplash.com',
    'https://www.youtube.com'
  ];
  
  externalDomains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = domain;
    document.head.appendChild(link);
  });
};

// Initialize resource hints for better performance
export const initializePerformanceOptimizations = () => {
  // Preload critical resources
  preloadCriticalResources();
  
  // Add performance observer for monitoring
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'largest-contentful-paint') {
            console.log('LCP:', entry.startTime);
          }
          if (entry.entryType === 'first-input' && 'processingStart' in entry) {
            const fidEntry = entry as any;
            console.log('FID:', fidEntry.processingStart - entry.startTime);
          }
        }
      });
      
      observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input'] });
    } catch (e) {
      // Silently fail if performance observer is not supported
    }
  }

  // Enable requestIdleCallback for non-critical work
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => {
      // Prefetch non-critical resources during idle time
      const nonCriticalResources = [
        'https://fnzloyyhzhrqsvslhhri.supabase.co/storage/v1/object/public/animations/business%20workshop.json',
        'https://fnzloyyhzhrqsvslhhri.supabase.co/storage/v1/object/public/animations/alerts%20job.json'
      ];
      
      nonCriticalResources.forEach(url => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        document.head.appendChild(link);
      });
    });
  }
};