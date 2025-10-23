
import DOMPurify from 'dompurify';
import { xssProtection } from './xssProtection';
import { logger } from './logger';

export const sanitizeHTML = (dirty: string): string => {
  // First check for XSS
  const xssResult = xssProtection.detectXSS(dirty);
  
  if (!xssResult.isSafe) {
    logger.warn('XSS threats detected in HTML content', { threatsCount: xssResult.threats.length });
  }

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'blockquote', 'code', 'pre', 'img'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'title', 'loading', 'width', 'height', 'class'],
    KEEP_CONTENT: true,
    FORBID_TAGS: ['script', 'object', 'embed', 'link', 'style'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onmouseout', 'onfocus', 'onblur'],
    ADD_ATTR: ['target'],
    ALLOW_DATA_ATTR: false
  });
};

export const sanitizeText = (text: string): string => {
  // Use XSS protection for comprehensive sanitization
  const xssResult = xssProtection.detectXSS(text);
  
  if (!xssResult.isSafe && xssResult.sanitizedContent) {
    return xssResult.sanitizedContent;
  }

  // Fallback to basic HTML entity encoding
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

export const validateInput = (input: string, maxLength: number = 1000): boolean => {
  if (!input || input.length > maxLength) {
    return false;
  }
  
  // Use comprehensive XSS protection
  const xssResult = xssProtection.detectXSS(input);
  return xssResult.isSafe;
};

// Enhanced validation for real-time typing
export const isValidForTyping = (input: string, maxLength: number = 1000): boolean => {
  if (input.length > maxLength) {
    return false;
  }
  
  // Allow more lenient validation during typing, but still block obvious threats
  const criticalPatterns = [
    /<script[^>]*>/i,
    /javascript\s*:/i,
    /vbscript\s*:/i
  ];
  
  return !criticalPatterns.some(pattern => pattern.test(input));
};

// URL validation with security checks
export const validateURL = (url: string): boolean => {
  return xssProtection.validateURL(url);
};

// Validate file uploads
export const validateFileUpload = (file: File): { isValid: boolean; message: string } => {
  const allowedTypes = [
    'image/jpeg', 
    'image/jpg', 
    'image/png', 
    'image/gif', 
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  const maxSize = 10 * 1024 * 1024; // 10MB
  const dangerousExtensions = [
    '.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.dll', '.jar',
    '.js', '.vbs', '.ps1', '.sh', '.php', '.asp', '.jsp'
  ];

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, message: 'File type not allowed' };
  }

  // Check file size
  if (file.size > maxSize) {
    return { isValid: false, message: 'File size too large (max 10MB)' };
  }

  // Check for dangerous extensions
  const fileName = file.name.toLowerCase();
  if (dangerousExtensions.some(ext => fileName.endsWith(ext))) {
    return { isValid: false, message: 'File extension not allowed for security reasons' };
  }

  // Check for double extensions (e.g., file.pdf.exe)
  const parts = fileName.split('.');
  if (parts.length > 2) {
    for (let i = 1; i < parts.length - 1; i++) {
      if (dangerousExtensions.includes('.' + parts[i])) {
        return { isValid: false, message: 'Suspicious file name detected' };
      }
    }
  }

  return { isValid: true, message: 'File is valid' };
};
