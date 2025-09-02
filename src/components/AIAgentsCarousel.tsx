import { useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from './ui/card';
import Lottie from 'lottie-react';
const jobApplicationPreview = '/lovable-uploads/2b660a4e-994b-4576-b0b9-92c1edfd908e.png';
import jobAlertsPreview from '@/assets/job-alerts-agent-preview.png';
import resumeBuilderPreview from '@/assets/resume-builder-agent-preview.png';

interface AIAgent {
  id: string;
  title: string;
  description: string;
  icon: string;
  telegramUrl: string;
  previewImage: string;
}

const aiAgents: AIAgent[] = [
  {
    id: 'job-application',
    title: 'Job Application Agent',
    description: 'Automatically applies to jobs that match your profile with tailored cover letters',
    icon: '👔',
    telegramUrl: 'https://t.me/add_job_aspirelyai_bot',
    previewImage: jobApplicationPreview
  },
  {
    id: 'job-alerts',
    title: 'Job Alerts Agent',
    description: 'Sends you daily job alerts tailored to your preferences and location',
    icon: '🔔',
    telegramUrl: 'https://t.me/Job_AI_update_bot',
    previewImage: jobAlertsPreview
  },
  {
    id: 'resume-builder',
    title: 'Resume Builder Agent',
    description: 'Creates and updates your resume with AI optimization for better job matches',
    icon: '📝',
    telegramUrl: 'https://t.me/Resume_builder_AI_bot',
    previewImage: resumeBuilderPreview
  }
];

interface AIAgentsCarouselProps {
  telegramAnimationData?: any;
}

const AIAgentsCarousel = ({ telegramAnimationData }: AIAgentsCarouselProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);
  const scrollingRef = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const animateStackCards = useCallback(() => {
    if (!containerRef.current) return;
    
    const containerTop = containerRef.current.getBoundingClientRect().top;
    const cardHeight = window.innerHeight * 0.8; // 80vh card height
    const cardMargin = 20; // Gap between cards

    cardsRef.current.forEach((card, index) => {
      if (!card) return;
      
      const scrolling = -containerTop - index * (cardHeight + cardMargin);
      
      if (scrolling > 0) {
        // Card is in sticky position - apply stacking effect
        const scale = Math.max(0.8, 1 - (scrolling * 0.0008)); // Slower scale down
        const translateY = Math.min(scrolling * 0.1, cardMargin * index);
        
        card.style.transform = `translateY(${translateY}px) scale(${scale})`;
        card.style.zIndex = (aiAgents.length - index).toString();
      } else {
        // Card hasn't reached sticky position yet
        card.style.transform = `translateY(0px) scale(1)`;
        card.style.zIndex = (aiAgents.length - index).toString();
      }
    });

    scrollingRef.current = false;
  }, []);

  const handleScroll = useCallback(() => {
    if (scrollingRef.current) return;
    scrollingRef.current = true;
    requestAnimationFrame(animateStackCards);
  }, [animateStackCards]);

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    if (entries[0].isIntersecting) {
      // Cards are in viewport - add scroll listener
      window.addEventListener('scroll', handleScroll, { passive: true });
    } else {
      // Cards are out of viewport - remove scroll listener
      window.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Intersection Observer
    observerRef.current = new IntersectionObserver(handleIntersection, {
      threshold: 0.1,
    });
    
    observerRef.current.observe(containerRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleIntersection, handleScroll]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full"
      style={{ height: `${100 + aiAgents.length * 100}vh` }} // Dynamic height based on number of cards
    >
      <div className="sticky top-0 h-screen flex items-center justify-center px-4">
        <div className="relative w-full max-w-2xl">
          {aiAgents.map((agent, index) => (
            <Card
              key={agent.id}
              ref={(el) => {
                if (el) cardsRef.current[index] = el;
              }}
              className="absolute inset-0 bg-white border border-gray-200 rounded-3xl shadow-2xl"
              style={{
                height: '80vh',
                top: `${index * 20}px`,
                transformOrigin: 'center top',
                zIndex: aiAgents.length - index,
              }}
            >
              <CardContent className="p-8 h-full flex flex-col">
                <div className="flex-1 flex flex-col justify-center items-center text-center">
                  <div className="mb-8">
                    <img 
                      src={agent.previewImage} 
                      alt={`${agent.title} preview`}
                      className="w-full max-w-md h-64 object-cover rounded-2xl mb-6 mx-auto"
                    />
                    <div className="flex items-center justify-center gap-4 mb-6">
                      <span className="text-5xl">{agent.icon}</span>
                      <h3 className="font-bold text-black text-3xl font-opensans leading-tight">
                        {agent.title}
                      </h3>
                    </div>
                  </div>
                  <p className="text-lg text-black mb-8 leading-relaxed font-opensans font-light max-w-lg">
                    {agent.description}
                  </p>
                </div>
                
                <div className="flex justify-center">
                  <a 
                    href={agent.telegramUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-200 text-xl font-medium shadow-lg hover:shadow-xl min-w-[200px]"
                  >
                    <span>Start Now</span>
                    {telegramAnimationData && (
                      <div className="w-6 h-6">
                        <Lottie animationData={telegramAnimationData} loop={true} autoplay={true} />
                      </div>
                    )}
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIAgentsCarousel;