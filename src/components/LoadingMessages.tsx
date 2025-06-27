
import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingMessagesProps {
  type: 'job_analysis' | 'interview_prep' | 'cover_letter' | 'linkedin_post' | 'company_analysis';
}

const LoadingMessages: React.FC<LoadingMessagesProps> = ({ type }) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  const messagesByType = {
    job_analysis: [
      "Analyzing job requirements...",
      "Extracting key skills and qualifications...",
      "Matching with your profile...",
      "Generating personalized insights...",
      "Finalizing your job analysis..."
    ],
    interview_prep: [
      "Analyzing company culture...",
      "Researching recent company news...",
      "Generating tailored interview questions...",
      "Preparing industry-specific scenarios...",
      "Finalizing your interview preparation..."
    ],
    cover_letter: [
      "Analyzing job requirements...",
      "Personalizing content for the role...",
      "Crafting compelling introduction...",
      "Highlighting relevant experience...",
      "Finalizing your cover letter..."
    ],
    linkedin_post: [
      "Brainstorming content ideas...",
      "Researching trending topics...",
      "Crafting engaging headlines...",
      "Writing compelling content...",
      "Finalizing your LinkedIn posts..."
    ],
    company_analysis: [
      "Researching company background...",
      "Analyzing market position...",
      "Gathering recent news and updates...",
      "Evaluating role security...",
      "Generating comprehensive analysis..."
    ]
  };

  const messages = messagesByType[type];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="flex flex-col items-center justify-center space-y-4 py-8">
      <div className="relative">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
        <div className="absolute inset-0 animate-pulse">
          <div className="h-8 w-8 rounded-full bg-purple-400/20"></div>
        </div>
      </div>
      
      <div className="text-center space-y-2">
        <p className="text-white font-medium animate-fade-in">
          {messages[currentMessageIndex]}
        </p>
        <p className="text-gray-400 text-sm">
          This usually takes 30-60 seconds
        </p>
      </div>
      
      <div className="flex space-x-1">
        {messages.map((_, index) => (
          <div
            key={index}
            className={`h-2 w-2 rounded-full transition-colors duration-300 ${
              index === currentMessageIndex ? 'bg-purple-400' : 'bg-gray-600'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default LoadingMessages;
