import { useState, useEffect } from "react";
import { SignUpButton } from "@clerk/clerk-react";
import { ArrowRight, ExternalLink } from "lucide-react";
import { logger } from "@/utils/logger";
import { useCachedUserProfile } from "@/hooks/useCachedUserProfile";
import { detectAndStoreLocation } from "@/utils/locationDetection";
import ActivationStatusTag from "./ActivationStatusTag";
interface FeatureSectionProps {
  title: string;
  subheading: string;
  description: string;
  lottieUrl: string;
  buttonText: string;
  isReversed?: boolean;
  isComingSoon?: boolean;
  label?: string;
  buttonUrl?: string;
  additionalContent?: React.ReactNode;
  shouldDetectLocation?: boolean;
  activationStatus?: boolean | null;
}
const FeatureSection = ({
  title,
  subheading,
  description,
  lottieUrl,
  buttonText,
  isReversed = false,
  isComingSoon = false,
  label,
  buttonUrl,
  additionalContent,
  shouldDetectLocation = false,
  activationStatus
}: FeatureSectionProps) => {
  const [LottieComponent, setLottieComponent] = useState<React.ComponentType<any> | null>(null);
  const [animationData, setAnimationData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  const { userProfile, updateUserProfile } = useCachedUserProfile();

  const handleButtonWithUrlClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!buttonUrl) return;
    
    // Only detect location if shouldDetectLocation is true
    if (shouldDetectLocation) {
      try {
        await detectAndStoreLocation(userProfile, updateUserProfile);
      } catch (error) {
        logger.error('Location detection failed:', error);
      }
    }
    
    // Open the URL immediately (no waiting for location detection)
    window.open(buttonUrl, '_blank', 'noopener,noreferrer');
  };
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
        const response = await fetch(lottieUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch animation: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        setAnimationData(data);
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
  const mobileHeaderSection = <div className="lg:hidden">
      <h3 className="text-2xl md:text-3xl mb-2 font-opensans text-indigo-700 font-bold">
        {title}
      </h3>
      <p className="mb-3 font-opensans font-medium text-neutral-950 text-sm">
        {subheading}
      </p>
    </div>;

  // Mobile: content section (description + button only)
  const mobileContentSection = <div className="lg:hidden flex flex-col space-y-6">
      <p className="leading-relaxed font-opensans text-neutral-950 text-xs font-normal">
        {description}
      </p>
      {isComingSoon ? <button type="button" disabled className="w-fit bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-full flex items-center gap-2 transition-all duration-200 cursor-not-allowed opacity-75">
          Coming Soon
        </button> : buttonUrl ? <button 
          type="button" 
          onClick={handleButtonWithUrlClick}
          className="w-fit bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full flex items-center gap-2 flex-row transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <ExternalLink className="w-4 h-4" />
          {buttonText}
          <ArrowRight className="w-4 h-4" />
        </button> : <SignUpButton mode="modal">
          <button type="button" className="w-fit bg-primary hover:bg-primary/90 text-white font-bold py-2 px-6 rounded-full flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl">
            {buttonText}
            <ArrowRight className="w-4 h-4" />
          </button>
        </SignUpButton>}
    </div>;

  // Desktop: full content section
  const desktopContentSection = <div className="hidden lg:flex flex-col justify-center space-y-8">
      <div>
        <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 font-opensans text-blue-700">
          {title}
        </h3>
        <p className="md:text-xl mb-4 font-opensans font-medium text-base text-neutral-950">
          {subheading}
        </p>
        <p className="md:text-lg leading-relaxed font-opensans font-light text-sm text-neutral-950">
          {description}
        </p>
      </div>
      
      {isComingSoon ? <button type="button" disabled className="w-fit bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-8 rounded-full flex items-center gap-2 transition-all duration-200 cursor-not-allowed opacity-75">
          Coming Soon
        </button> : buttonUrl ? <button 
          type="button" 
          onClick={handleButtonWithUrlClick}
          className="w-fit bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full flex items-center gap-2 flex-row transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <ExternalLink className="w-5 h-5" />
          {buttonText}
          <ArrowRight className="w-5 h-5" />
        </button> : <SignUpButton mode="modal">
          <button type="button" className="w-fit bg-primary hover:bg-primary/90 text-white font-bold py-3 px-8 rounded-full flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl">
            {buttonText}
            <ArrowRight className="w-5 h-5" />
          </button>
        </SignUpButton>}
    </div>;
  const animationSection = lottieUrl ? <div className="flex items-center justify-center">
      <div className="w-full max-w-48 lg:max-w-md">
        {isLoading ? <div className="w-full h-40 lg:h-80 bg-gray-100 rounded-lg flex items-center justify-center animate-pulse">
            <div className="text-gray-500 text-sm">Loading animation...</div>
          </div> : hasError ? <div className="w-full h-40 lg:h-80 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
            <div className="text-center text-gray-500">
              <div className="text-2xl mb-2">🎬</div>
              <div className="text-sm">Animation unavailable</div>
            </div>
          </div> : LottieComponent && animationData ? <LottieComponent animationData={animationData} loop={true} autoplay={true} style={{
        width: '100%',
        height: 'auto'
      }} /> : <div className="w-full h-40 lg:h-80 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-gray-500 text-sm">Loading animation...</div>
          </div>}
      </div>
    </div> : null;
  return <section className="py-1 md:py-2 px-4 bg-black">
      <div className="max-w-7xl mx-auto">
        {lottieUrl ? (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-3xl p-6 md:p-8 lg:p-10">
            {/* Mobile Layout */}
            <div className="lg:hidden space-y-6">
              {mobileHeaderSection}
              {animationSection}
              {mobileContentSection}
            </div>
            
            {/* Desktop Layout */}
            <div className={`hidden lg:grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center ${isReversed ? 'lg:grid-flow-col-dense' : ''}`}>
              {isReversed ? <>
                  <div className={isReversed ? 'lg:col-start-2' : ''}>{animationSection}</div>
                  <div className={isReversed ? 'lg:col-start-1' : ''}>{desktopContentSection}</div>
                </> : <>
                  {desktopContentSection}
                  {animationSection}
                </>}
            </div>
          </div>
        ) : (
          <div className="relative bg-gray-50 dark:bg-gray-900 rounded-2xl p-3 md:p-4 lg:p-6 max-w-md mx-auto flex flex-col">
            {label && (
              <div className="absolute -left-3 -top-3 bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shadow-lg">
                {label}
              </div>
            )}
            {activationStatus !== undefined && (
              <ActivationStatusTag isActivated={activationStatus} />
            )}
            <div className="text-center space-y-2 md:space-y-3 flex-1 flex flex-col">
              <h3 className="text-base md:text-lg lg:text-xl font-bold font-opensans text-blue-700 leading-tight">
                {title}
              </h3>
              <p className="text-xs md:text-sm font-opensans font-medium text-neutral-950 leading-tight">
                {subheading}
              </p>
              <div className="flex-1 flex items-center">
                <p className="text-xs leading-relaxed font-opensans font-normal text-neutral-950">
                  {description}
                </p>
              </div>
              <div className="pt-3 md:pt-2 space-y-3">
                {isComingSoon ? 
                  <button type="button" disabled className="w-full bg-gray-700 text-white font-medium py-1.5 md:py-2 px-3 md:px-4 rounded-lg text-xs md:text-sm cursor-not-allowed opacity-75">
                    Coming Soon
                  </button> : buttonUrl ?
                  <button 
                    type="button" 
                    onClick={handleButtonWithUrlClick}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-1.5 md:py-2 px-3 md:px-4 rounded-lg text-xs md:text-sm transition-all duration-200 flex items-center gap-2 justify-center"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {buttonText}
                  </button> :
                  <SignUpButton mode="modal">
                    <button type="button" className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-1.5 md:py-2 px-3 md:px-4 rounded-lg text-xs md:text-sm transition-all duration-200">
                      {buttonText}
                    </button>
                  </SignUpButton>
                }
                {additionalContent && (
                  <div className="border-t border-gray-200 pt-3">
                    {additionalContent}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>;
};
export default FeatureSection;