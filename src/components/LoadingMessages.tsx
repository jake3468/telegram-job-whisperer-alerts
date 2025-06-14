
import { useEffect, useState } from 'react';
import { Loader2, Sparkles, TrendingUp, Brain, Zap, FileText, PenTool } from 'lucide-react';

interface LoadingMessage {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
}

interface LoadingMessagesProps {
  type?: 'linkedin' | 'cover_letter';
}

const linkedinMessages: LoadingMessage[] = [
  { icon: Sparkles, text: "Generating your LinkedIn post..." },
  { icon: TrendingUp, text: "Analyzing current trends..." },
  { icon: Brain, text: "Crafting engaging content..." },
  { icon: Zap, text: "Adding professional polish..." },
  { icon: Sparkles, text: "Optimizing for maximum engagement..." },
];

const coverLetterMessages: LoadingMessage[] = [
  { icon: FileText, text: "Generating your cover letter..." },
  { icon: Brain, text: "Analyzing job requirements..." },
  { icon: PenTool, text: "Crafting personalized content..." },
  { icon: Sparkles, text: "Adding professional touch..." },
  { icon: Zap, text: "Finalizing your cover letter..." },
];

const LoadingMessages = ({ type = 'linkedin' }: LoadingMessagesProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const messages = type === 'cover_letter' ? coverLetterMessages : linkedinMessages;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [messages.length]);

  const CurrentIcon = messages[currentIndex].icon;

  return (
    <div className="flex items-center justify-center gap-3 py-8">
      <div className="relative">
        <Loader2 className="w-6 h-6 text-fuchsia-300 animate-spin" />
        <CurrentIcon className="w-4 h-4 text-fuchsia-400 absolute top-1 left-1" />
      </div>
      <span className="text-fuchsia-100 text-lg font-semibold animate-pulse drop-shadow">
        {messages[currentIndex].text}
      </span>
    </div>
  );
};

export default LoadingMessages;

