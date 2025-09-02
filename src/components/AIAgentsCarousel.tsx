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
      <div className="w-full max-w-xs mx-auto px-2">
        <Carousel className="w-full">
          <CarouselContent className="-ml-2 md:-ml-4">
            {aiAgents.map((agent) => (
              <CarouselItem key={agent.id} className="pl-2 md:pl-4">
                <Card className="bg-gray-50 border-gray-200 rounded-2xl shadow-sm">
                  <CardContent className="p-3 text-center">
                    <div className="mb-3">
                      <img 
                        src={agent.previewImage} 
                        alt={`${agent.title} preview`}
                        className="w-full h-24 object-cover rounded-lg mb-3"
                      />
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="text-xl">{agent.icon}</span>
                        <h3 className="font-semibold text-neutral-950 text-sm font-opensans leading-tight">{agent.title}</h3>
                      </div>
                    </div>
                    <p className="text-xs text-neutral-950 mb-3 leading-relaxed font-opensans font-light">
                      {agent.description}
                    </p>
                    <a 
                      href={agent.telegramUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 text-xs font-medium"
                    >
                      <span>Start Now</span>
                      {telegramAnimationData && (
                        <div className="w-3 h-3">
                          <Lottie animationData={telegramAnimationData} loop={true} autoplay={true} />
                        </div>
                      )}
                    </a>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-1" />
          <CarouselNext className="right-1" />
        </Carousel>
      </div>
    );
  }

  // Tablet: Grid view (2x2 with center alignment)
  if (isTablet) {
    return (
      <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto px-4">
        {aiAgents.map((agent, index) => (
          <Card 
            key={agent.id} 
            className={`bg-gray-50 border-gray-200 rounded-2xl shadow-sm hover:scale-105 transition-all duration-200 ${
              index === 2 ? 'col-span-2 max-w-sm mx-auto' : ''
            }`}
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
                  <h3 className="font-semibold text-neutral-950 text-sm font-opensans leading-tight">{agent.title}</h3>
                </div>
              </div>
              <p className="text-xs text-neutral-950 mb-3 leading-relaxed font-opensans font-light">
                {agent.description}
              </p>
              <a 
                href={agent.telegramUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 text-xs font-medium"
              >
                <span>Start Now</span>
                {telegramAnimationData && (
                  <div className="w-3 h-3">
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
    <div className="flex flex-wrap justify-center gap-6 max-w-6xl mx-auto px-4">
      {aiAgents.map((agent) => (
        <Card 
          key={agent.id} 
          className="bg-gray-50 border-gray-200 rounded-2xl shadow-sm hover:scale-105 transition-all duration-200 max-w-xs"
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
                <h3 className="font-semibold text-neutral-950 font-opensans leading-tight">{agent.title}</h3>
              </div>
            </div>
            <p className="text-sm text-neutral-950 mb-4 leading-relaxed font-opensans font-light">
              {agent.description}
            </p>
            <a 
              href={agent.telegramUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 text-sm font-medium"
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
};

export default AIAgentsCarousel;