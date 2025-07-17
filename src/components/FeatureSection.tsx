
import { useState, useEffect } from "react";
import { SignUpButton } from "@clerk/clerk-react";
import { ArrowRight } from "lucide-react";
import { logger } from "@/utils/logger";

interface FeatureSectionProps {
  title: string;
  subheading: string;
  description: string;
  lottieUrl: string;
  buttonText: string;
  isReversed?: boolean;
  isComingSoon?: boolean;
}

const FeatureSection = ({
  title,
  subheading,
  description,
  lottieUrl,
  buttonText,
  isReversed = false,
  isComingSoon = false
}: FeatureSectionProps) => {
  const [LottieComponent, setLottieComponent] = useState<React.ComponentType<any> | null>(null);
  const [animationData, setAnimationData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    import('lottie-react').then(module => {
      setLottieComponent(() => module.default);
    }).catch(error => {
      logger.error('Failed to load Lottie React module:', error);
      setHasError(true);
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    const fetchAnimation = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        
        logger.debug(`Fetching animation from: ${lottieUrl}`);
        
        const response = await fetch(lottieUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch animation: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        setAnimationData(data);
        logger.debug(`Successfully loaded animation for: ${title}`);
      } catch (error) {
        logger.error(`Failed to load Lottie animation for ${title}:`, error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    if (lottieUrl) {
      fetchAnimation();
    }
  }, [lottieUrl, title]);

  // Mobile: header section (title + subheading only)
  const mobileHeaderSection = (
    <div className="lg:hidden">
      <h3 className="text-2xl md:text-3xl mb-2 font-inter text-indigo-700 font-bold">
        {title}
      </h3>
      <p className="mb-3 font-inter font-light text-neutral-950 text-sm">
        {subheading}
      </p>
    </div>
  );

  // Mobile: content section (description + button only)
  const mobileContentSection = (
    <div className="lg:hidden flex flex-col space-y-3">
      <p className="leading-relaxed font-inter text-neutral-950 text-xs">
        {description}
      </p>
      {isComingSoon ? (
        <button 
          type="button" 
          disabled 
          className="w-fit bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-full flex items-center gap-2 transition-all duration-200 cursor-not-allowed opacity-75"
        >
          Coming Soon
        </button>
      ) : (
        <SignUpButton mode="modal">
          <button 
            type="button" 
            className="w-fit bg-primary hover:bg-primary/90 text-white font-bold py-2 px-6 rounded-full flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {buttonText}
            <ArrowRight className="w-4 h-4" />
          </button>
        </SignUpButton>
      )}
    </div>
  );

  // Desktop: full content section
  const desktopContentSection = (
    <div className="hidden lg:flex flex-col justify-center space-y-4">
      <div>
        <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 font-inter text-blue-700">
          {title}
        </h3>
        <p className="md:text-xl mb-4 font-inter font-light text-base text-neutral-950">
          {subheading}
        </p>
        <p className="md:text-lg leading-relaxed font-inter text-sm text-neutral-950">
          {description}
        </p>
      </div>
      
      {isComingSoon ? (
        <button 
          type="button" 
          disabled 
          className="w-fit bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-8 rounded-full flex items-center gap-2 transition-all duration-200 cursor-not-allowed opacity-75"
        >
          Coming Soon
        </button>
      ) : (
        <SignUpButton mode="modal">
          <button 
            type="button" 
            className="w-fit bg-primary hover:bg-primary/90 text-white font-bold py-3 px-8 rounded-full flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {buttonText}
            <ArrowRight className="w-5 h-5" />
          </button>
        </SignUpButton>
      )}
    </div>
  );

  const animationSection = (
    <div className="flex items-center justify-center">
      <div className="w-full max-w-48 lg:max-w-md">
        {isLoading ? (
          <div className="w-full h-40 lg:h-80 bg-gray-100 rounded-lg flex items-center justify-center animate-pulse">
            <div className="text-gray-500 text-sm">Loading animation...</div>
          </div>
        ) : hasError ? (
          <div className="w-full h-40 lg:h-80 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
            <div className="text-center text-gray-500">
              <div className="text-2xl mb-2">🎬</div>
              <div className="text-sm">Animation unavailable</div>
            </div>
          </div>
        ) : LottieComponent && animationData ? (
          <LottieComponent 
            animationData={animationData} 
            loop={true} 
            autoplay={true} 
            style={{
              width: '100%',
              height: 'auto'
            }} 
          />
        ) : (
          <div className="w-full h-40 lg:h-80 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-gray-500 text-sm">Loading animation...</div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <section className="py-1 md:py-2 px-4 bg-black">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gray-50 dark:bg-gray-900 rounded-3xl p-2 md:p-4">
          {/* Mobile Layout */}
          <div className="lg:hidden space-y-2">
            {mobileHeaderSection}
            {animationSection}
            {mobileContentSection}
          </div>
          
          {/* Desktop Layout */}
          <div className={`hidden lg:grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center ${isReversed ? 'lg:grid-flow-col-dense' : ''}`}>
            {isReversed ? (
              <>
                <div className={isReversed ? 'lg:col-start-2' : ''}>{animationSection}</div>
                <div className={isReversed ? 'lg:col-start-1' : ''}>{desktopContentSection}</div>
              </>
            ) : (
              <>
                {desktopContentSection}
                {animationSection}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;
