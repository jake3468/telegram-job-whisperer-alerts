
import { useEffect, useState } from 'react';
import { Loader2, Sparkles, TrendingUp, Brain, Zap, FileText, PenTool, Building2, Search, Target, MessageSquare, Users, Lightbulb } from 'lucide-react';

interface LoadingMessage {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
}

interface LoadingMessagesProps {
  type?: 'linkedin' | 'cover_letter' | 'company_analysis' | 'interview_prep';
  messages?: string[];
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

const companyAnalysisMessages: LoadingMessage[] = [
  { icon: Search, text: "🔍 Researching company culture and values..." },
  { icon: TrendingUp, text: "📊 Analyzing role requirements and expectations..." },
  { icon: Brain, text: "💡 Identifying key success factors..." },
  { icon: Target, text: "🎯 Preparing strategic insights..." },
  { icon: Sparkles, text: "✨ Finalizing your competitive advantage report..." },
];

const interviewPrepMessages: LoadingMessage[] = [
  { icon: MessageSquare, text: "Creating your interview questions..." },
  { icon: Brain, text: "Generating perfect answers and pro tips..." },
  { icon: Lightbulb, text: "Crafting strategic questions to ask..." },
  { icon: Users, text: "Analyzing company culture insights..." },
  { icon: Target, text: "Preparing role-specific considerations..." },
  { icon: Sparkles, text: "Finalizing your interview prep guide..." },
];

const LoadingMessages = ({ type = 'linkedin', messages }: LoadingMessagesProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  let messagesList: LoadingMessage[];
  
  if (messages) {
    // Convert custom messages to LoadingMessage format
    messagesList = messages.map((text, index) => ({
      icon: [Search, TrendingUp, Brain, Target, Sparkles][index % 5],
      text
    }));
  } else {
    // Use predefined messages based on type
    switch (type) {
      case 'cover_letter':
        messagesList = coverLetterMessages;
        break;
      case 'company_analysis':
        messagesList = companyAnalysisMessages;
        break;
      case 'interview_prep':
        messagesList = interviewPrepMessages;
        break;
      default:
        messagesList = linkedinMessages;
    }
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messagesList.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [messagesList.length]);

  const CurrentIcon = messagesList[currentIndex].icon;

  return (
    <div className="flex items-center justify-center gap-3 py-8">
      <div className="relative">
        <Loader2 className="w-6 h-6 text-fuchsia-300 animate-spin" />
        <CurrentIcon className="w-4 h-4 text-fuchsia-400 absolute top-1 left-1" />
      </div>
      <span className="text-fuchsia-100 text-lg font-semibold animate-pulse drop-shadow">
        {messagesList[currentIndex].text}
      </span>
    </div>
  );
};

export default LoadingMessages;
