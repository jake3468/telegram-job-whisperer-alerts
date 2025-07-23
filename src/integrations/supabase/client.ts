
// Enterprise-Grade Supabase Client with Unified Session Management
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://fnzloyyhzhrqsvslhhri.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuemxveXloemhycXN2c2xoaHJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5MzAyMjIsImV4cCI6MjA2NDUwNjIyMn0.xdlgb_amJ1fV31uinCFotGW00isgT5-N8zJ_gLHEKuk";

// Enterprise session manager
let enterpriseSessionManager: any = null;

// Single global client instance
let globalAuthenticatedClient: any = null;
let currentAuthToken: string | null = null;

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

// Supabase client with proper session management
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: false, // Let enterprise manager handle
    detectSessionInUrl: false,
  },
  global: {
    headers: {}
  }
});

// Set enterprise session manager (single source of truth)
export const setEnterpriseSessionManager = (manager: any) => {
  enterpriseSessionManager = manager;
  console.log('[SupabaseClient] Enterprise session manager connected:', !!manager);
};

// CRITICAL FIX: Properly update client auth with JWT token
const updateClientAuth = async (token: string): Promise<void> => {
  if (!globalAuthenticatedClient) {
    globalAuthenticatedClient = supabase;
  }
  
  currentAuthToken = token;
  
  console.log('[SupabaseClient] Setting JWT token in Authorization header');
  
  // FIXED: Set the JWT token in the Authorization header for all requests
  globalAuthenticatedClient.rest.headers['Authorization'] = `Bearer ${token}`;
  
  // Also set in the global headers for consistency
  globalAuthenticatedClient.supabaseKey = token;
  
  console.log('[SupabaseClient] JWT token set in client headers');
};

// Debounced token refresh to prevent concurrent refreshes
const getValidToken = async (forceRefresh: boolean = false): Promise<string | null> => {
  // If already refreshing, wait for the existing promise
  if (isRefreshing && refreshPromise) {
    console.log('[SupabaseClient] Waiting for existing token refresh');
    return await refreshPromise;
  }

  // Check if current token is valid without forcing refresh
  if (!forceRefresh && enterpriseSessionManager?.isTokenValid?.()) {
    const token = enterpriseSessionManager.getCurrentToken?.();
    if (token) {
      console.log('[SupabaseClient] Using cached valid token');
      return token;
    }
  }

  // Start refresh process
  if (!isRefreshing) {
    isRefreshing = true;
    console.log('[SupabaseClient] Starting token refresh process');
    
    refreshPromise = (async () => {
      try {
        const token = await enterpriseSessionManager?.refreshToken?.(forceRefresh);
        if (token && token !== currentAuthToken) {
          console.log('[SupabaseClient] Got new token, updating client auth');
          await updateClientAuth(token);
        }
        return token;
      } catch (error) {
        console.error('[SupabaseClient] Token refresh failed:', error);
        return null;
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
  
  console.log('[SupabaseClient] Processing', queue.length, 'queued requests');
  
  for (const { resolve, reject, operation, options } of queue) {
    try {
      const result = await makeAuthenticatedRequest(operation, options);
      resolve(result);
    } catch (error) {
      reject(error);
    }
  }
};

// CRITICAL FIX: Enterprise-grade authenticated request with proper JWT token handling
export const makeAuthenticatedRequest = async <T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    silentRetry?: boolean;
    operationType?: string;
  } = {}
): Promise<T> => {
  const { maxRetries = 2, silentRetry = true, operationType = 'api_request' } = options;
  
  console.log(`[SupabaseClient] Starting authenticated request for ${operationType}`);
  
  // If currently refreshing, queue the request
  if (isRefreshing) {
    console.log('[SupabaseClient] Token refresh in progress, queueing request');
    return new Promise((resolve, reject) => {
      requestQueue.push({ resolve, reject, operation, options });
    });
  }

  let lastError: any = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`[SupabaseClient] Attempt ${attempt + 1}/${maxRetries} for ${operationType}`);
      
      // CRITICAL FIX: Always ensure we have a valid token before operation
      const token = await getValidToken(attempt > 0);
      
      if (!token) {
        console.error('[SupabaseClient] No token available for authenticated request');
        throw new Error('Authentication required - no token available');
      }

      // CRITICAL FIX: Ensure the token is set in the client before each request
      if (token !== currentAuthToken) {
        console.log('[SupabaseClient] Token changed, updating client auth');
        await updateClientAuth(token);
      }

      console.log('[SupabaseClient] Executing operation with authenticated client');
      const result = await operation();
      
      console.log(`[SupabaseClient] ${operationType} completed successfully`);
      
      // Process any queued requests after successful operation
      if (requestQueue.length > 0) {
        setImmediate(() => processRequestQueue());
      }
      
      return result;
    } catch (error: any) {
      lastError = error;
      console.error(`[SupabaseClient] ${operationType} failed on attempt ${attempt + 1}:`, error);
      
      // Only retry auth errors on first attempt
      if (attempt < maxRetries - 1) {
        const isAuthError = error?.code === 'PGRST301' || 
                           error?.message?.includes('JWT') ||
                           error?.message?.includes('expired') ||
                           error?.message?.includes('auth') ||
                           error?.status === 401;

        if (isAuthError) {
          console.log('[SupabaseClient] Auth error detected, forcing token refresh');
          currentAuthToken = null;
          await new Promise(resolve => setTimeout(resolve, 500));
          continue;
        }

        // Retry network errors with exponential backoff
        if (silentRetry && (error?.message?.includes('fetch') || error?.message?.includes('network'))) {
          const delay = 300 * Math.pow(2, attempt);
          console.log(`[SupabaseClient] Network error, retrying in ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      
      break; // Don't retry other types of errors
    }
  }

  console.error(`[SupabaseClient] ${operationType} failed after ${maxRetries} attempts:`, lastError);

  // Convert auth errors to user-friendly messages
  if (lastError?.code === 'PGRST301' || 
      lastError?.message?.includes('JWT') || 
      lastError?.status === 401) {
    throw new Error('Authentication failed - please refresh the page and try again');
  }

  throw lastError || new Error(`Request failed after ${maxRetries} attempts`);
};

// Legacy functions for backward compatibility
export const setTokenRefreshFunction = (refreshFn: () => Promise<string | null>) => {
  // Legacy - now handled by enterprise session manager
  console.log('[SupabaseClient] Legacy setTokenRefreshFunction called');
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
  // CRITICAL FIX: Properly handle token setting
  if (token) {
    console.log('[SupabaseClient] Setting Clerk token via legacy function');
    await updateClientAuth(token);
    return true;
  }
  return true;
};

export const getCurrentJWTToken = () => {
  // Legacy - delegate to enterprise session manager
  if (enterpriseSessionManager?.getCurrentToken) {
    return enterpriseSessionManager.getCurrentToken();
  }
  return currentAuthToken;
};

export const testJWTTransmission = async () => {
  try {
    const { data, error } = await makeAuthenticatedRequest(async () => {
      return await supabase.rpc('debug_user_auth');
    });
    
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

export const createAuthenticatedStorageClient = () => {
  return supabase.storage;
};
