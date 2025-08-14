
// Enterprise-Grade Supabase Client with Unified Session Management
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://fnzloyyhzhrqsvslhhri.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuemxveXloemhycXN2c2xoaHJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5MzAyMjIsImV4cCI6MjA2NDUwNjIyMn0.xdlgb_amJ1fV31uinCFotGW00isgT5-N8zJ_gLHEKuk";

// Enterprise session manager
let enterpriseSessionManager: any = null;

// Request queue during token refresh
let requestQueue: Array<{
  resolve: (value: any) => void;
  reject: (error: any) => void;
  operation: () => Promise<any>;
  options: any;
}> = [];

// Global refresh state
let isRefreshing = false;

// Main Supabase client (singleton) 
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
    flowType: 'implicit'
  },
  global: {
    headers: {
      'apikey': SUPABASE_PUBLISHABLE_KEY
    }
  }
});

// Set enterprise session manager (single source of truth)
export const setEnterpriseSessionManager = (manager: any) => {
  enterpriseSessionManager = manager;
};

// Simple token injection into main client
const injectTokenIntoClient = (token: string | null) => {
  try {
    if (token) {
      // Set authorization header on global client
      (supabase as any).supabaseKey = SUPABASE_PUBLISHABLE_KEY;
      (supabase as any).supabaseUrl = SUPABASE_URL;
      
      // Set headers on the REST client
      (supabase as any).rest.headers = {
        'apikey': SUPABASE_PUBLISHABLE_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      };
      
      console.debug('✅ Token injected successfully');
      console.debug('📋 Headers set:', Object.keys((supabase as any).rest.headers));
    } else {
      // Reset to default headers
      (supabase as any).rest.headers = {
        'apikey': SUPABASE_PUBLISHABLE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      };
      
      console.debug('🔓 Token removed from Supabase client');
    }
  } catch (error) {
    console.error('❌ Error injecting token:', error);
  }
};

// Get and inject valid token
const ensureValidToken = async (forceRefresh: boolean = false): Promise<string | null> => {
  if (!enterpriseSessionManager) {
    return null;
  }

  let token = null;
  
  if (!forceRefresh && enterpriseSessionManager.isTokenValid?.()) {
    token = enterpriseSessionManager.getCurrentToken?.();
  } else {
    token = await enterpriseSessionManager.refreshToken?.(forceRefresh);
  }
  
  // Inject token into the main client
  injectTokenIntoClient(token);
  
  return token;
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

// Simplified authenticated request with direct token injection
export const makeAuthenticatedRequest = async <T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    silentRetry?: boolean;
    operationType?: string;
  } = {}
): Promise<T> => {
  const { maxRetries = 2, silentRetry = true } = options;
  
  // If currently refreshing, queue the request
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      requestQueue.push({ resolve, reject, operation, options });
    });
  }

  let lastError: any = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Ensure we have a valid token and inject it before EVERY operation
      const token = await ensureValidToken(attempt > 0);
      
      if (!token) {
        throw new Error('Authentication required - please sign in');
      }

      // Force inject token right before operation with explicit logging
      console.debug(`🔧 Injecting token for attempt ${attempt + 1}:`, token.substring(0, 30) + '...');
      injectTokenIntoClient(token);

      // Execute operation with fresh token injection
      const result = await operation();
      
      // Process any queued requests after successful operation
      if (requestQueue.length > 0) {
        setTimeout(() => processRequestQueue(), 0);
      }
      
      return result;
    } catch (error: any) {
      lastError = error;
      
      // Only retry auth errors on first attempt
      if (attempt < maxRetries - 1) {
        const isAuthError = error?.code === 'PGRST301' || 
                           error?.message?.includes('JWT') ||
                           error?.message?.includes('expired') ||
                           error?.status === 401;

        if (isAuthError) {
          // Force token refresh on auth error and clear cache
          isRefreshing = true;
          try {
            await ensureValidToken(true);
          } finally {
            isRefreshing = false;
          }
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
    throw new Error('Please sign in again');
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
  // Inject token directly into the main client and log for debugging
  console.debug('🔑 Setting Clerk token in Supabase client:', !!token);
  if (token) {
    console.debug('Token length:', token.length);
    console.debug('Token preview:', token.substring(0, 50) + '...');
  }
  injectTokenIntoClient(token);
  
  // Test the connection immediately
  try {
    const { data, error } = await supabase.rpc('debug_user_auth');
    console.debug('🧪 Auth test result:', { data, error });
  } catch (testError) {
    console.warn('⚠️ Auth test failed:', testError);
  }
  
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
    // Ensure we have a valid token
    const token = await ensureValidToken(true);
    
    if (!token) {
      return { data: null, error: 'No token available' };
    }
    
    // Test the authenticated request pipeline
    const { data, error } = await makeAuthenticatedRequest(async () => {
      return await supabase.rpc('debug_user_auth');
    });
    
    return { data, error };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

export const createAuthenticatedStorageClient = () => {
  return supabase.storage;
};
