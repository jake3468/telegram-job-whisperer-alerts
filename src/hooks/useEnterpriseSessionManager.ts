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
  private activityListeners: (() => void)[] = [];

  // Dynamic token expiry calculation (10-15% buffer)
  calculateTokenBuffer(tokenExpiry: number): number {
    const totalLifetime = tokenExpiry - Date.now();
    const bufferPercentage = Math.min(Math.max(totalLifetime * 0.1, 60 * 1000), 15 * 60 * 1000); // 1min to 15min
    return bufferPercentage;
  }

  // Check if token is valid with dynamic buffer
  isTokenValid(): boolean {
    if (!this.state.token || !this.state.expiry) return false;
    
    const now = Date.now();
    const buffer = this.calculateTokenBuffer(this.state.expiry);
    const isValid = (this.state.expiry - now) > buffer;
    
    // If token is close to expiry but user is active, extend session
    if (!isValid && this.isUserActive()) {
      this.state.sessionExtended = true;
    }
    
    return isValid;
  }

  // Check if user is actively using the app
  isUserActive(): boolean {
    const timeSinceActivity = Date.now() - this.state.lastActivity;
    return timeSinceActivity < 2 * 60 * 1000; // Active if activity within 2 minutes
  }

  // Update activity timestamp
  updateActivity(): void {
    this.state.lastActivity = Date.now();
  }

  // Enterprise-grade token refresh with queue management
  async refreshToken(getToken: () => Promise<string | null>, forceRefresh = false): Promise<string | null> {
    // Return cached token if valid and not forcing refresh
    if (!forceRefresh && this.isTokenValid()) {
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
      // Exponential backoff for failures (enterprise pattern)
      if (this.state.failureCount > 0) {
        const backoffDelay = Math.min(1000 * Math.pow(2, this.state.failureCount), 10000);
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
        console.log(`[EnterpriseSession] Token refreshed (${this.state.refreshCount})`);

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

  // Start background session management
  startSessionManagement(getToken: () => Promise<string | null>): void {
    // Background heartbeat every 45 minutes (enterprise standard)
    this.heartbeatInterval = setInterval(async () => {
      if (this.isUserActive()) {
        if (!this.isTokenValid()) {
          await this.refreshToken(getToken, true);
        }
      }
    }, 45 * 60 * 1000);

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

    this.activityListeners.forEach(cleanup => cleanup());
    this.activityListeners = [];
  }

  // Get current token immediately (no refresh)
  getCurrentToken(): string | null {
    return this.state.token;
  }

  // Get valid token (with auto-refresh if needed)
  async getValidToken(): Promise<string | null> {
    if (this.isTokenValid()) {
      return this.state.token;
    }
    
    // Token expired/invalid - need to refresh
    // This requires the getToken function, so we return null if not available
    console.warn('[EnterpriseSession] Token invalid, refresh needed');
    return null;
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

  // Update activity (for manual tracking)
  const updateActivity = useCallback(() => {
    sessionManager.updateActivity();
  }, []);

  return {
    refreshToken,
    isReady,
    isTokenValid,
    updateActivity,
    sessionStats: sessionManager.getSessionStats()
  };
};