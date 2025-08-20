export interface StorageCapabilities {
  localStorage: boolean;
  sessionStorage: boolean;
  cookies: boolean;
}

export const detectStorageCapabilities = (): StorageCapabilities => {
  const capabilities: StorageCapabilities = {
    localStorage: false,
    sessionStorage: false,
    cookies: false
  };

  // Test localStorage
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    capabilities.localStorage = true;
  } catch (e) {
    console.warn('[STORAGE] localStorage not available:', e);
  }

  // Test sessionStorage
  try {
    const testKey = '__session_test__';
    sessionStorage.setItem(testKey, 'test');
    sessionStorage.removeItem(testKey);
    capabilities.sessionStorage = true;
  } catch (e) {
    console.warn('[STORAGE] sessionStorage not available:', e);
  }

  // Test cookies
  try {
    document.cookie = '__cookie_test__=test; path=/';
    capabilities.cookies = document.cookie.includes('__cookie_test__');
    if (capabilities.cookies) {
      document.cookie = '__cookie_test__=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    }
  } catch (e) {
    console.warn('[STORAGE] cookies not available:', e);
  }

  return capabilities;
};

export const getStorageErrorMessage = (capabilities: StorageCapabilities): string => {
  if (!capabilities.localStorage && !capabilities.sessionStorage && !capabilities.cookies) {
    return 'Your browser is blocking all storage mechanisms. Please enable cookies and local storage, or try a different browser.';
  }
  
  if (!capabilities.sessionStorage && !capabilities.localStorage) {
    return 'Your browser is blocking local storage. This may happen in private/incognito mode or with strict privacy settings.';
  }
  
  if (!capabilities.sessionStorage) {
    return 'Session storage is not available. The app will use alternative storage methods.';
  }
  
  return 'Some storage features are limited in your browser.';
};