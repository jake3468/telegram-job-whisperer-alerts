import { useState, useEffect } from 'react';

const LOGO_CACHE_KEY = 'aspirely_logo_cached';
const LOGO_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface CachedLogo {
  dataUrl: string;
  timestamp: number;
}

export const useCachedLogo = (logoUrl: string) => {
  const [cachedLogoUrl, setCachedLogoUrl] = useState<string>(() => {
    // Try to get cached logo on initial load
    try {
      const cached = localStorage.getItem(LOGO_CACHE_KEY);
      if (cached) {
        const parsedCache: CachedLogo = JSON.parse(cached);
        const isExpired = Date.now() - parsedCache.timestamp > LOGO_CACHE_DURATION;
        
        if (!isExpired) {
          return parsedCache.dataUrl;
        }
      }
    } catch (error) {
      console.warn('Failed to load cached logo:', error);
    }
    
    return logoUrl; // Fallback to original URL
  });

  useEffect(() => {
    const cacheLogoAsDataUrl = async () => {
      try {
        // Check if we already have a fresh cache
        const cached = localStorage.getItem(LOGO_CACHE_KEY);
        if (cached) {
          const parsedCache: CachedLogo = JSON.parse(cached);
          const isExpired = Date.now() - parsedCache.timestamp > LOGO_CACHE_DURATION;
          
          if (!isExpired) {
            setCachedLogoUrl(parsedCache.dataUrl);
            return;
          }
        }

        // Fetch and cache the logo
        const response = await fetch(logoUrl);
        const blob = await response.blob();
        
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          
          // Cache the data URL
          const cacheData: CachedLogo = {
            dataUrl,
            timestamp: Date.now()
          };
          
          try {
            localStorage.setItem(LOGO_CACHE_KEY, JSON.stringify(cacheData));
            setCachedLogoUrl(dataUrl);
          } catch (error) {
            console.warn('Failed to cache logo:', error);
            // If caching fails, still use the data URL
            setCachedLogoUrl(dataUrl);
          }
        };
        
        reader.readAsDataURL(blob);
      } catch (error) {
        console.warn('Failed to fetch logo for caching:', error);
        // Keep using the original URL if caching fails
        setCachedLogoUrl(logoUrl);
      }
    };

    cacheLogoAsDataUrl();
  }, [logoUrl]);

  return cachedLogoUrl;
};
