import { useEffect } from 'react';
import { useTheme } from 'next-themes';

export const useThemeColor = () => {
  const { theme, resolvedTheme } = useTheme();
  
  useEffect(() => {
    const updateThemeColor = () => {
      const metaThemeColor = document.getElementById('theme-color-meta') as HTMLMetaElement;
      if (metaThemeColor) {
        // Use resolvedTheme which gives us the actual applied theme
        const currentTheme = resolvedTheme || theme;
        
        if (currentTheme === 'light') {
          // Black browser tab for light mode
          metaThemeColor.content = '#000000';
        } else {
          // Dark browser tab for dark mode
          metaThemeColor.content = '#1a1a2e';
        }
      }
    };

    // Update immediately
    updateThemeColor();
    
    // Also update after a small delay to ensure theme has been applied
    const timeoutId = setTimeout(updateThemeColor, 100);
    
    return () => clearTimeout(timeoutId);
  }, [theme, resolvedTheme]);
};