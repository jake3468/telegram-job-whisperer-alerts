import React, { useEffect, useState } from 'react';
import { useEnterpriseUserPresence } from '@/hooks/useEnterpriseUserPresence';
import { cn } from '@/lib/utils';
import { Wifi, WifiOff, Shield, ShieldAlert, CheckCircle, Clock } from 'lucide-react';

interface EnterpriseFormWrapperProps {
  children: React.ReactNode;
  className?: string;
  showStatusIndicator?: boolean;
  onPresenceChange?: (isActive: boolean) => void;
  onConnectionChange?: (health: 'healthy' | 'degraded' | 'poor') => void;
}

/**
 * Enterprise-grade form wrapper that provides:
 * - Automatic user presence detection
 * - Proactive token refresh
 * - Connection health monitoring
 * - Visual status indicators
 * - Seamless background session management
 */
export const EnterpriseFormWrapper: React.FC<EnterpriseFormWrapperProps> = ({
  children,
  className,
  showStatusIndicator = true,
  onPresenceChange,
  onConnectionChange
}) => {
  const {
    isActive,
    connectionHealth,
    tokenStatus,
    recordFormInteraction,
    isConnectionHealthy,
    isTokenValid,
    timeSinceLastActivity,
    stats
  } = useEnterpriseUserPresence({
    // More aggressive settings for forms
    heartbeatInterval: 90 * 1000, // 1.5 minutes
    activeThreshold: 2 * 60 * 1000, // 2 minutes
    trackFormInteractions: true,
    formFocusWeight: 3 // Higher weight for form interactions
  });

  const [statusVisible, setStatusVisible] = useState(false);
  const [lastNotification, setLastNotification] = useState<string>('');

  // Notify parent components of changes
  useEffect(() => {
    onPresenceChange?.(isActive);
  }, [isActive, onPresenceChange]);

  useEffect(() => {
    onConnectionChange?.(connectionHealth);
  }, [connectionHealth, onConnectionChange]);

  // Show status indicator briefly when connection changes
  useEffect(() => {
    if (connectionHealth !== 'healthy' || tokenStatus !== 'valid') {
      setStatusVisible(true);
      const timer = setTimeout(() => setStatusVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [connectionHealth, tokenStatus]);

  // Form interaction handlers
  const handleFormInteraction = (event: React.FormEvent | React.MouseEvent | React.KeyboardEvent) => {
    const eventType = event.type as 'focus' | 'input' | 'click' | 'keydown';
    
    switch (eventType) {
      case 'focus':
        recordFormInteraction('focus');
        break;
      case 'input':
        recordFormInteraction('input');
        break;
      case 'click':
        recordFormInteraction('click');
        break;
      default:
        recordFormInteraction('input');
    }
  };

  // Status indicator component
  const StatusIndicator = () => {
    if (!showStatusIndicator) return null;

    const getConnectionIcon = () => {
      switch (connectionHealth) {
        case 'healthy':
          return <Wifi className="w-3 h-3 text-green-400" />;
        case 'degraded':
          return <Wifi className="w-3 h-3 text-yellow-400" />;
        case 'poor':
          return <WifiOff className="w-3 h-3 text-red-400" />;
      }
    };

    const getTokenIcon = () => {
      switch (tokenStatus) {
        case 'valid':
          return <CheckCircle className="w-3 h-3 text-green-400" />;
        case 'refreshing':
          return <Clock className="w-3 h-3 text-blue-400 animate-spin" />;
        case 'expired':
          return <ShieldAlert className="w-3 h-3 text-red-400" />;
      }
    };

    const getStatusText = () => {
      if (connectionHealth === 'poor') return 'Connection issues detected';
      if (tokenStatus === 'expired') return 'Session expired';
      return 'Session active';
    };

    const shouldShowStatus = connectionHealth === 'poor' || 
                           tokenStatus === 'expired';

    if (!shouldShowStatus) return null;

    return (
      <div className={cn(
        "fixed top-4 right-4 z-50 bg-black/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-gray-600",
        "flex items-center gap-2 text-xs text-white transition-all duration-300",
        statusVisible || connectionHealth !== 'healthy' || tokenStatus !== 'valid' 
          ? "opacity-100" 
          : "opacity-60 hover:opacity-100"
      )}>
        {getConnectionIcon()}
        {getTokenIcon()}
        <span>{getStatusText()}</span>
        
        {/* Activity indicator */}
        {isActive && (
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        )}
      </div>
    );
  };

  // Debug info (only in development)
  const DebugInfo = () => {
    if (process.env.NODE_ENV !== 'development') return null;

    return (
      <div className="fixed bottom-4 right-4 z-40 bg-black/90 text-white text-xs p-2 rounded font-mono max-w-xs">
        <div>Active: {isActive ? 'Yes' : 'No'}</div>
        <div>Connection: {connectionHealth}</div>
        <div>Token: {tokenStatus}</div>
        <div>Interactions: {stats.totalInteractions}</div>
        <div>Last Activity: {Math.round(timeSinceLastActivity / 1000)}s ago</div>
      </div>
    );
  };

  return (
    <div 
      className={cn("relative", className)}
      onClick={handleFormInteraction}
      onFocus={handleFormInteraction}
      onInput={handleFormInteraction}
      onKeyDown={handleFormInteraction}
    >
      {children}
      <StatusIndicator />
      <DebugInfo />
    </div>
  );
};