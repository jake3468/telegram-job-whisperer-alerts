import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '@/utils/logger';

interface LottieOptimizedState {
  animationData: any;
  isLoading: boolean;
  hasError: boolean;
  LottieComponent: React.ComponentType<any> | null;
}

interface LottieConfig {
  url: string;
  preload?: boolean;
  priority?: 'high' | 'medium' | 'low';
  fallbackImage?: string;
  retryCount?: number;
  cacheKey?: string;
}

// Animation cache with versioning
const animationCache = new Map<string, { data: any; timestamp: number; version: string }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_VERSION = '1.0';

// Memory cache for Lottie component
let lottieComponentCache: React.ComponentType<any> | null = null;
let lottieLoadPromise: Promise<React.ComponentType<any>> | null = null;

// IndexedDB cache for persistent storage
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('LottieAnimationCache', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('animations')) {
        db.createObjectStore('animations', { keyPath: 'url' });
      }
    };
  });
};

const cacheToIndexedDB = async (url: string, data: any): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(['animations'], 'readwrite');
    const store = transaction.objectStore('animations');
    
    return new Promise((resolve, reject) => {
      const request = store.put({
        url,
        data,
        timestamp: Date.now(),
        version: CACHE_VERSION
      });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    logger.error('Failed to cache animation to IndexedDB:', error);
  }
};

const getFromIndexedDB = async (url: string): Promise<any | null> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(['animations'], 'readonly');
    const store = transaction.objectStore('animations');
    
    return new Promise((resolve, reject) => {
      const request = store.get(url);
      
      request.onsuccess = () => {
        const result = request.result;
        
        if (result && 
            result.version === CACHE_VERSION && 
            (Date.now() - result.timestamp) < CACHE_DURATION) {
          resolve(result.data);
          return;
        }
        
        // Clean up expired cache
        if (result && (Date.now() - result.timestamp) >= CACHE_DURATION) {
          const deleteTransaction = db.transaction(['animations'], 'readwrite');
          const deleteStore = deleteTransaction.objectStore('animations');
          deleteStore.delete(url);
        }
        
        resolve(null);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    logger.error('Failed to get animation from IndexedDB:', error);
    return null;
  }
};

const loadLottieComponent = async (): Promise<React.ComponentType<any>> => {
  if (lottieComponentCache) {
    return lottieComponentCache;
  }
  
  if (lottieLoadPromise) {
    return lottieLoadPromise;
  }
  
  lottieLoadPromise = import('lottie-react').then(module => {
    lottieComponentCache = module.default;
    return module.default;
  });
  
  return lottieLoadPromise;
};

const fetchWithCache = async (url: string, retryCount: number = 3): Promise<any> => {
  const cacheKey = `${url}_${CACHE_VERSION}`;
  
  // Check memory cache first
  const cachedData = animationCache.get(cacheKey);
  if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION) {
    return cachedData.data;
  }
  
  // Check IndexedDB cache
  const indexedDBData = await getFromIndexedDB(url);
  if (indexedDBData) {
    // Update memory cache
    animationCache.set(cacheKey, {
      data: indexedDBData,
      timestamp: Date.now(),
      version: CACHE_VERSION
    });
    return indexedDBData;
  }
  
  // Fetch with force-cache and retry logic
  for (let attempt = 0; attempt < retryCount; attempt++) {
    try {
      const response = await fetch(url, {
        cache: 'force-cache',
        headers: {
          'Cache-Control': 'max-age=86400, stale-while-revalidate=3600'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Cache the data
      animationCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        version: CACHE_VERSION
      });
      
      // Async cache to IndexedDB
      cacheToIndexedDB(url, data);
      
      return data;
    } catch (error) {
      logger.warn(`Attempt ${attempt + 1} failed for ${url}:`, error);
      
      if (attempt === retryCount - 1) {
        throw error;
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
};

export const useLottieOptimized = (config: LottieConfig): LottieOptimizedState => {
  const [state, setState] = useState<LottieOptimizedState>({
    animationData: null,
    isLoading: true,
    hasError: false,
    LottieComponent: null
  });
  
  const configRef = useRef(config);
  configRef.current = config;
  
  const loadAnimation = useCallback(async () => {
    const { url, retryCount = 3 } = configRef.current;
    
    setState(prev => ({ ...prev, isLoading: true, hasError: false }));
    
    try {
      // Load Lottie component and animation data in parallel
      const [LottieComponent, animationData] = await Promise.all([
        loadLottieComponent(),
        fetchWithCache(url, retryCount)
      ]);
      
      setState({
        animationData,
        isLoading: false,
        hasError: false,
        LottieComponent
      });
    } catch (error) {
      logger.error(`Failed to load Lottie animation for ${url}:`, error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        hasError: true
      }));
    }
  }, []);
  
  useEffect(() => {
    if (config.url) {
      loadAnimation();
    }
  }, [config.url, loadAnimation]);
  
  return state;
};

// Preloader service for preemptive loading
export const preloadLottieAnimation = async (url: string, priority: 'high' | 'medium' | 'low' = 'medium'): Promise<void> => {
  const loadAnimation = async () => {
    try {
      await Promise.all([
        loadLottieComponent(),
        fetchWithCache(url, 2) // Fewer retries for preloading
      ]);
      logger.info(`Preloaded Lottie animation: ${url}`);
    } catch (error) {
      logger.warn(`Failed to preload Lottie animation: ${url}`, error);
    }
  };
  
  // Use different scheduling based on priority
  switch (priority) {
    case 'high':
      return loadAnimation();
    case 'medium':
      return new Promise(resolve => {
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => {
            loadAnimation().finally(() => resolve());
          });
        } else {
          setTimeout(() => {
            loadAnimation().finally(() => resolve());
          }, 100);
        }
      });
    case 'low':
      return new Promise(resolve => {
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => {
            loadAnimation().finally(() => resolve());
          }, { timeout: 5000 });
        } else {
          setTimeout(() => {
            loadAnimation().finally(() => resolve());
          }, 1000);
        }
      });
  }
};

// Clean up expired cache entries
export const cleanupLottieCache = (): void => {
  const now = Date.now();
  for (const [key, value] of animationCache.entries()) {
    if (now - value.timestamp >= CACHE_DURATION) {
      animationCache.delete(key);
    }
  }
};

// Performance monitoring
export const getLottieCacheStats = () => {
  return {
    memoryCacheSize: animationCache.size,
    memoryEntries: Array.from(animationCache.keys()),
    componentCached: !!lottieComponentCache
  };
};