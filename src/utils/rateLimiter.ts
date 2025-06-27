
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();

  isRateLimited(
    identifier: string, 
    limit: number = 10, 
    windowMs: number = 60000
  ): boolean {
    const now = Date.now();
    const entry = this.store.get(identifier);

    // If no entry or window has expired, create new entry
    if (!entry || now > entry.resetTime) {
      this.store.set(identifier, { count: 1, resetTime: now + windowMs });
      return false;
    }

    // If limit exceeded, return true (rate limited)
    if (entry.count >= limit) {
      return true;
    }

    // Increment count
    entry.count++;
    return false;
  }

  getRemainingAttempts(
    identifier: string, 
    limit: number = 10
  ): number {
    const entry = this.store.get(identifier);
    if (!entry) return limit;
    return Math.max(0, limit - entry.count);
  }

  getResetTime(identifier: string): number | null {
    const entry = this.store.get(identifier);
    return entry ? entry.resetTime : null;
  }

  // Clean up expired entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

export const rateLimiter = new RateLimiter();

// Cleanup expired entries every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    rateLimiter.cleanup();
  }, 5 * 60 * 1000);
}
