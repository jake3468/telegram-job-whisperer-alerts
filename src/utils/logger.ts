import { Environment } from '@/utils/environment';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private shouldLog(level: LogLevel): boolean {
    // Only log errors in production to keep console clean
    if (Environment.isProduction()) {
      return level === 'error';
    }
    
    // In development, only log warnings and errors
    return level === 'warn' || level === 'error';
  }

  debug(message: string, ...args: any[]) {
    // Debug logs are disabled for production readiness
    return;
  }

  info(message: string, ...args: any[]) {
    if (this.shouldLog('info')) {
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
