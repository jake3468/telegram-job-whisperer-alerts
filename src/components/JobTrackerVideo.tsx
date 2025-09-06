import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface JobTrackerVideoProps {
  className?: string;
  showControls?: boolean;
}

export const JobTrackerVideo: React.FC<JobTrackerVideoProps> = ({ 
  className = ''
}) => {
  const [LottieComponent, setLottieComponent] = useState<React.ComponentType<any> | null>(null);
  const [animationData, setAnimationData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Load Lottie React module
  useEffect(() => {
    import('lottie-react').then(module => {
      setLottieComponent(() => module.default);
    }).catch(error => {
      logger.error('Failed to load Lottie React module:', error);
      setHasError(true);
      setIsLoading(false);
    });
  }, []);

  // Load animation data from Supabase Storage
  useEffect(() => {
    const fetchAnimation = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        
        const animationUrl = supabase.storage
          .from('animations')
          .getPublicUrl('business workshop.json');

        const response = await fetch(animationUrl.data.publicUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch animation: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        setAnimationData(data);
      } catch (error) {
        logger.error('Failed to load business workshop animation:', error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnimation();
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div className="relative h-[160px] md:h-[200px] lg:h-[240px] rounded-3xl overflow-hidden shadow-2xl border border-gray-800/50">
        {isLoading ? (
          <div className="w-full h-full bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-3">🏢</div>
              <div className="text-gray-400 text-sm">Loading workshop animation...</div>
            </div>
          </div>
        ) : hasError ? (
          <div className="w-full h-full bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-3">🏢</div>
              <div className="text-gray-300 text-sm mb-1">Business Workshop Coming Soon!</div>
              <div className="text-gray-500 text-xs">Interactive workshop animation will appear here</div>
            </div>
          </div>
        ) : LottieComponent && animationData ? (
          <LottieComponent 
            animationData={animationData} 
            loop={true} 
            autoplay={true} 
            style={{
              width: '100%',
              height: '100%'
            }} 
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-3">🏢</div>
              <div className="text-gray-400 text-sm">Loading workshop...</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};