
import { Environment } from './environment';
import { logger } from './logger';
import { securityMonitor } from './securityMonitor';

interface SecurityAuditResult {
  score: number;
  issues: SecurityIssue[];
  recommendations: string[];
  status: 'CRITICAL' | 'HIGH_RISK' | 'MEDIUM_RISK' | 'LOW_RISK' | 'SECURE';
}

interface SecurityIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  description: string;
  recommendation: string;
}

class SecurityAudit {
  async runSecurityAudit(): Promise<SecurityAuditResult> {
    const issues: SecurityIssue[] = [];
    let score = 100;

    // Check HTTPS
    if (window.location.protocol !== 'https:' && Environment.isProduction()) {
      issues.push({
        severity: 'critical',
        category: 'Transport Security',
        description: 'Site is not using HTTPS in production',
        recommendation: 'Enable HTTPS for all production traffic'
      });
      score -= 30;
    }

    // Check CSP
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (!cspMeta) {
      issues.push({
        severity: 'high',
        category: 'Content Security',
        description: 'Content Security Policy not found',
        recommendation: 'Implement comprehensive Content Security Policy'
      });
      score -= 20;
    }

    // Check security headers
    const securityHeaders = [
      'X-Frame-Options',
      'X-Content-Type-Options',
      'X-XSS-Protection',
      'Strict-Transport-Security'
    ];

    securityHeaders.forEach(header => {
      const meta = document.querySelector(`meta[http-equiv="${header}"]`);
      if (!meta && Environment.isProduction()) {
        issues.push({
          severity: 'medium',
          category: 'Security Headers',
          description: `Missing ${header} header`,
          recommendation: `Add ${header} security header`
        });
        score -= 5;
      }
    });

    // Check for mixed content
    const images = Array.from(document.images);
    const mixedContentImages = images.filter(img => 
      img.src.startsWith('http:') && window.location.protocol === 'https:'
    );

    if (mixedContentImages.length > 0) {
      issues.push({
        severity: 'medium',
        category: 'Mixed Content',
        description: `Found ${mixedContentImages.length} HTTP images on HTTPS page`,
        recommendation: 'Ensure all resources are served over HTTPS'
      });
      score -= 10;
    }

    // Check for inline scripts (basic check)
    const scripts = Array.from(document.scripts);
    const inlineScripts = scripts.filter(script => 
      !script.src && script.innerHTML.trim().length > 0
    );

    if (inlineScripts.length > 0 && Environment.isProduction()) {
      issues.push({
        severity: 'medium',
        category: 'Script Security',
        description: `Found ${inlineScripts.length} inline scripts`,
        recommendation: 'Move inline scripts to external files and use nonce/hash in CSP'
      });
      score -= 8;
    }

    // Check localStorage for sensitive data
    const sensitiveKeys = ['password', 'secret', 'key', 'token', 'jwt'];
    const localStorageKeys = Object.keys(localStorage);
    const suspiciousKeys = localStorageKeys.filter(key =>
      sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))
    );

    if (suspiciousKeys.length > 0) {
      issues.push({
        severity: 'high',
        category: 'Data Storage',
        description: `Potentially sensitive data found in localStorage: ${suspiciousKeys.join(', ')}`,
        recommendation: 'Avoid storing sensitive data in localStorage'
      });
      score -= 15;
    }

    // Get security event summary
    const securityReport = securityMonitor.getSecurityReport();
    const criticalEvents = securityReport.recentEvents.filter(event => event.severity === 'critical');
    
    if (criticalEvents.length > 0) {
      issues.push({
        severity: 'critical',
        category: 'Security Events',
        description: `${criticalEvents.length} critical security events in the last hour`,
        recommendation: 'Investigate and address critical security events immediately'
      });
      score -= 25;
    }

    // Determine overall status
    let status: SecurityAuditResult['status'];
    if (score >= 90) status = 'SECURE';
    else if (score >= 75) status = 'LOW_RISK';
    else if (score >= 50) status = 'MEDIUM_RISK';
    else if (score >= 25) status = 'HIGH_RISK';
    else status = 'CRITICAL';

    const recommendations = this.generateRecommendations(issues);

    logger.info('Security audit completed', { score, status, issueCount: issues.length });

    return {
      score: Math.max(0, score),
      issues,
      recommendations,
      status
    };
  }

  private generateRecommendations(issues: SecurityIssue[]): string[] {
    const recommendations: string[] = [];

    // Priority recommendations based on severity
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    const highIssues = issues.filter(i => i.severity === 'high');

    if (criticalIssues.length > 0) {
      recommendations.push('🚨 URGENT: Address all critical security issues immediately');
    }

    if (highIssues.length > 0) {
      recommendations.push('⚠️ HIGH PRIORITY: Resolve high-severity security issues');
    }

    // Specific recommendations
    recommendations.push(
      '🔒 Implement comprehensive Content Security Policy',
      '🛡️ Add all recommended security headers',
      '🔐 Use HTTPS for all resources and communications',
      '📊 Set up continuous security monitoring',
      '🔄 Regularly audit and update security measures'
    );

    return recommendations;
  }
}

export const securityAudit = new SecurityAudit();
