
import { logger } from './logger';

export class InputSanitizer {
  // Email validation with security considerations
  static validateEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    // Check for basic format
    if (!emailRegex.test(email)) {
      return false;
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /data:text\/html/i,
      /vbscript:/i
    ];

    return !suspiciousPatterns.some(pattern => pattern.test(email));
  }

  // Sanitize user input for display
  static sanitizeForDisplay(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  // Validate password strength
  static validatePassword(password: string): { isValid: boolean; message: string } {
    if (password.length < 8) {
      return { isValid: false, message: 'Password must be at least 8 characters long' };
    }

    if (!/(?=.*[a-z])/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one lowercase letter' };
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one uppercase letter' };
    }

    if (!/(?=.*\d)/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one number' };
    }

    return { isValid: true, message: 'Password is strong' };
  }

  // Sanitize text input to prevent XSS
  static sanitizeTextInput(input: string, maxLength: number = 1000): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    // Truncate to max length
    let sanitized = input.substring(0, maxLength);

    // Remove potential script tags and dangerous content
    sanitized = sanitized
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/data:text\/html/gi, '');

    return sanitized.trim();
  }

  // Check for potential SQL injection patterns
  static checkForSQLInjection(input: string): boolean {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
      /(\b(OR|AND)\s+\w+\s*=\s*\w+)/i,
      /(--|\/\*|\*\/)/,
      /(\b\d+\s*=\s*\d+)/,
      /('|\"|;|\||&)/
    ];

    const isSuspicious = sqlPatterns.some(pattern => pattern.test(input));
    
    if (isSuspicious) {
      logger.warn('Potential SQL injection attempt detected', { 
        inputLength: input.length,
        suspicious: true 
      });
    }

    return isSuspicious;
  }

  // Validate file upload
  static validateFileUpload(file: File): { isValid: boolean; message: string } {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      return { isValid: false, message: 'File type not allowed' };
    }

    if (file.size > maxSize) {
      return { isValid: false, message: 'File size too large (max 5MB)' };
    }

    // Check for suspicious file names
    if (/\.(exe|bat|cmd|scr|pif|com)$/i.test(file.name)) {
      return { isValid: false, message: 'Executable files are not allowed' };
    }

    return { isValid: true, message: 'File is valid' };
  }
}

export const inputSanitizer = InputSanitizer;
