
// Environment detection utilities
export const Environment = {
  isProduction: () => window.location.hostname === 'aspirely.ai',
  isLovablePreview: () => window.location.hostname.includes('lovable.app'),
  isDevelopment: () => window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1'),
  
  getCurrentEnvironment: () => {
    if (Environment.isProduction()) return 'production';
    if (Environment.isLovablePreview()) return 'preview';
    if (Environment.isDevelopment()) return 'development';
    return 'unknown';
  },
  
  getClerkEnvironment: () => {
    return Environment.isProduction() ? 'production' : 'development';
  }
};

// Export for debugging purposes
export const debugEnvironment = () => {
  console.log('Environment Debug Info:', {
    hostname: window.location.hostname,
    currentEnvironment: Environment.getCurrentEnvironment(),
    clerkEnvironment: Environment.getClerkEnvironment(),
    isProduction: Environment.isProduction(),
    isLovablePreview: Environment.isLovablePreview(),
    isDevelopment: Environment.isDevelopment()
  });
};
