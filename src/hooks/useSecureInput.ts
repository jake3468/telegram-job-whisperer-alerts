
import { useState, useCallback } from 'react';
import { inputSanitizer } from '@/utils/inputSanitizer';
import { xssProtection } from '@/utils/xssProtection';
import { securityMonitor } from '@/utils/securityMonitor';
import { useToast } from '@/hooks/use-toast';

interface UseSecureInputOptions {
  maxLength?: number;
  fieldName?: string;
  identifier?: string;
  enableXSSProtection?: boolean;
  enableSQLInjectionCheck?: boolean;
}

export const useSecureInput = (
  initialValue: string = '', 
  options: UseSecureInputOptions = {}
) => {
  const { 
    maxLength = 1000, 
    fieldName = 'Input',
    identifier = 'anonymous',
    enableXSSProtection = true,
    enableSQLInjectionCheck = true
  } = options;
  
  const [value, setValue] = useState(initialValue);
  const [isValid, setIsValid] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);
  const { toast } = useToast();

  const validateInput = useCallback((input: string): { isValid: boolean; errors: string[] } => {
    const validationErrors: string[] = [];

    // Length validation
    if (input.length > maxLength) {
      validationErrors.push(`${fieldName} exceeds maximum length of ${maxLength} characters`);
    }

    // XSS Protection
    if (enableXSSProtection) {
      const xssResult = xssProtection.detectXSS(input, identifier);
      if (!xssResult.isSafe) {
        validationErrors.push(`${fieldName} contains potentially dangerous content`);
        
        securityMonitor.logSecurityEvent({
          type: 'invalid_input',
          identifier,
          details: { 
            fieldName, 
            threatType: 'XSS',
            threatsFound: xssResult.threats.length 
          },
          severity: 'medium'
        });
      }
    }

    // SQL Injection Check
    if (enableSQLInjectionCheck && inputSanitizer.checkForSQLInjection(input)) {
      validationErrors.push(`${fieldName} contains invalid patterns`);
      
      securityMonitor.logSecurityEvent({
        type: 'invalid_input',
        identifier,
        details: { 
          fieldName, 
          threatType: 'SQL_INJECTION',
          inputLength: input.length 
        },
        severity: 'high'
      });
    }

    // Email validation if it looks like an email field
    if (fieldName.toLowerCase().includes('email') && input.includes('@')) {
      if (!inputSanitizer.validateEmail(input)) {
        validationErrors.push('Please enter a valid email address');
      }
    }

    return {
      isValid: validationErrors.length === 0,
      errors: validationErrors
    };
  }, [maxLength, fieldName, identifier, enableXSSProtection, enableSQLInjectionCheck]);

  const handleChange = useCallback((newValue: string) => {
    // Sanitize input first
    const sanitizedValue = inputSanitizer.sanitizeTextInput(newValue, maxLength);
    
    // Validate the sanitized input
    const validation = validateInput(sanitizedValue);
    
    setIsValid(validation.isValid);
    setErrors(validation.errors);
    
    if (!validation.isValid) {
      // Show first error as toast
      toast({
        title: "Invalid Input",
        description: validation.errors[0],
        variant: "destructive"
      });
      
      // Don't update value if invalid
      return false;
    }
    
    setValue(sanitizedValue);
    return true;
  }, [maxLength, validateInput, toast]);

  const reset = useCallback(() => {
    setValue('');
    setIsValid(true);
    setErrors([]);
  }, []);

  const forceSet = useCallback((newValue: string) => {
    const sanitizedValue = inputSanitizer.sanitizeTextInput(newValue, maxLength);
    setValue(sanitizedValue);
    
    const validation = validateInput(sanitizedValue);
    setIsValid(validation.isValid);
    setErrors(validation.errors);
  }, [maxLength, validateInput]);

  return {
    value,
    handleChange,
    reset,
    forceSet,
    isValid,
    errors,
    sanitizedValue: inputSanitizer.sanitizeForDisplay(value)
  };
};
