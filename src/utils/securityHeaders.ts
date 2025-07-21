import { securityMonitor } from './securityMonitor';

export interface SecurityHeaders {
  'Content-Security-Policy'?: string;
  'X-Frame-Options'?: string;
  'X-Content-Type-Options'?: string;
  'Referrer-Policy'?: string;
  'Permissions-Policy'?: string;
}

class SecurityHeadersManager {
  private defaultHeaders: SecurityHeaders = {
    'Content-Security-Policy': `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.aspirely.ai https://*.clerk.accounts.dev https://challenges.cloudflare.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      font-src 'self' https://fonts.gstatic.com;
      img-src 'self' data: https: blob:;
      connect-src 'self' https://fnzloyyhzhrqsvslhhri.supabase.co https://clerk.aspirely.ai https://*.clerk.accounts.dev wss://fnzloyyhzhrqsvslhhri.supabase.co;
      frame-src 'self' https://challenges.cloudflare.com https://clerk.aspirely.ai;
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      upgrade-insecure-requests;
    `.replace(/\s+/g, ' ').trim(),
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
  };

  setSecurityHeaders(): void {
    // Apply CSP via meta tag if not already present
    if (typeof document !== 'undefined' && !document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
      const meta = document.createElement('meta');
      meta.httpEquiv = 'Content-Security-Policy';
      meta.content = this.defaultHeaders['Content-Security-Policy'] || '';
      document.head.appendChild(meta);
    }
  }

  validateRequest(request: Request): boolean {
    try {
      const origin = request.headers.get('origin');
      const referer = request.headers.get('referer');
      const userAgent = request.headers.get('user-agent');

      // Check for suspicious patterns
      if (userAgent && this.isSuspiciousUserAgent(userAgent)) {
        securityMonitor.logSecurityEvent({
          type: 'suspicious_activity',
          identifier: origin || 'unknown',
          details: { userAgent, reason: 'suspicious_user_agent' },
          severity: 'medium'
        });
        return false;
      }

      // Validate origin for API requests
      if (origin && !this.isAllowedOrigin(origin)) {
        securityMonitor.logSecurityEvent({
          type: 'invalid_input',
          identifier: origin,
          details: { origin, referer, reason: 'invalid_origin' },
          severity: 'high'
        });
        return false;
      }

      return true;
    } catch (error) {
      securityMonitor.logSecurityEvent({
        type: 'potential_attack',
        identifier: 'unknown',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        severity: 'high'
      });
      return false;
    }
  }

  private isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /postman/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }

  private isAllowedOrigin(origin: string): boolean {
    const allowedOrigins = [
      'https://aspirely.ai',
      'https://www.aspirely.ai',
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173'
    ];

    return allowedOrigins.includes(origin);
  }
}

export const securityHeaders = new SecurityHeadersManager();