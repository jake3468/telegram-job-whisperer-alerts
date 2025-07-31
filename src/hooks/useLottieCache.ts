import { useState, useEffect } from 'react';

interface LottieCacheEntry {
  data: any;
  timestamp: number;
}

const CACHE_KEY = 'aspirely_lottie_cache';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

class LottieCache {
  private cache: Map<string, LottieCacheEntry> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(CACHE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.cache = new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.warn('Failed to load Lottie cache from storage:', error);
    }
  }

  private saveToStorage() {
    try {
      const serialized = Object.fromEntries(this.cache);
      localStorage.setItem(CACHE_KEY, JSON.stringify(serialized));
    } catch (error) {
      console.warn('Failed to save Lottie cache to storage:', error);
    }
  }

  get(url: string): any | null {
    const entry = this.cache.get(url);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > CACHE_EXPIRY) {
      this.cache.delete(url);
      this.saveToStorage();
      return null;
    }

    return entry.data;
  }

  set(url: string, data: any) {
    this.cache.set(url, {
      data,
      timestamp: Date.now()
    });
    this.saveToStorage();
  }

  clear() {
    this.cache.clear();
    localStorage.removeItem(CACHE_KEY);
  }
}

const lottieCache = new LottieCache();

export const useLottieCache = (url: string) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const loadAnimation = async () => {
      if (!url) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      // Check cache first
      const cached = lottieCache.get(url);
      if (cached && !isCancelled) {
        setData(cached);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch animation: ${response.status}`);
        }

        const animationData = await response.json();
        
        if (!isCancelled) {
          lottieCache.set(url, animationData);
          setData(animationData);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadAnimation();

    return () => {
      isCancelled = true;
    };
  }, [url]);

  return { data, isLoading, error };
};