
import { Environment } from './environment';

class ContentSecurityPolicyManager {
  private getBasePolicy(): Record<string, string[]> {
    const isProduction = Environment.isProduction();
    
    return {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        ...(isProduction ? [] : ["'unsafe-eval'"]), // Remove unsafe-eval in production
        'https://clerk.aspirely.ai',
        'https://*.clerk.accounts.dev',
        'https://*.googletagmanager.com',
        'https://js.stripe.com',
        'https://challenges.cloudflare.com', // Cloudflare Turnstile
        'https://*.hcaptcha.com' // Fallback CAPTCHA provider
      ],
      'style-src': [
        "'self'",
        "'unsafe-inline'", // Required for Tailwind and inline styles
        'https://fonts.googleapis.com'
      ],
      'font-src': [
        "'self'",
        'https://fonts.gstatic.com'
      ],
      'img-src': [
        "'self'",
        'data:',
        'https:',
        'blob:'
      ],
      'connect-src': [
        "'self'",
        'https://fnzloyyhzhrqsvslhhri.supabase.co',
        'https://ipapi.co',
        'https://api.ipify.org',
        'https://ipwhois.app',
        'https://clerk.aspirely.ai',
        'https://*.clerk.accounts.dev',
        'https://api.stripe.com',
        'https://challenges.cloudflare.com', // Cloudflare Turnstile API
        'https://*.hcaptcha.com' // Fallback CAPTCHA provider
      ],
      'frame-src': [
        "'self'",
        'https://js.stripe.com',
        'https://hooks.stripe.com',
        'https://challenges.cloudflare.com', // Cloudflare Turnstile iframe
        'https://*.hcaptcha.com' // Fallback CAPTCHA provider
      ],
      'worker-src': [
        "'self'",
        'blob:' // Allow blob workers for Clerk
      ],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'frame-ancestors': ["'none'"],
      'upgrade-insecure-requests': []
    };
  }

  generateCSPHeader(): string {
    const policy = this.getBasePolicy();
    
    const cspDirectives = Object.entries(policy)
      .map(([directive, sources]) => {
        if (sources.length === 0) {
          return directive;
        }
        return `${directive} ${sources.join(' ')}`;
      })
      .join('; ');

    return cspDirectives;
  }

  applyCSPMeta(): void {
    // Remove existing CSP meta tag
    const existingMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (existingMeta) {
      existingMeta.remove();
    }

    // Add new CSP meta tag
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = this.generateCSPHeader();
    document.head.appendChild(meta);
  }

  reportCSPViolation(violationEvent: SecurityPolicyViolationEvent): void {
    const violation = {
      documentURI: violationEvent.documentURI,
      referrer: violationEvent.referrer,
      blockedURI: violationEvent.blockedURI,
      violatedDirective: violationEvent.violatedDirective,
      effectiveDirective: violationEvent.effectiveDirective,
      originalPolicy: violationEvent.originalPolicy,
      sourceFile: violationEvent.sourceFile,
      lineNumber: violationEvent.lineNumber,
      columnNumber: violationEvent.columnNumber,
      statusCode: violationEvent.statusCode
    };

    console.error('[CSP VIOLATION]', violation);
    
    // In production, you might want to send this to your logging service
    if (Environment.isProduction()) {
      // TODO: Send to monitoring service
      // Example: sendToMonitoringService('csp-violation', violation);
    }
  }
}

export const cspManager = new ContentSecurityPolicyManager();

// Set up CSP violation reporting
if (typeof window !== 'undefined') {
  document.addEventListener('securitypolicyviolation', (e) => {
    cspManager.reportCSPViolation(e as SecurityPolicyViolationEvent);
  });
}
