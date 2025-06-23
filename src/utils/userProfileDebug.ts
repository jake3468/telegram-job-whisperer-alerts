
import { Environment } from '@/utils/environment';

export const createUserProfileDebugger = () => {
  const debugLog = (message: string, data?: any) => {
    if (Environment.isDevelopment()) {
      console.log(`[UserProfile] ${message}`, data ? data : '');
    }
  };

  return { debugLog };
};
