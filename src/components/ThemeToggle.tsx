import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse" />
    );
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <button
      onClick={toggleTheme}
      className="relative w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 
                 hover:bg-white/20 dark:bg-white/10 dark:border-white/20 dark:hover:bg-white/20
                 transition-all duration-300 ease-out group focus:outline-none focus:ring-2 
                 focus:ring-sky-400/50 focus:ring-offset-2 focus:ring-offset-transparent"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <div className="absolute inset-0 rounded-full overflow-hidden">
        <div
          className={`absolute inset-0 transition-transform duration-500 ease-out ${
            theme === 'dark' ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <Moon className="w-5 h-5 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div
          className={`absolute inset-0 transition-transform duration-500 ease-out ${
            theme === 'light' ? 'translate-y-0' : '-translate-y-full'
          }`}
        >
          <Sun className="w-5 h-5 text-yellow-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        </div>
      </div>
    </button>
  );
};

export default ThemeToggle;