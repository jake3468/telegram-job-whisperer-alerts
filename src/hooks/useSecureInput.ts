
import { useState, useCallback } from 'react';
import { validateInput, sanitizeText } from '@/utils/sanitize';
import { useToast } from '@/hooks/use-toast';

interface UseSecureInputOptions {
  maxLength?: number;
  fieldName?: string;
}

export const useSecureInput = (initialValue: string = '', options: UseSecureInputOptions = {}) => {
  const { maxLength = 1000, fieldName = 'Input' } = options;
  const [value, setValue] = useState(initialValue);
  const { toast } = useToast();

  const handleChange = useCallback((newValue: string) => {
    const sanitizedValue = sanitizeText(newValue);
    
    if (!validateInput(sanitizedValue, maxLength)) {
      toast({
        title: "Invalid Input",
        description: `${fieldName} contains invalid characters or exceeds maximum length.`,
        variant: "destructive"
      });
      return false;
    }
    
    setValue(sanitizedValue);
    return true;
  }, [maxLength, fieldName, toast]);

  const reset = useCallback(() => {
    setValue('');
  }, []);

  return {
    value,
    handleChange,
    reset,
    isValid: validateInput(value, maxLength)
  };
};
