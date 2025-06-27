
import { rateLimiter } from './rateLimiter';
import { securityMonitor } from './securityMonitor';
import { xssProtection } from './xssProtection';
import { corsValidator } from './corsValidator';
import { inputSanitizer } from './inputSanitizer';
import { logger } from './logger';

interface SecurityCheckResult {
  allowed: boolean;
  reason?: string;
  headers?: Record<string, string>;
}

interface RequestContext {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: any;
  userAgent?: string;
  ip?: string;
}

class ApiSecurityMiddleware {
  checkRequestSecurity(context: RequestContext, identifier: string): SecurityCheckResult {
    const { method, url, headers, body, userAgent, ip } = context;

    // 1. Rate limiting check
    if (rateLimiter.isRateLimited(identifier, 60, 60000)) { // 60 requests per minute
      securityMonitor.logSecurityEvent({
        type: 'rate_limit_exceeded',
        identifier,
        details: { method, url, ip, userAgent },
        severity: 'medium'
      });
      
      return {
        allowed: false,
        reason: 'Rate limit exceeded'
      };
    }

    // 2. CORS validation
    const origin = headers['origin'] || headers['Origin'];
    if (origin && !corsValidator.validateOrigin(origin)) {
      securityMonitor.logSecurityEvent({
        type: 'potential_attack',
        identifier,
        details: { type: 'CORS_VIOLATION', origin, url },
        severity: 'high'
      });
      
      return {
        allowed: false,
        reason: 'CORS policy violation'
      };
    }

    // 3. Method validation
    if (!corsValidator.validateMethod(method)) {
      return {
        allowed: false,
        reason: 'Method not allowed'
      };
    }

    // 4. User agent validation (basic bot detection)
    if (this.isSuspiciousUserAgent(userAgent)) {
      securityMonitor.logSecurityEvent({
        type: 'suspicious_activity',
        identifier,
        details: { type: 'SUSPICIOUS_USER_AGENT', userAgent, url },
        severity: 'low'
      });
    }

    // 5. Request body validation
    if (body && typeof body === 'object') {
      const xssCheck = this.validateRequestBody(body, identifier);
      if (!xssCheck.allowed) {
        return xssCheck;
      }
    }

    // 6. URL validation
    if (!this.validateRequestURL(url)) {
      securityMonitor.logSecurityEvent({
        type: 'potential_attack',
        identifier,
        details: { type: 'MALICIOUS_URL', url },
        severity: 'medium'
      });
      
      return {
        allowed: false,
        reason: 'Invalid request URL'
      };
    }

    // 7. Check for suspicious activity patterns
    if (securityMonitor.checkForSuspiciousActivity(identifier)) {
      return {
        allowed: false,
        reason: 'Suspicious activity detected'
      };
    }

    return {
      allowed: true,
      headers: corsValidator.getCorsHeaders(origin)
    };
  }

  private validateRequestBody(body: any, identifier: string): SecurityCheckResult {
    const bodyString = JSON.stringify(body);
    
    // Check for XSS in request body
    const xssResult = xssProtection.detectXSS(bodyString, identifier);
    if (!xssResult.isSafe) {
      return {
        allowed: false,
        reason: 'Malicious content detected in request body'
      };
    }

    // Check for SQL injection patterns
    if (inputSanitizer.checkForSQLInjection(bodyString)) {
      securityMonitor.logSecurityEvent({
        type: 'potential_attack',
        identifier,
        details: { type: 'SQL_INJECTION_ATTEMPT', bodyLength: bodyString.length },
        severity: 'high'
      });
      
      return {
        allowed: false,
        reason: 'SQL injection attempt detected'
      };
    }

    return { allowed: true };
  }

  private validateRequestURL(url: string): boolean {
    // Check for path traversal
    if (url.includes('../') || url.includes('..\\')) {
      return false;
    }

    // Check for encoded path traversal
    if (url.includes('%2e%2e') || url.includes('%2E%2E')) {
      return false;
    }

    // Check for null bytes
    if (url.includes('%00') || url.includes('\0')) {
      return false;
    }

    return true;
  }

  private isSuspiciousUserAgent(userAgent?: string): boolean {
    if (!userAgent) return true;

    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /php/i,
      /scan/i,
      /hack/i,
      /exploit/i
    ];

    // Allow legitimate bots
    const legitimateBots = [
      /googlebot/i,
      /bingbot/i,
      /facebookexternalhit/i,
      /twitterbot/i,
      /linkedinbot/i
    ];

    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));
    const isLegitimate = legitimateBots.some(pattern => pattern.test(userAgent));

    return isSuspicious && !isLegitimate;
  }
}

export const apiSecurityMiddleware = new ApiSecurityMiddleware();
