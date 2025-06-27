import { logger } from './logger';
import { rateLimiter } from './rateLimiter';

interface SecurityEvent {
  type: 'suspicious_activity' | 'rate_limit_exceeded' | 'invalid_input' | 'potential_attack';
  identifier: string;
  details: any;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class SecurityMonitor {
  private events: SecurityEvent[] = [];
  private maxEvents = 1000;

  logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>) {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: Date.now()
    };

    this.events.push(securityEvent);
    
    // Keep only the most recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Log based on severity
    switch (event.severity) {
      case 'critical':
        logger.error(`[SECURITY CRITICAL] ${event.type}`, logger.sanitizeForLog(event.details));
        break;
      case 'high':
        logger.error(`[SECURITY HIGH] ${event.type}`, logger.sanitizeForLog(event.details));
        break;
      case 'medium':
        logger.warn(`[SECURITY MEDIUM] ${event.type}`, logger.sanitizeForLog(event.details));
        break;
      case 'low':
        logger.info(`[SECURITY LOW] ${event.type}`, logger.sanitizeForLog(event.details));
        break;
    }
  }

  checkForSuspiciousActivity(identifier: string): boolean {
    const recentEvents = this.events.filter(
      event => event.identifier === identifier && 
      Date.now() - event.timestamp < 300000 // 5 minutes
    );

    // Check for multiple failed attempts
    const failedAttempts = recentEvents.filter(
      event => event.type === 'rate_limit_exceeded' || event.type === 'invalid_input'
    );

    if (failedAttempts.length >= 5) {
      this.logSecurityEvent({
        type: 'suspicious_activity',
        identifier,
        details: { eventCount: failedAttempts.length, recentEvents: failedAttempts.slice(-3) },
        severity: 'high'
      });
      return true;
    }

    return false;
  }

  getSecurityReport(): { eventCounts: Record<string, number>; recentEvents: SecurityEvent[] } {
    const eventCounts = this.events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const recentEvents = this.events
      .filter(event => Date.now() - event.timestamp < 3600000) // Last hour
      .slice(-20);

    return { eventCounts, recentEvents };
  }
}

export const securityMonitor = new SecurityMonitor();
