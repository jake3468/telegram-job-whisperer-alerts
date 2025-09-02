import { useEffect, useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from './ui/carousel';
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
  const isMobile = useIsMobile();
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkTablet = () => {
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };
    
    checkTablet();
    window.addEventListener('resize', checkTablet);
    return () => window.removeEventListener('resize', checkTablet);
  }, []);

  // Mobile: Carousel view
  if (isMobile) {
    return (
      <div className="w-full max-w-sm mx-auto">
        <Carousel className="w-full">
          <CarouselContent>
            {aiAgents.map((agent, index) => (
              <CarouselItem key={agent.id}>
                <Card className="bg-white border-gray-200 shadow-lg animate-[slide-left_20s_linear_infinite] hover:animate-none">
                  <CardContent className="p-4 text-center" style={{ animationDelay: `${index * 2}s` }}>
                    <div className="mb-3">
                      <img 
                        src={agent.previewImage} 
                        alt={`${agent.title} preview`}
                        className="w-full h-32 object-cover rounded-lg mb-3"
                      />
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="text-2xl">{agent.icon}</span>
                        <h3 className="font-semibold text-black text-sm">{agent.title}</h3>
                      </div>
                    </div>
                    <p className="text-xs text-gray-700 mb-3 leading-relaxed">
                      {agent.description}
                    </p>
                    <a 
                      href={agent.telegramUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200 text-xs"
                      style={{ color: agent.color }}
                    >
                      <span>Start Now</span>
                      {telegramAnimationData && (
                        <div className="w-4 h-4">
                          <Lottie animationData={telegramAnimationData} loop={true} autoplay={true} />
                        </div>
                      )}
                    </a>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-2" />
          <CarouselNext className="right-2" />
        </Carousel>
      </div>
    );
  }

  // Tablet: Grid view (2x2 with center alignment)
  if (isTablet) {
    return (
      <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
        {aiAgents.map((agent, index) => (
          <Card 
            key={agent.id} 
            className={`bg-white border-gray-200 shadow-lg animate-[slide-left_25s_linear_infinite] hover:animate-none hover:scale-105 transition-all duration-200 ${
              index === 2 ? 'col-span-2 max-w-sm mx-auto' : ''
            }`}
            style={{ animationDelay: `${index * 3}s` }}
          >
            <CardContent className="p-4 text-center">
              <div className="mb-3">
                <img 
                  src={agent.previewImage} 
                  alt={`${agent.title} preview`}
                  className="w-full h-24 object-cover rounded-lg mb-3"
                />
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-xl">{agent.icon}</span>
                  <h3 className="font-semibold text-black text-sm">{agent.title}</h3>
                </div>
              </div>
              <p className="text-xs text-gray-700 mb-3 leading-relaxed">
                {agent.description}
              </p>
              <a 
                href={agent.telegramUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200 text-xs"
                style={{ color: agent.color }}
              >
                <span>Start Now</span>
                {telegramAnimationData && (
                  <div className="w-4 h-4">
                    <Lottie animationData={telegramAnimationData} loop={true} autoplay={true} />
                  </div>
                )}
              </a>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Desktop: Horizontal row
  return (
    <div className="flex flex-wrap justify-center gap-6 max-w-6xl mx-auto">
      {aiAgents.map((agent, index) => (
        <Card 
          key={agent.id} 
          className="bg-white border-gray-200 shadow-lg animate-[slide-left_30s_linear_infinite] hover:animate-none hover:scale-105 transition-all duration-200 max-w-xs"
          style={{ animationDelay: `${index * 4}s` }}
        >
          <CardContent className="p-6 text-center">
            <div className="mb-4">
              <img 
                src={agent.previewImage} 
                alt={`${agent.title} preview`}
                className="w-full h-32 object-cover rounded-lg mb-4"
              />
              <div className="flex items-center justify-center gap-2 mb-3">
                <span className="text-2xl">{agent.icon}</span>
                <h3 className="font-semibold text-black">{agent.title}</h3>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-4 leading-relaxed">
              {agent.description}
            </p>
            <a 
              href={agent.telegramUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200 text-sm"
              style={{ color: agent.color }}
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
      ))}
    </div>
  );
};

export default AIAgentsCarousel;