
import { Environment } from '@/utils/environment';

class DebugLogger {
  private isEnabled: boolean;
  private logCounts: Map<string, number> = new Map();

  constructor() {
    this.isEnabled = Environment.isDevelopment();
  }

  log(message: string, ...args: any[]) {
    if (!this.isEnabled) return;
    
    // Rate limiting - only log if we haven't logged this message too many times
    const count = this.logCounts.get(message) || 0;
    if (count < 5) {
      console.log(`[DEBUG] ${message}`, ...args);
      this.logCounts.set(message, count + 1);
    }
  }

  info(message: string, ...args: any[]) {
    if (!this.isEnabled) return;
    console.info(`[INFO] ${message}`, ...args);
  }

  warn(message: string, ...args: any[]) {
    if (!this.isEnabled) return;
    console.warn(`[WARN] ${message}`, ...args);
  }

  error(message: string, ...args: any[]) {
    console.error(`[ERROR] ${message}`, ...args);
  }

  // Reset counts for specific messages
  reset(message?: string) {
    if (message) {
      this.logCounts.delete(message);
    } else {
      this.logCounts.clear();
    }
  }
}

export const debugLogger = new DebugLogger();
