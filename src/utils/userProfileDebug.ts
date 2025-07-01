
import { Environment } from '@/utils/environment';

export const createUserProfileDebugger = () => {
  const debugLog = (message: string, data?: any) => {
    // Debug logs are disabled for production readiness
    return;
  };

  return { debugLog };
};
