
import { useCallback } from 'react';
import { apiSecurityMiddleware } from '@/utils/apiSecurityMiddleware';
import { logger } from '@/utils/logger';
import { useToast } from '@/hooks/use-toast';

interface SecureAPIOptions {
  identifier?: string;
  enableSecurity?: boolean;
}

export const useSecureAPI = (options: SecureAPIOptions = {}) => {
  const { identifier = 'anonymous', enableSecurity = true } = options;
  const { toast } = useToast();

  const secureRequest = useCallback(async <T>(
    requestFn: () => Promise<T>,
    context?: {
      method?: string;
      url?: string;
      body?: any;
    }
  ): Promise<T | null> => {
    if (!enableSecurity) {
      return await requestFn();
    }

    try {
      // Prepare request context
      const requestContext = {
        method: context?.method || 'GET',
        url: context?.url || window.location.pathname,
        headers: {
          'User-Agent': navigator.userAgent,
          'Origin': window.location.origin
        },
        body: context?.body,
        userAgent: navigator.userAgent,
        ip: 'client-side' // Will be determined server-side
      };

      // Check security
      const securityCheck = apiSecurityMiddleware.checkRequestSecurity(requestContext, identifier);
      
      if (!securityCheck.allowed) {
        logger.warn('Request blocked by security middleware', { reason: securityCheck.reason });
        
        toast({
          title: "Request Blocked",
          description: "Your request was blocked for security reasons. Please try again.",
          variant: "destructive"
        });
        
        return null;
      }

      // Execute the request
      const result = await requestFn();
      logger.debug('Secure API request completed successfully');
      
      return result;
    } catch (error) {
      logger.error('Secure API request failed', error);
      
      toast({
        title: "Request Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
      
      throw error;
    }
  }, [identifier, enableSecurity, toast]);

  return { secureRequest };
};
