
import { logger } from './logger';
import { securityMonitor } from './securityMonitor';

interface XSSDetectionResult {
  isSafe: boolean;
  threats: string[];
  sanitizedContent?: string;
}

class XSSProtection {
  private dangerousPatterns = [
    // Script tags
    /<script[^>]*>[\s\S]*?<\/script>/gi,
    /<script[^>]*>/gi,
    
    // Event handlers
    /on\w+\s*=\s*["']?[^"']*["']?/gi,
    
    // JavaScript protocols
    /javascript\s*:/gi,
    /vbscript\s*:/gi,
    
    // Data URLs with script
    /data\s*:\s*text\/html/gi,
    /data\s*:\s*application\/javascript/gi,
    
    // HTML injection attempts
    /<iframe[^>]*>/gi,
    /<object[^>]*>/gi,
    /<embed[^>]*>/gi,
    /<link[^>]*>/gi,
    /<meta[^>]*>/gi,
    
    // CSS injection
    /expression\s*\(/gi,
    /-moz-binding/gi,
    
    // Server-side includes
    /<!--\s*#/gi,
    
    // SQL injection patterns in HTML context
    /<[^>]*['"][^'"]*(?:union|select|insert|delete|update|drop|create|alter|exec)[^'"]*['"][^>]*>/gi
  ];

  private htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };

  detectXSS(content: string, identifier: string = 'unknown'): XSSDetectionResult {
    const threats: string[] = [];
    
    for (const pattern of this.dangerousPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        threats.push(...matches);
      }
    }

    const isSafe = threats.length === 0;

    if (!isSafe) {
      securityMonitor.logSecurityEvent({
        type: 'potential_attack',
        identifier,
        details: { 
          threatType: 'XSS',
          threatsFound: threats.length,
          contentLength: content.length 
        },
        severity: threats.length > 3 ? 'high' : 'medium'
      });
    }

    return {
      isSafe,
      threats,
      sanitizedContent: isSafe ? content : this.sanitizeContent(content)
    };
  }

  sanitizeContent(content: string): string {
    // Remove dangerous patterns
    let sanitized = content;
    
    for (const pattern of this.dangerousPatterns) {
      sanitized = sanitized.replace(pattern, '');
    }

    // Encode HTML entities
    sanitized = sanitized.replace(/[&<>"'`=\/]/g, (match) => {
      return this.htmlEntities[match] || match;
    });

    return sanitized;
  }

  validateURL(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      
      // Block dangerous protocols
      const dangerousProtocols = ['javascript:', 'vbscript:', 'data:', 'file:'];
      if (dangerousProtocols.some(protocol => parsedUrl.protocol.toLowerCase().startsWith(protocol))) {
        return false;
      }

      // Only allow http/https for external URLs
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }
}

export const xssProtection = new XSSProtection();
