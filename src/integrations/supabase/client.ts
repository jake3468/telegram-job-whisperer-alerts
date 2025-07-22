// Enterprise-Grade Supabase Client with Unified Session Management
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://fnzloyyhzhrqsvslhhri.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuemxveXloemhycXN2c2xoaHJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5MzAyMjIsImV4cCI6MjA2NDUwNjIyMn0.xdlgb_amJ1fV31uinCFotGW00isgT5-N8zJ_gLHEKuk";

// Enterprise session management
let enterpriseSessionManager: any = null;

// Supabase client with basic session persistence for fallback
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true, // Enable basic persistence for fallback
    autoRefreshToken: false, // Keep disabled to let enterprise manager handle
    detectSessionInUrl: false,
  },
  global: {
    headers: {}
  }
});

// Set enterprise session manager (single source of truth)
export const setEnterpriseSessionManager = (manager: any) => {
  enterpriseSessionManager = manager;
};

// Enterprise-grade authenticated request with silent recovery
export const makeAuthenticatedRequest = async <T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    silentRetry?: boolean;
    operationType?: string;
  } = {}
): Promise<T> => {
  const { maxRetries = 3, silentRetry = true, operationType = 'api_request' } = options;
  let lastError: any = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Get fresh token from enterprise session manager
      let token: string | null = null;
      
      if (enterpriseSessionManager?.refreshToken) {
        token = await enterpriseSessionManager.refreshToken();
      }

      if (!token) {
        throw new Error('Authentication required');
      }

      // Create authenticated client for this request
      const authenticatedClient = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        global: {
          headers: {
            'Authorization': `Bearer ${token}`,
            'apikey': SUPABASE_PUBLISHABLE_KEY
          }
        }
      });

      // Replace global supabase methods temporarily
      const originalFrom = supabase.from.bind(supabase);
      const originalRpc = supabase.rpc.bind(supabase);
      const originalStorage = supabase.storage;
      
      try {
        // Override methods with authenticated client
        (supabase as any).from = authenticatedClient.from.bind(authenticatedClient);
        (supabase as any).rpc = authenticatedClient.rpc.bind(authenticatedClient);
        (supabase as any).storage = authenticatedClient.storage;
        
        // Execute operation
        const result = await operation();
        return result;
      } finally {
        // Always restore original methods
        (supabase as any).from = originalFrom;
        (supabase as any).rpc = originalRpc;
        (supabase as any).storage = originalStorage;
      }
    } catch (error: any) {
      lastError = error;
      
      // Silent retry for auth errors
      if (attempt < maxRetries - 1) {
        const isAuthError = error?.code === 'PGRST301' || 
                           error?.message?.includes('JWT') ||
                           error?.message?.includes('expired') ||
                           error?.status === 401;

        if (isAuthError && enterpriseSessionManager?.refreshToken) {
          // Try to refresh token silently
          await enterpriseSessionManager.refreshToken(true);
          await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)));
          continue;
        }

        // Retry network errors
        if (error?.message?.includes('fetch') || error?.message?.includes('network')) {
          await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
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
    throw new Error('Session expired. Please refresh the page.');
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
    const { data, error } = await makeAuthenticatedRequest(async () => {
      return await supabase.rpc('debug_user_auth');
    }, { operationType: 'jwt_test' });
    
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

export const createAuthenticatedStorageClient = () => {
  return supabase.storage;
};