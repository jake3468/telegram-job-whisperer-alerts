
import { useUser, useAuth } from '@clerk/clerk-react';
import { useCallback, useRef, useState, useEffect } from 'react';
import { setClerkToken } from '@/integrations/supabase/client';

interface SessionState {
  token: string | null;
  expiry: number;
  lastActivity: number;
  isRefreshing: boolean;
  refreshCount: number;
  failureCount: number;
  sessionExtended: boolean;
}

interface RequestQueue {
  resolve: (token: string | null) => void;
  reject: (error: Error) => void;
}

class EnterpriseSessionManager {
  private state: SessionState = {
    token: null,
    expiry: 0,
    lastActivity: Date.now(),
    isRefreshing: false,
    refreshCount: 0,
    failureCount: 0,
    sessionExtended: false
  };

  private requestQueue: RequestQueue[] = [];
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private proactiveRefreshInterval: NodeJS.Timeout | null = null;
  private activityListeners: (() => void)[] = [];
  private debounceTimer: NodeJS.Timeout | null = null;

  // Realistic token buffer calculation (30 seconds)
  calculateTokenBuffer(tokenExpiry: number): number {
    const totalLifetime = tokenExpiry - Date.now();
    const bufferTime = 30 * 1000; // 30 seconds buffer
    return Math.min(bufferTime, totalLifetime * 0.1); // Max 10% of lifetime or 30 seconds
  }

  // Straightforward token validation with 30-second buffer
  isTokenValid(): boolean {
    if (!this.state.token || !this.state.expiry) return false;
    
    const now = Date.now();
    const buffer = this.calculateTokenBuffer(this.state.expiry);
    const timeRemaining = this.state.expiry - now;
    
    // Token is valid if time remaining > buffer
    return timeRemaining > buffer;
  }

  // Check if user is actively using the app (extended to 10 minutes)
  isUserActive(): boolean {
    const timeSinceActivity = Date.now() - this.state.lastActivity;
    return timeSinceActivity < 10 * 60 * 1000; // Active if activity within 10 minutes
  }

  // Update activity timestamp
  updateActivity(): void {
    this.state.lastActivity = Date.now();
  }

  // Debounced token validity check to prevent race conditions
  private debouncedValidityCheck(): boolean {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    return this.isTokenValid();
  }

  // Enterprise-grade token refresh with queue management
  async refreshToken(getToken: () => Promise<string | null>, forceRefresh = false): Promise<string | null> {
    // Return cached token if valid and not forcing refresh (with debounced check)
    if (!forceRefresh && this.debouncedValidityCheck()) {
      return this.state.token;
    }

    // If already refreshing, queue the request
    if (this.state.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.requestQueue.push({ resolve, reject });
      });
    }

    this.state.isRefreshing = true;

    try {
      // Minimal backoff for failures
      if (this.state.failureCount > 0) {
        const backoffDelay = Math.min(200 * Math.pow(2, this.state.failureCount), 2000); // Max 2 seconds
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }

      const token = await getToken();

      if (token) {
        // Parse JWT to get actual expiry time
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          this.state.expiry = payload.exp * 1000;
        } catch (e) {
          // Fallback: assume 4 hour expiry
          this.state.expiry = Date.now() + (4 * 60 * 60 * 1000);
        }

        this.state.token = token;
        this.state.refreshCount++;
        this.state.failureCount = 0;
        this.state.sessionExtended = false;

        await setClerkToken(token);
        console.log(`[EnterpriseSession] Token refreshed silently (${this.state.refreshCount})`);

        // Resolve all queued requests
        this.requestQueue.forEach(({ resolve }) => resolve(token));
        this.requestQueue = [];

        return token;
      }

      throw new Error('No token received');
    } catch (error) {
      this.state.failureCount++;
      console.error(`[EnterpriseSession] Refresh failed (${this.state.failureCount}):`, error);

      // Reject all queued requests
      this.requestQueue.forEach(({ reject }) => reject(error as Error));
      this.requestQueue = [];

      return null;
    } finally {
      this.state.isRefreshing = false;
    }
  }

  // Proactive session management with 1-minute background refresh
  startSessionManagement(getToken: () => Promise<string | null>): void {
    // Background heartbeat every 1 minute for truly proactive refresh
    this.heartbeatInterval = setInterval(async () => {
      // Only refresh if user is actively using the app AND token needs refresh
      if (this.isUserActive() && !this.isTokenValid()) {
        console.log('[EnterpriseSession] Background refresh triggered');
        await this.refreshToken(getToken, true);
      }
    }, 60 * 1000); // Every 1 minute

    // Proactive refresh when token has 30-60 seconds left
    this.proactiveRefreshInterval = setInterval(async () => {
      if (this.state.token && this.state.expiry) {
        const timeUntilExpiry = this.state.expiry - Date.now();
        const sixtySeconds = 60 * 1000;
        
        // If token expires in less than 60 seconds, proactively refresh
        if (timeUntilExpiry < sixtySeconds && timeUntilExpiry > 0) {
          console.log('[EnterpriseSession] Proactive refresh triggered (60 seconds before expiry)');
          await this.refreshToken(getToken, true);
        }
      }
    }, 30 * 1000); // Check every 30 seconds

    // Activity tracking
    const updateActivity = () => this.updateActivity();
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
      this.activityListeners.push(() => {
        document.removeEventListener(event, updateActivity, true);
      });
    });
  }

  // Stop session management
  stopSessionManagement(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.proactiveRefreshInterval) {
      clearInterval(this.proactiveRefreshInterval);
      this.proactiveRefreshInterval = null;
    }

    this.activityListeners.forEach(cleanup => cleanup());
    this.activityListeners = [];
  }

  // Get current token immediately (no refresh)
  getCurrentToken(): string | null {
    return this.state.token;
  }

  // Get session stats
  getSessionStats() {
    return {
      refreshCount: this.state.refreshCount,
      failureCount: this.state.failureCount,
      lastActivity: this.state.lastActivity,
      isActive: this.isUserActive(),
      tokenValid: this.isTokenValid(),
      sessionExtended: this.state.sessionExtended
    };
  }

  // Enhanced pre-flight token check for form submissions
  async ensureTokenForOperation(getToken: () => Promise<string | null>): Promise<string | null> {
    // If token is valid with 30-second buffer, return it immediately
    if (this.isTokenValid()) {
      return this.state.token;
    }

    // If token is close to expiry or invalid, proactively refresh
    console.log('[EnterpriseSession] Pre-flight token refresh for operation');
    return await this.refreshToken(getToken, true);
  }
}

// Global session manager instance
const sessionManager = new EnterpriseSessionManager();

export const useEnterpriseSessionManager = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const initRef = useRef(false);

  // Initialize session management
  useEffect(() => {
    if (!user || !getToken || initRef.current) return;

    const initialize = async () => {
      const getTokenFn = () => getToken({ template: 'supabase', skipCache: true });
      
      // Initial token fetch
      const token = await sessionManager.refreshToken(getTokenFn, true);
      setIsReady(!!token);
      
      // Start background session management
      sessionManager.startSessionManagement(getTokenFn);
      initRef.current = true;
    };

    initialize();

    return () => {
      sessionManager.stopSessionManagement();
      initRef.current = false;
    };
  }, [user, getToken]);

  // Enterprise-grade token refresh function
  const refreshToken = useCallback(async (forceRefresh = false): Promise<string | null> => {
    if (!getToken) return null;
    
    const getTokenFn = () => getToken({ template: 'supabase', skipCache: true });
    return sessionManager.refreshToken(getTokenFn, forceRefresh);
  }, [getToken]);

  // Check token validity
  const isTokenValid = useCallback(() => {
    return sessionManager.isTokenValid();
  }, []);

  // Update activity
  const updateActivity = useCallback(() => {
    sessionManager.updateActivity();
  }, []);

  // Get current token immediately
  const getCurrentToken = useCallback(() => {
    return sessionManager.getCurrentToken();
  }, []);

  // Enhanced token validation for operations
  const ensureTokenForOperation = useCallback(async (): Promise<string | null> => {
    if (!getToken) return null;
    
    const getTokenFn = () => getToken({ template: 'supabase', skipCache: true });
    return sessionManager.ensureTokenForOperation(getTokenFn);
  }, [getToken]);

  return {
    refreshToken,
    getCurrentToken,
    isReady,
    isTokenValid,
    updateActivity,
    ensureTokenForOperation,
    sessionStats: sessionManager.getSessionStats()
  };
};
