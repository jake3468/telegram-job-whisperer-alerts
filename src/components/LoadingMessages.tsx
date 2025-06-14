
import { useEffect, useState } from 'react';
import { Loader2, Sparkles, TrendingUp, Brain, Zap } from 'lucide-react';

const loadingMessages = [
  { icon: Sparkles, text: "Generating your LinkedIn post..." },
  { icon: TrendingUp, text: "Analyzing current trends..." },
  { icon: Brain, text: "Crafting engaging content..." },
  { icon: Zap, text: "Adding professional polish..." },
  { icon: Sparkles, text: "Optimizing for maximum engagement..." },
];

const LoadingMessages = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const CurrentIcon = loadingMessages[currentIndex].icon;

  return (
    <div className="flex items-center justify-center gap-3 py-8">
      <div className="relative">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
        <CurrentIcon className="w-4 h-4 text-slate-600 absolute top-1 left-1" />
      </div>
      <span className="text-slate-600 text-lg font-medium animate-pulse">
        {loadingMessages[currentIndex].text}
      </span>
    </div>
  );
};

export default LoadingMessages;
