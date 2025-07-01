
import { Environment } from '@/utils/environment';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private shouldLog(level: LogLevel): boolean {
    // In production, only log warnings and errors
    if (Environment.isProduction()) {
      return level === 'warn' || level === 'error';
    }
    
    // In development, log everything
    return true;
  }

  debug(message: string, ...args: any[]) {
    if (this.shouldLog('debug')) {
      console.log(`[DEBUG] ${message}`, ...args.map(arg => this.sanitizeForLog(arg)));
    }
  }

  info(message: string, ...args: any[]) {
    if (this.shouldLog('info')) {
      console.log(`[INFO] ${message}`, ...args.map(arg => this.sanitizeForLog(arg)));
    }
  }

  warn(message: string, ...args: any[]) {
    if (this.shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, ...args.map(arg => this.sanitizeForLog(arg)));
    }
  }

  error(message: string, ...args: any[]) {
    if (this.shouldLog('error')) {
      console.error(`[ERROR] ${message}`, ...args.map(arg => this.sanitizeForLog(arg)));
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

  // New method for webhook-specific logging
  webhookInfo(operation: string, details: Record<string, any>) {
    this.info(`Webhook ${operation}:`, this.sanitizeForLog(details));
  }

  // New method for image processing logging
  imageProcessing(operation: string, postId: string, variation: number, details?: Record<string, any>) {
    this.info(`Image ${operation} - Post: ${postId}, Variation: ${variation}`, details ? this.sanitizeForLog(details) : '');
  }
}

export const logger = new Logger();
