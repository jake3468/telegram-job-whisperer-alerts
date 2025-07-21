import { securityMonitor } from './securityMonitor';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (identifier: string) => string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked: boolean;
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      keyGenerator: (id) => id,
      ...config
    };

    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  checkLimit(identifier: string): { allowed: boolean; resetTime: number; remaining: number } {
    const key = this.config.keyGenerator!(identifier);
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetTime) {
      // Create new entry or reset expired entry
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + this.config.windowMs,
        blocked: false
      };
      this.store.set(key, newEntry);

      return {
        allowed: true,
        resetTime: newEntry.resetTime,
        remaining: this.config.maxRequests - 1
      };
    }

    // Check if already blocked
    if (entry.blocked) {
      securityMonitor.logSecurityEvent({
        type: 'rate_limit_exceeded',
        identifier,
        details: { 
          attempts: entry.count,
          windowMs: this.config.windowMs,
          maxRequests: this.config.maxRequests
        },
        severity: 'medium'
      });

      return {
        allowed: false,
        resetTime: entry.resetTime,
        remaining: 0
      };
    }

    entry.count++;

    if (entry.count > this.config.maxRequests) {
      entry.blocked = true;
      
      securityMonitor.logSecurityEvent({
        type: 'rate_limit_exceeded',
        identifier,
        details: { 
          attempts: entry.count,
          windowMs: this.config.windowMs,
          maxRequests: this.config.maxRequests
        },
        severity: 'high'
      });

      return {
        allowed: false,
        resetTime: entry.resetTime,
        remaining: 0
      };
    }

    return {
      allowed: true,
      resetTime: entry.resetTime,
      remaining: this.config.maxRequests - entry.count
    };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  reset(identifier: string): void {
    const key = this.config.keyGenerator!(identifier);
    this.store.delete(key);
  }
}

// Create rate limiters for different operations
export const apiRateLimiter = new RateLimiter({
  maxRequests: 100,
  windowMs: 15 * 60 * 1000 // 15 minutes
});

export const authRateLimiter = new RateLimiter({
  maxRequests: 5,
  windowMs: 5 * 60 * 1000 // 5 minutes
});

export const paymentRateLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 60 * 1000 // 1 minute
});

export { RateLimiter };