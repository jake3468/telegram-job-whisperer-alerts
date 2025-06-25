
import DOMPurify from 'dompurify';

export const sanitizeHTML = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    ALLOWED_ATTR: []
  });
};

export const sanitizeText = (text: string): string => {
  // Only remove HTML tags and decode entities, don't be overly aggressive
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'");
};

export const validateInput = (input: string, maxLength: number = 1000): boolean => {
  if (!input || input.length > maxLength) {
    return false;
  }
  
  // Only check for truly malicious patterns, not normal editing
  const suspiciousPatterns = [
    /<script[^>]*>/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /data:text\/html/i
  ];
  
  return !suspiciousPatterns.some(pattern => pattern.test(input));
};

// New function for more lenient real-time validation during typing
export const isValidForTyping = (input: string, maxLength: number = 1000): boolean => {
  // Allow empty input and reasonable length
  if (input.length > maxLength) {
    return false;
  }
  
  // Only block clearly malicious content, allow normal text editing
  const maliciousPatterns = [
    /<script[^>]*>/i,
    /javascript:/i
  ];
  
  return !maliciousPatterns.some(pattern => pattern.test(input));
};
