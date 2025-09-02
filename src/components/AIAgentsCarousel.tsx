import { useEffect, useState } from 'react';
import { Card, CardContent } from './ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import Lottie from 'lottie-react';
const jobApplicationPreview = '/lovable-uploads/2b660a4e-994b-4576-b0b9-92c1edfd908e.png';
import jobAlertsPreview from '@/assets/job-alerts-agent-preview.png';
import resumeBuilderPreview from '@/assets/resume-builder-agent-preview.png';

interface AIAgent {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  textGlow: string;
  telegramUrl: string;
  previewImage: string;
}

const aiAgents: AIAgent[] = [
  {
    id: 'job-application',
    title: 'Job Application Agent',
    description: 'Automatically applies to jobs that match your profile with tailored cover letters',
    icon: '👔',
    color: '#00E5FF',
    textGlow: 'rgba(0,229,255,0.8)',
    telegramUrl: 'https://t.me/add_job_aspirelyai_bot',
    previewImage: jobApplicationPreview
  },
  {
    id: 'job-alerts',
    title: 'Job Alerts Agent',
    description: 'Sends you daily job alerts tailored to your preferences and location',
    icon: '🔔',
    color: '#00FF85',
    textGlow: 'rgba(0,255,133,0.8)',
    telegramUrl: 'https://t.me/Job_AI_update_bot',
    previewImage: jobAlertsPreview
  },
  {
    id: 'resume-builder',
    title: 'Resume Builder Agent',
    description: 'Creates and updates your resume with AI optimization for better job matches',
    icon: '📝',
    color: '#FF4FFF',
    textGlow: 'rgba(255,79,255,0.8)',
    telegramUrl: 'https://t.me/Resume_builder_AI_bot',
    previewImage: resumeBuilderPreview
  }
];

interface AIAgentsCarouselProps {
  telegramAnimationData?: any;
}

const AIAgentsCarousel = ({ telegramAnimationData }: AIAgentsCarouselProps) => {
  const [scrollY, setScrollY] = useState(0);
  const [activeCard, setActiveCard] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      
      // Calculate which card should be active based on scroll position
      const scrollProgress = window.scrollY / (window.innerHeight * 0.5);
      const newActiveCard = Math.min(Math.floor(scrollProgress), aiAgents.length - 1);
      setActiveCard(Math.max(0, newActiveCard));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative h-[200vh] w-full">
      <div className="sticky top-1/2 transform -translate-y-1/2 flex justify-center items-center px-4">
        <div className="relative w-full max-w-md">
          {aiAgents.map((agent, index) => {
            const offset = (index - activeCard) * 20;
            const scale = index === activeCard ? 1 : 0.9 - Math.abs(index - activeCard) * 0.1;
            const opacity = index === activeCard ? 1 : Math.max(0.3, 1 - Math.abs(index - activeCard) * 0.3);
            const zIndex = aiAgents.length - Math.abs(index - activeCard);

            return (
              <Card 
                key={agent.id}
                className="absolute inset-0 bg-gray-50 border-gray-200 rounded-3xl shadow-xl transition-all duration-500 ease-out"
                style={{
                  transform: `translateY(${offset}px) scale(${scale})`,
                  opacity,
                  zIndex
                }}
              >
                <CardContent className="p-8 text-center h-full flex flex-col justify-between">
                  <div className="flex-1">
                    <div className="mb-6">
                      <img 
                        src={agent.previewImage} 
                        alt={`${agent.title} preview`}
                        className="w-full h-48 object-cover rounded-2xl mb-6"
                      />
                      <div className="flex items-center justify-center gap-3 mb-4">
                        <span className="text-4xl">{agent.icon}</span>
                        <h3 className="font-bold text-neutral-950 text-2xl font-opensans leading-tight">{agent.title}</h3>
                      </div>
                    </div>
                    <p className="text-base text-neutral-950 mb-6 leading-relaxed font-opensans font-light">
                      {agent.description}
                    </p>
                  </div>
                  <a 
                    href={agent.telegramUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-200 text-lg font-medium shadow-lg hover:shadow-xl"
                  >
                    <span>Start Now</span>
                    {telegramAnimationData && (
                      <div className="w-6 h-6">
                        <Lottie animationData={telegramAnimationData} loop={true} autoplay={true} />
                      </div>
                    )}
                  </a>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
      
      {/* Progress indicator */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2 z-50">
        {aiAgents.map((_, index) => (
          <div
            key={index}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === activeCard ? 'bg-blue-600 scale-125' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default AIAgentsCarousel;