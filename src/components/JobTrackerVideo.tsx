import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface JobTrackerAnimationProps {
  className?: string;
  showControls?: boolean;
}

export const JobTrackerVideo: React.FC<JobTrackerAnimationProps> = ({ 
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

  // Loading state
  if (isLoading) {
    return (
      <div className={`w-full h-40 lg:h-80 bg-gray-100 rounded-lg flex items-center justify-center animate-pulse ${className}`}>
        <div className="text-gray-500 text-sm">Loading animation...</div>
      </div>
    );
  }

  // Error state
  if (hasError) {
    return (
      <div className={`w-full h-40 lg:h-80 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 ${className}`}>
        <div className="text-center text-gray-500">
          <div className="text-2xl mb-2">🎬</div>
          <div className="text-sm">Animation unavailable</div>
        </div>
      </div>
    );
  }

  // Render Lottie animation
  if (LottieComponent && animationData) {
    return (
      <LottieComponent 
        animationData={animationData} 
        loop={true} 
        autoplay={true} 
        style={{
          width: '100%',
          height: 'auto'
        }} 
        className={className}
      />
    );
  }

  // Fallback loading state
  return (
    <div className={`w-full h-40 lg:h-80 bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
      <div className="text-gray-500 text-sm">Loading animation...</div>
    </div>
  );
};