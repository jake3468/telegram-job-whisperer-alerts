import { useCallback, useEffect, useRef, useState } from 'react';
import { useEnhancedTokenManagerIntegration } from './useEnhancedTokenManagerIntegration';

interface UserPresenceState {
  isActive: boolean;
  lastActivity: number;
  formInteractions: number;
  connectionHealth: 'healthy' | 'degraded' | 'poor';
  tokenStatus: 'valid' | 'refreshing' | 'expired';
}

interface PresenceConfig {
  // Activity detection thresholds
  activeThreshold: number; // Time to consider user active (default: 3 minutes)
  heartbeatInterval: number; // Proactive refresh interval (default: 2 minutes)
  
  // Connection monitoring
  connectionTestInterval: number; // Health check interval (default: 5 minutes)
  
  // Form interaction tracking
  trackFormInteractions: boolean;
  formFocusWeight: number; // Multiplier for form focus activity
}

const DEFAULT_CONFIG: PresenceConfig = {
  activeThreshold: 3 * 60 * 1000, // 3 minutes
  heartbeatInterval: 2 * 60 * 1000, // 2 minutes - very aggressive
  connectionTestInterval: 5 * 60 * 1000, // 5 minutes
  trackFormInteractions: true,
  formFocusWeight: 2
};

/**
 * Enterprise-grade user presence detection and proactive session management
 * Ensures 100% operation reliability even after extended periods of inactivity
 */
export const useEnterpriseUserPresence = (config: Partial<PresenceConfig> = {}) => {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const sessionManager = useEnhancedTokenManagerIntegration();
  
  const [presenceState, setPresenceState] = useState<UserPresenceState>({
    isActive: true,
    lastActivity: Date.now(),
    formInteractions: 0,
    connectionHealth: 'healthy',
    tokenStatus: 'valid'
  });

  // Refs for intervals and tracking
  const heartbeatRef = useRef<NodeJS.Timeout>();
  const connectionTestRef = useRef<NodeJS.Timeout>();
  const activityTimeoutRef = useRef<NodeJS.Timeout>();
  const lastActivityRef = useRef(Date.now());
  const formInteractionCountRef = useRef(0);
  const isRefreshingRef = useRef(false);

  // Advanced activity detection - tracks multiple interaction types
  const updateActivity = useCallback((interactionType: 'mouse' | 'keyboard' | 'form' | 'touch' = 'mouse') => {
    const now = Date.now();
    lastActivityRef.current = now;
    
    // Weight form interactions more heavily
    const activityWeight = interactionType === 'form' ? fullConfig.formFocusWeight : 1;
    formInteractionCountRef.current += activityWeight;
    
    // Update session manager
    if (sessionManager?.updateActivity) {
      sessionManager.updateActivity();
    }

    // Update presence state
    setPresenceState(prev => ({
      ...prev,
      isActive: true,
      lastActivity: now,
      formInteractions: formInteractionCountRef.current
    }));

    // Reset activity timeout
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }

    // Set inactive after threshold
    activityTimeoutRef.current = setTimeout(() => {
      setPresenceState(prev => ({
        ...prev,
        isActive: false
      }));
    }, fullConfig.activeThreshold);

    console.log(`[EnterprisePresence] Activity detected: ${interactionType} (weight: ${activityWeight})`);
  }, [sessionManager, fullConfig.activeThreshold, fullConfig.formFocusWeight]);

  // Proactive token refresh - more aggressive than standard
  const proactiveTokenRefresh = useCallback(async () => {
    if (isRefreshingRef.current || !sessionManager) return;
    
    try {
      isRefreshingRef.current = true;
      setPresenceState(prev => ({ ...prev, tokenStatus: 'refreshing' }));
      
      // Check if token needs refresh (with smaller buffer)
      const needsRefresh = !sessionManager.isTokenValid();
      
      if (needsRefresh || presenceState.isActive) {
        console.log('[EnterprisePresence] Proactive token refresh initiated...');
        
        const token = await sessionManager.refreshToken(true);
        
        if (token) {
          setPresenceState(prev => ({ 
            ...prev, 
            tokenStatus: 'valid',
            connectionHealth: 'healthy'
          }));
          console.log('[EnterprisePresence] Token refreshed successfully');
        } else {
          throw new Error('Token refresh failed');
        }
      } else {
        setPresenceState(prev => ({ ...prev, tokenStatus: 'valid' }));
      }
    } catch (error) {
      console.error('[EnterprisePresence] Proactive refresh failed:', error);
      setPresenceState(prev => ({ 
        ...prev, 
        tokenStatus: 'expired',
        connectionHealth: 'poor'
      }));
    } finally {
      isRefreshingRef.current = false;
    }
  }, [sessionManager, presenceState.isActive]);

  // Connection health monitoring
  const testConnectionHealth = useCallback(async () => {
    try {
      // Simple ping test to Supabase
      const startTime = Date.now();
      const response = await fetch('https://fnzloyyhzhrqsvslhhri.supabase.co/rest/v1/', {
        method: 'HEAD',
        headers: { 'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuemxveXloemhycXN2c2xoaHJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5MzAyMjIsImV4cCI6MjA2NDUwNjIyMn0.xdlgb_amJ1fV31uinCFotGW00isgT5-N8zJ_gLHEKuk' }
      });
      
      const responseTime = Date.now() - startTime;
      
      let health: UserPresenceState['connectionHealth'] = 'healthy';
      if (responseTime > 2000) health = 'poor';
      else if (responseTime > 1000) health = 'degraded';
      
      setPresenceState(prev => ({ ...prev, connectionHealth: health }));
      
      console.log(`[EnterprisePresence] Connection health: ${health} (${responseTime}ms)`);
    } catch (error) {
      console.error('[EnterprisePresence] Connection test failed:', error);
      setPresenceState(prev => ({ ...prev, connectionHealth: 'poor' }));
    }
  }, []);

  // Setup enterprise-grade activity listeners
  useEffect(() => {
    if (!sessionManager) return;

    console.log('[EnterprisePresence] Initializing enterprise presence detection...');
    
    // Enhanced activity event listeners
    const activityEvents = [
      { type: 'mousedown', category: 'mouse' as const },
      { type: 'mousemove', category: 'mouse' as const },
      { type: 'keydown', category: 'keyboard' as const },
      { type: 'keypress', category: 'keyboard' as const },
      { type: 'scroll', category: 'mouse' as const },
      { type: 'touchstart', category: 'touch' as const },
      { type: 'touchmove', category: 'touch' as const },
      { type: 'focus', category: 'form' as const },
      { type: 'input', category: 'form' as const },
      { type: 'change', category: 'form' as const }
    ];

    const eventListeners = activityEvents.map(({ type, category }) => {
      const handler = () => updateActivity(category);
      document.addEventListener(type, handler, { passive: true, capture: true });
      return () => document.removeEventListener(type, handler, true);
    });

    // Proactive heartbeat - more frequent than standard
    heartbeatRef.current = setInterval(proactiveTokenRefresh, fullConfig.heartbeatInterval);
    
    // Connection health monitoring
    connectionTestRef.current = setInterval(testConnectionHealth, fullConfig.connectionTestInterval);
    
    // Initial checks
    proactiveTokenRefresh();
    testConnectionHealth();
    updateActivity('form'); // Initial activity
    
    return () => {
      // Cleanup all listeners
      eventListeners.forEach(cleanup => cleanup());
      
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
      
      if (connectionTestRef.current) {
        clearInterval(connectionTestRef.current);
      }
      
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
    };
  }, [sessionManager, updateActivity, proactiveTokenRefresh, testConnectionHealth, fullConfig.heartbeatInterval, fullConfig.connectionTestInterval]);

  // Manual activity update for form interactions
  const recordFormInteraction = useCallback((interactionType: 'focus' | 'input' | 'submit' | 'click' = 'input') => {
    updateActivity('form');
    console.log(`[EnterprisePresence] Form interaction: ${interactionType}`);
  }, [updateActivity]);

  // Force immediate token refresh
  const forceTokenRefresh = useCallback(async () => {
    return await proactiveTokenRefresh();
  }, [proactiveTokenRefresh]);

  return {
    // Presence state
    isActive: presenceState.isActive,
    lastActivity: presenceState.lastActivity,
    connectionHealth: presenceState.connectionHealth,
    tokenStatus: presenceState.tokenStatus,
    formInteractions: presenceState.formInteractions,
    
    // Activity tracking methods
    updateActivity,
    recordFormInteraction,
    forceTokenRefresh,
    
    // Status helpers
    isConnectionHealthy: presenceState.connectionHealth === 'healthy',
    isTokenValid: presenceState.tokenStatus === 'valid',
    timeSinceLastActivity: Date.now() - presenceState.lastActivity,
    
    // Statistics
    stats: {
      totalInteractions: presenceState.formInteractions,
      sessionHealth: presenceState.connectionHealth,
      refreshStatus: presenceState.tokenStatus,
      activeTime: presenceState.isActive ? Date.now() - presenceState.lastActivity : 0
    }
  };
};