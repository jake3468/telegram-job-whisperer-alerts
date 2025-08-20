/**
 * Safe storage utilities with try-catch and memory-based fallbacks
 * Prevents "Access denied" errors in browsers with strict privacy settings
 */

// Memory-based fallback storage for when browser storage is blocked
class MemoryStorage implements Storage {
  private data: Record<string, string> = {};

  get length(): number {
    return Object.keys(this.data).length;
  }

  getItem(key: string): string | null {
    return this.data[key] || null;
  }

  setItem(key: string, value: string): void {
    this.data[key] = value;
  }

  removeItem(key: string): void {
    delete this.data[key];
  }

  clear(): void {
    this.data = {};
  }

  key(index: number): string | null {
    const keys = Object.keys(this.data);
    return keys[index] || null;
  }
}

// Create memory-based fallback instances
const memoryLocalStorage = new MemoryStorage();
const memorySessionStorage = new MemoryStorage();

// Storage availability flags
let localStorageAvailable = false;
let sessionStorageAvailable = false;

// Test storage availability lazily when first accessed
const testStorageAvailability = () => {
  if (localStorageAvailable || sessionStorageAvailable) return; // Already tested
  
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    localStorageAvailable = true;
  } catch {
    localStorageAvailable = false;
  }

  try {
    const testKey = '__storage_test__';
    sessionStorage.setItem(testKey, 'test');
    sessionStorage.removeItem(testKey);
    sessionStorageAvailable = true;
  } catch {
    sessionStorageAvailable = false;
  }
};

/**
 * Safe localStorage wrapper with memory fallback
 */
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    testStorageAvailability(); // Test only when needed
    try {
      if (localStorageAvailable) {
        return localStorage.getItem(key);
      }
      return memoryLocalStorage.getItem(key);
    } catch {
      return memoryLocalStorage.getItem(key);
    }
  },

  setItem: (key: string, value: string): void => {
    testStorageAvailability(); // Test only when needed
    try {
      if (localStorageAvailable) {
        localStorage.setItem(key, value);
        return;
      }
      memoryLocalStorage.setItem(key, value);
    } catch {
      memoryLocalStorage.setItem(key, value);
    }
  },

  removeItem: (key: string): void => {
    try {
      if (localStorageAvailable) {
        localStorage.removeItem(key);
        return;
      }
      memoryLocalStorage.removeItem(key);
    } catch {
      memoryLocalStorage.removeItem(key);
    }
  },

  clear: (): void => {
    try {
      if (localStorageAvailable) {
        localStorage.clear();
        return;
      }
      memoryLocalStorage.clear();
    } catch {
      memoryLocalStorage.clear();
    }
  }
};

/**
 * Safe sessionStorage wrapper with memory fallback
 */
export const safeSessionStorage = {
  getItem: (key: string): string | null => {
    testStorageAvailability(); // Test only when needed
    try {
      if (sessionStorageAvailable) {
        return sessionStorage.getItem(key);
      }
      return memorySessionStorage.getItem(key);
    } catch {
      return memorySessionStorage.getItem(key);
    }
  },

  setItem: (key: string, value: string): void => {
    testStorageAvailability(); // Test only when needed
    try {
      if (sessionStorageAvailable) {
        sessionStorage.setItem(key, value);
        return;
      }
      memorySessionStorage.setItem(key, value);
    } catch {
      memorySessionStorage.setItem(key, value);
    }
  },

  removeItem: (key: string): void => {
    try {
      if (sessionStorageAvailable) {
        sessionStorage.removeItem(key);
        return;
      }
      memorySessionStorage.removeItem(key);
    } catch {
      memorySessionStorage.removeItem(key);
    }
  },

  clear: (): void => {
    try {
      if (sessionStorageAvailable) {
        sessionStorage.clear();
        return;
      }
      memorySessionStorage.clear();
    } catch {
      memorySessionStorage.clear();
    }
  }
};

/**
 * Check if browser storage is available
 */
export const isStorageAvailable = {
  localStorage: () => localStorageAvailable,
  sessionStorage: () => sessionStorageAvailable,
  both: () => localStorageAvailable && sessionStorageAvailable
};