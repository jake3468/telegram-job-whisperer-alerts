
import { Environment } from '@/utils/environment';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private logCounts: Map<string, number> = new Map();
  private maxLogsPerMessage = 3;

  private shouldLog(level: LogLevel): boolean {
    // In production, only log warnings and errors
    if (Environment.isProduction()) {
      return level === 'warn' || level === 'error';
    }
    
    // In development, log everything but with rate limiting
    return true;
  }

  private rateLimit(message: string): boolean {
    const count = this.logCounts.get(message) || 0;
    if (count >= this.maxLogsPerMessage) {
      return false;
    }
    this.logCounts.set(message, count + 1);
    return true;
  }

  debug(message: string, ...args: any[]) {
    if (this.shouldLog('debug') && this.rateLimit(message)) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]) {
    if (this.shouldLog('info') && this.rateLimit(message)) {
      console.log(`[INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]) {
    if (this.shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  error(message: string, ...args: any[]) {
    if (this.shouldLog('error')) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }

  // Reset counts for specific messages
  reset(message?: string) {
    if (message) {
      this.logCounts.delete(message);
    } else {
      this.logCounts.clear();
    }
  }

  // Sanitize sensitive data before logging
  sanitizeForLog(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sensitiveKeys = ['password', 'token', 'key', 'secret', 'authorization', 'jwt'];
    const sanitized = { ...data };

    Object.keys(sanitized).forEach(key => {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    });

    return sanitized;
  }
}

export const logger = new Logger();
