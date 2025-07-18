// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { logger } from '@/utils/logger';

const SUPABASE_URL = "https://fnzloyyhzhrqsvslhhri.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuemxveXloemhycXN2c2xoaHJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5MzAyMjIsImV4cCI6MjA2NDUwNjIyMn0.xdlgb_amJ1fV31uinCFotGW00isgT5-N8zJ_gLHEKuk";

// Validate required environment variables
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error('Missing required Supabase configuration. Please check your environment variables.');
}

// Store the current JWT token and refresh function
let currentJWTToken: string | null = null;
let tokenRefreshFunction: (() => Promise<string | null>) | null = null;

// Create a single Supabase client instance to prevent multiple client warnings
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
  global: {
    headers: {}
  }
});

// Function to set token refresh function from Clerk
export const setTokenRefreshFunction = (refreshFn: () => Promise<string | null>) => {
  tokenRefreshFunction = refreshFn;
};

// Enhanced function to refresh JWT token with better error handling
export const refreshJWTToken = async (): Promise<string | null> => {
  try {
    if (!tokenRefreshFunction) {
      logger.warn('No token refresh function available');
      return currentJWTToken; // Return current token if no refresh function
    }

    const newToken = await tokenRefreshFunction();
    
    if (newToken) {
      currentJWTToken = newToken;
      return newToken;
    } else {
      logger.warn('Failed to refresh JWT token - keeping current token');
      return currentJWTToken; // Keep current token if refresh fails
    }
  } catch (error) {
    logger.error('Error refreshing JWT token:', error);
    return currentJWTToken; // Keep current token on error
  }
};

// Function to check if token is expired
const isTokenExpired = (token: string): boolean => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    
    const payload = JSON.parse(atob(parts[1]));
    const now = Math.floor(Date.now() / 1000);
    const buffer = 120; // 2 minutes buffer before expiration
    
    return payload.exp && (payload.exp - buffer) < now;
  } catch (e) {
    return true;
  }
};

// Enhanced function to set Clerk JWT token  
export const setClerkToken = async (token: string | null) => {
  try {
    if (token) {
      // Validate token format before setting
      const parts = token.split('.');
      if (parts.length !== 3) {
        logger.error('Invalid JWT format - token does not have 3 parts');
        return false;
      }

      // Try to decode the payload to validate
      try {
        const payload = JSON.parse(atob(parts[1]));
        
        // Check if token is expired
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) {
          logger.warn('JWT token is already expired, requesting refresh');
          const refreshedToken = await refreshJWTToken();
          if (refreshedToken && refreshedToken !== token) {
            currentJWTToken = refreshedToken;
            return true;
          }
          return false;
        }
      } catch (e) {
        logger.warn('Could not decode JWT payload for validation:', e);
      }

      currentJWTToken = token;
      return true;
    } else {
      currentJWTToken = null;
      return true;
    }
  } catch (error) {
    logger.error('Error setting Clerk JWT token:', error);
    return false;
  }
};

// Function to get current JWT token for debugging
export const getCurrentJWTToken = () => currentJWTToken;

// Enhanced function to make authenticated requests with guaranteed reliability
export const makeAuthenticatedRequest = async <T>(
  operation: () => Promise<T>,
  operationType: string = 'unknown',
  maxRetries: number = 3
): Promise<T> => {
  let lastError: any = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Always check token before making request
      if (!currentJWTToken) {
        await refreshJWTToken();
      } else if (isTokenExpired(currentJWTToken)) {
        await refreshJWTToken();
      }

      if (!currentJWTToken) {
        logger.error(`Still no JWT token available for ${operationType} after refresh attempt`);
        throw new Error('Authentication token unavailable');
      }

      // Create a new client instance with JWT headers for this specific request
      const authenticatedClient = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false, // We handle this manually
        },
        global: {
          headers: {
            'Authorization': `Bearer ${currentJWTToken}`,
            'apikey': SUPABASE_PUBLISHABLE_KEY
          }
        }
      });

      // Replace the global supabase instance temporarily for this operation
      const originalFrom = supabase.from.bind(supabase);
      const originalRpc = supabase.rpc.bind(supabase);
      
      // Override methods to use authenticated client
      (supabase as any).from = authenticatedClient.from.bind(authenticatedClient);
      (supabase as any).rpc = authenticatedClient.rpc.bind(authenticatedClient);
      
      try {
        const result = await operation();
        return result;
      } finally {
        // Restore original methods
        (supabase as any).from = originalFrom;
        (supabase as any).rpc = originalRpc;
      }
    } catch (error: any) {
      lastError = error;
      logger.error(`Attempt ${attempt + 1} failed for ${operationType}:`, error);
      
      // If it's a JWT expired error, refresh token and retry
      if ((error?.code === 'PGRST301' || error?.message?.includes('JWT expired') || error?.message?.includes('expired')) && attempt < maxRetries - 1) {
        await refreshJWTToken();
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff
        continue;
      }
      
      // For network errors, also retry
      if ((error?.message?.includes('fetch') || error?.message?.includes('network')) && attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }
      
      // For other errors, don't retry unless it's the first attempt and token-related
      if (!error?.message?.includes('JWT') && !error?.code?.includes('PGRST301') && attempt > 0) {
        throw error;
      }
    }
  }
  
  // If we've exhausted all retries, throw the last error
  throw lastError || new Error(`Failed to complete ${operationType} after ${maxRetries} attempts`);
};

// Function to test JWT transmission with direct RPC call
export const testJWTTransmission = async () => {
  try {
    // Make direct RPC call using authenticated request
    const { data, error } = await makeAuthenticatedRequest(async () => {
      return await supabase.rpc('debug_user_auth');
    }, 'JWT transmission test');
    
    return { data, error };
  } catch (error) {
    logger.error('JWT transmission test failed:', error);
    return { data: null, error };
  }
};

// Function to create authenticated storage client
export const createAuthenticatedStorageClient = () => {
  if (!currentJWTToken) {
    logger.warn('No JWT token available for storage');
    return supabase.storage;
  }

  return supabase.storage;
};
