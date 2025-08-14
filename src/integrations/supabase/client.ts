
// Enterprise-Grade Supabase Client with Unified Session Management
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://fnzloyyhzhrqsvslhhri.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuemxveXloemhycXN2c2xoaHJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5MzAyMjIsImV4cCI6MjA2NDUwNjIyMn0.xdlgb_amJ1fV31uinCFotGW00isgT5-N8zJ_gLHEKuk";

// Enterprise session manager
let enterpriseSessionManager: any = null;

// Singleton authenticated client cache to prevent multiple instances
let authenticatedClientCache: { 
  client: any; 
  token: string; 
  expiry: number; 
} | null = null;

// Global refresh lock to prevent concurrent token refreshes
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

// Request queue during token refresh
let requestQueue: Array<{
  resolve: (value: any) => void;
  reject: (error: any) => void;
  operation: () => Promise<any>;
  options: any;
}> = [];

// Supabase client with proper session management (singleton pattern)
let singletonClient: any = null;

export const supabase = (() => {
  if (!singletonClient) {
    singletonClient = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        persistSession: false, // Prevent session conflicts
        autoRefreshToken: false, // Let enterprise manager handle
        detectSessionInUrl: false,
        flowType: 'implicit'
      },
      global: {
        headers: {}
      }
    });
  }
  return singletonClient;
})();

// Set enterprise session manager (single source of truth)
export const setEnterpriseSessionManager = (manager: any) => {
  enterpriseSessionManager = manager;
};

// Helper to get or create singleton authenticated client
const getAuthenticatedClient = async (): Promise<any> => {
  // Get current token from session manager
  const currentToken = enterpriseSessionManager?.getCurrentToken?.() || null;
  
  if (!currentToken) {
    throw new Error('Authentication required');
  }

  // Check if we can reuse existing client
  if (authenticatedClientCache && 
      authenticatedClientCache.token === currentToken && 
      authenticatedClientCache.expiry > Date.now()) {
    return authenticatedClientCache.client;
  }

  // Clear any previous cached client to prevent multiple instances
  if (authenticatedClientCache) {
    authenticatedClientCache = null;
  }

  // Create new authenticated client and cache it
  const authenticatedClient = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      flowType: 'implicit'
    },
    global: {
      headers: {
        'Authorization': `Bearer ${currentToken}`,
        'apikey': SUPABASE_PUBLISHABLE_KEY
      }
    }
  });

  // Cache the client with token and expiry (2 minute cache to reduce conflicts)
  authenticatedClientCache = {
    client: authenticatedClient,
    token: currentToken,
    expiry: Date.now() + (2 * 60 * 1000)
  };

  return authenticatedClient;
};

// Debounced token refresh to prevent concurrent refreshes
const getValidToken = async (forceRefresh: boolean = false): Promise<string | null> => {
  // If already refreshing, wait for the existing promise
  if (isRefreshing && refreshPromise) {
    return await refreshPromise;
  }

  // Check if current token is valid without forcing refresh
  if (!forceRefresh && enterpriseSessionManager?.isTokenValid?.()) {
    return enterpriseSessionManager.getCurrentToken?.() || null;
  }

  // Start refresh process
  if (!isRefreshing) {
    isRefreshing = true;
    refreshPromise = (async () => {
      try {
        const token = await enterpriseSessionManager?.refreshToken?.(forceRefresh);
        // Clear cached client when token changes
        if (authenticatedClientCache && authenticatedClientCache.token !== token) {
          authenticatedClientCache = null;
        }
        return token;
      } finally {
        isRefreshing = false;
        refreshPromise = null;
      }
    })();
  }

  return await refreshPromise;
};

// Process queued requests after token refresh
const processRequestQueue = async () => {
  const queue = [...requestQueue];
  requestQueue = [];
  
  for (const { resolve, reject, operation, options } of queue) {
    try {
      const result = await makeAuthenticatedRequest(operation, options);
      resolve(result);
    } catch (error) {
      reject(error);
    }
  }
};

// Enterprise-grade authenticated request with singleton client pattern
export const makeAuthenticatedRequest = async <T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    silentRetry?: boolean;
    operationType?: string;
  } = {}
): Promise<T> => {
  const { maxRetries = 2, silentRetry = true, operationType = 'api_request' } = options;
  
  // If currently refreshing, queue the request
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      requestQueue.push({ resolve, reject, operation, options });
    });
  }

  let lastError: any = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Get valid token (smart validation)
      const token = await getValidToken(attempt > 0);
      
      if (!token) {
        throw new Error('Authentication required');
      }

      // Get singleton authenticated client
      const authenticatedClient = await getAuthenticatedClient();

      // Execute operation with method binding instead of creating new clients
      const originalFrom = supabase.from;
      const originalRpc = supabase.rpc;
      
      try {
        // Temporarily bind authenticated methods (avoid storage as it's read-only)
        (supabase as any).from = authenticatedClient.from.bind(authenticatedClient);
        (supabase as any).rpc = authenticatedClient.rpc.bind(authenticatedClient);
        
        // Execute operation with bound methods
        const result = await operation();
        
        // Process any queued requests after successful operation
        if (requestQueue.length > 0) {
          setImmediate(() => processRequestQueue());
        }
        
        return result;
      } finally {
        // Always restore original methods
        (supabase as any).from = originalFrom;
        (supabase as any).rpc = originalRpc;
        // Don't restore storage as we never modified it
      }
    } catch (error: any) {
      lastError = error;
      
      // Only retry auth errors on first attempt
      if (attempt < maxRetries - 1) {
        const isAuthError = error?.code === 'PGRST301' || 
                           error?.message?.includes('JWT') ||
                           error?.message?.includes('expired') ||
                           error?.status === 401;

        if (isAuthError) {
          // Force token refresh and clear cache
          authenticatedClientCache = null;
          await new Promise(resolve => setTimeout(resolve, 200));
          continue;
        }

        // Retry network errors with exponential backoff
        if (silentRetry && (error?.message?.includes('fetch') || error?.message?.includes('network'))) {
          await new Promise(resolve => setTimeout(resolve, 300 * Math.pow(2, attempt)));
          continue;
        }
      }
      
      break; // Don't retry other types of errors
    }
  }

  // Convert auth errors to user-friendly messages
  if (lastError?.code === 'PGRST301' || 
      lastError?.message?.includes('JWT') || 
      lastError?.status === 401) {
    throw new Error('Please try again');
  }

  throw lastError || new Error(`Request failed after ${maxRetries} attempts`);
};

// Legacy functions for backward compatibility (minimal implementations)
export const setTokenRefreshFunction = (refreshFn: () => Promise<string | null>) => {
  // Legacy - now handled by enterprise session manager
};

export const setEnhancedTokenManager = (manager: any) => {
  // Legacy - redirect to new function
  setEnterpriseSessionManager(manager);
};

export const refreshJWTToken = async (): Promise<string | null> => {
  // Legacy - delegate to enterprise session manager
  if (enterpriseSessionManager?.refreshToken) {
    return await enterpriseSessionManager.refreshToken(true);
  }
  return null;
};

export const setClerkToken = async (token: string | null) => {
  // Legacy - now handled by enterprise session manager
  return true;
};

export const getCurrentJWTToken = () => {
  // Legacy - delegate to enterprise session manager
  if (enterpriseSessionManager?.getCurrentToken) {
    return enterpriseSessionManager.getCurrentToken();
  }
  return null;
};

export const testJWTTransmission = async () => {
  try {
    console.log('🧪 Testing JWT transmission to Supabase...');
    
    // First check if we have session manager
    if (!enterpriseSessionManager) {
      return { data: null, error: 'Session manager not connected' };
    }
    
    // Check current token
    const currentToken = enterpriseSessionManager.getCurrentToken?.();
    console.log('🔑 Current token available:', !!currentToken);
    
    if (!currentToken) {
      return { data: null, error: 'No current token available' };
    }
    
    // Test the authenticated request pipeline
    const { data, error } = await makeAuthenticatedRequest(async () => {
      console.log('📡 Making RPC call to debug_user_auth...');
      return await supabase.rpc('debug_user_auth');
    }, { operationType: 'jwt_test' });
    
    console.log('📊 JWT Test Result:', { data, error });
    return { data, error };
  } catch (error) {
    console.error('❌ JWT Test Error:', error);
    return { data: null, error: error.message };
  }
};

export const createAuthenticatedStorageClient = () => {
  return supabase.storage;
};
