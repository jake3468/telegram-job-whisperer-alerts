import { useEffect } from 'react';
import { supabase, makeAuthenticatedRequest } from '@/integrations/supabase/client';
import { securityMonitor } from '@/utils/securityMonitor';
import { authRateLimiter } from '@/utils/rateLimiter';
import { useUser } from '@clerk/clerk-react';
import { Database } from '@/integrations/supabase/types';

interface SecureQueryOptions {
  requireAuth?: boolean;
  operationType?: string;
  maxRetries?: number;
}

export const useSecureSupabase = () => {
  const { user } = useUser();

  // Initialize security monitoring
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User switched tabs/minimized - potential security event
        securityMonitor.logSecurityEvent({
          type: 'suspicious_activity',
          identifier: user?.id || 'anonymous',
          details: { action: 'tab_hidden', timestamp: Date.now() },
          severity: 'low'
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user?.id]);

  const secureQuery = async <T>(
    operation: () => Promise<T>,
    options: SecureQueryOptions = {}
  ): Promise<T> => {
    const { requireAuth = true, operationType = 'query', maxRetries = 3 } = options;
    
    // Check authentication if required
    if (requireAuth && !user) {
      securityMonitor.logSecurityEvent({
        type: 'invalid_input',
        identifier: 'anonymous',
        details: { operation: operationType, reason: 'unauthenticated_access' },
        severity: 'medium'
      });
      throw new Error('Authentication required');
    }

    // Check rate limits for auth operations
    if (operationType.includes('auth')) {
      const rateLimitResult = authRateLimiter.checkLimit(user?.id || 'anonymous');
      if (!rateLimitResult.allowed) {
        throw new Error('Too many authentication attempts. Please try again later.');
      }
    }

    try {
      if (requireAuth) {
        return await makeAuthenticatedRequest(operation, operationType, maxRetries);
      } else {
        return await operation();
      }
    } catch (error) {
      // Log security-relevant errors
      securityMonitor.logSecurityEvent({
        type: 'potential_attack',
        identifier: user?.id || 'anonymous',
        details: { 
          operation: operationType, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        },
        severity: error instanceof Error && error.message.includes('rate limit') ? 'medium' : 'high'
      });
      throw error;
    }
  };

  // Secure methods for common operations
  const secureSelect = async <T>(
    table: keyof Database['public']['Tables'],
    query?: string,
    options: SecureQueryOptions = {}
  ) => {
    return secureQuery(async () => {
      let queryBuilder = supabase.from(table).select(query || '*');
      const { data, error } = await queryBuilder;
      if (error) throw error;
      return data as T;
    }, { ...options, operationType: `select_${table}` });
  };

  const secureInsert = async <T>(
    table: keyof Database['public']['Tables'],
    data: any,
    options: SecureQueryOptions = {}
  ) => {
    return secureQuery(async () => {
      // Ensure user_id is set for user-specific tables
      const insertData = user && (table.includes('user') || table.includes('profile')) 
        ? { ...data, user_id: user.id }
        : data;

      const { data: result, error } = await supabase.from(table).insert(insertData).select();
      if (error) throw error;
      return result as T;
    }, { ...options, operationType: `insert_${table}` });
  };

  const secureUpdate = async <T>(
    table: keyof Database['public']['Tables'],
    data: any,
    condition: any,
    options: SecureQueryOptions = {}
  ) => {
    return secureQuery(async () => {
      const { data: result, error } = await supabase.from(table).update(data).match(condition).select();
      if (error) throw error;
      return result as T;
    }, { ...options, operationType: `update_${table}` });
  };

  const secureDelete = async (
    table: keyof Database['public']['Tables'],
    condition: any,
    options: SecureQueryOptions = {}
  ) => {
    return secureQuery(async () => {
      const { error } = await supabase.from(table).delete().match(condition);
      if (error) throw error;
      return true;
    }, { ...options, operationType: `delete_${table}` });
  };

  return {
    secureQuery,
    secureSelect,
    secureInsert,
    secureUpdate,
    secureDelete,
    supabase
  };
};