import { useState, useEffect } from "react";
import { SignUpButton } from "@clerk/clerk-react";
import { ArrowRight, ExternalLink } from "lucide-react";
import { logger } from "@/utils/logger";
import { useCachedUserProfile } from "@/hooks/useCachedUserProfile";
import { detectAndStoreLocation } from "@/utils/locationDetection";
import ActivationStatusTag from "./ActivationStatusTag";
import { JobTrackerVideo } from "./JobTrackerVideo";
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
  const {
    userProfile,
    updateUserProfile
  } = useCachedUserProfile();
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
      <h3 className="text-2xl md:text-3xl mb-2 font-inter text-primary font-bold">
        {title}
      </h3>
    </div>;

  // Mobile: content section (description + button only)
  const mobileContentSection = <div className="lg:hidden flex flex-col space-y-6">
      <p className="leading-relaxed font-inter text-foreground text-base">
        {description}
      </p>
      {isComingSoon ? <button type="button" disabled className="w-fit bg-gray-700 hover:bg-gray-600 text-white font-medium py-1.5 px-4 rounded-full flex items-center gap-2 transition-all duration-200 cursor-not-allowed opacity-75 text-sm">
          Coming Soon
        </button> : buttonUrl ? <button type="button" onClick={handleButtonWithUrlClick} className="w-fit bg-blue-600 hover:bg-blue-700 text-white font-medium py-1.5 px-4 rounded-full flex items-center gap-2 flex-row transition-all duration-200 shadow-lg hover:shadow-xl text-sm">
          <ExternalLink className="w-3 h-3" />
          {buttonText}
          <ArrowRight className="w-3 h-3" />
        </button> : <SignUpButton mode="modal">
          <button type="button" className="w-fit bg-gray-700 text-white dark:bg-white dark:text-black font-medium py-1.5 px-4 rounded-full flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl text-sm">
            {buttonText}
            <ArrowRight className="w-3 h-3" />
          </button>
        </SignUpButton>}
    </div>;

  // Desktop: full content section
  const desktopContentSection = <div className="hidden lg:flex flex-col justify-center space-y-8">
      <div>
        <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 font-inter text-primary">
          {title}
        </h3>
        <p className="text-lg leading-relaxed font-inter text-foreground">
          {description}
        </p>
      </div>
      
      {isComingSoon ? <button type="button" disabled className="w-fit bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-8 rounded-full flex items-center gap-2 transition-all duration-200 cursor-not-allowed opacity-75">
          Coming Soon
        </button> : buttonUrl ? <button type="button" onClick={handleButtonWithUrlClick} className="w-fit bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full flex items-center gap-2 flex-row transition-all duration-200 shadow-lg hover:shadow-xl">
          <ExternalLink className="w-5 h-5" />
          {buttonText}
          <ArrowRight className="w-5 h-5" />
         </button> : <SignUpButton mode="modal">
           <button type="button" className="w-fit bg-gray-700 text-white dark:bg-white dark:text-black font-bold py-3 px-8 rounded-full flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl">
             {buttonText}
             <ArrowRight className="w-5 h-5" />
           </button>
         </SignUpButton>}
    </div>;
  const animationSection = lottieUrl ? <div className="flex items-center justify-center">
      <div className="w-full max-w-48 lg:max-w-md">
        {title === "Job Tracker" ? (
          <JobTrackerVideo 
            className="w-full"
            showControls={true}
          />
        ) : isLoading ? <div className="w-full h-40 lg:h-80 bg-gray-100 rounded-lg flex items-center justify-center animate-pulse">
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
  return <section className="py-1 md:py-2 px-4 bg-background rounded-3xl">
      <div className="max-w-7xl mx-auto">
        {lottieUrl ? <div className="rounded-3xl p-6 md:p-8 lg:p-10 bg-card border border-black dark:border-white">
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
          </div> : <div className="relative bg-gray-50 dark:bg-gray-900 rounded-3xl p-3 md:p-4 lg:p-6 max-w-md mx-auto flex flex-col">
            {label && <div className="absolute -left-3 -top-3 bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shadow-lg">
                {label}
              </div>}
            {activationStatus !== undefined && <ActivationStatusTag isActivated={activationStatus} />}
            <div className="text-left space-y-2 md:space-y-3 flex-1 flex flex-col">
              <h3 className="text-base md:text-lg lg:text-xl font-bold font-opensans text-blue-700 leading-tight pl-4 sm:pl-2">
                {title}
              </h3>
              <p className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs md:text-sm font-opensans font-medium leading-tight w-fit">
                {subheading}
              </p>
              <div className="flex-1 flex flex-col items-center">
                <p className="text-xs leading-relaxed font-opensans font-normal text-neutral-950 text-left">
                  {description}
                </p>
                {title === "👔 Job Application Agent" && <>
                    <div className="mt-3 inline-block border border-gray-800 bg-gray-100 px-2 py-1 rounded-lg">
                      <p className="text-xs font-medium text-neutral-700">
                        Example chat below 👇
                      </p>
                    </div>
                    <img src="/lovable-uploads/438fbede-9968-4fe7-9622-807454b576af.png" alt="Job Application Agent conversation interface" className="mt-2 w-full max-w-xs rounded-lg shadow-md" />
                  </>}
                {title === "📝 Resume Builder Agent" && <>
                    <div className="mt-3 inline-block border border-gray-800 bg-gray-100 px-2 py-1 rounded-lg">
                      <p className="text-xs font-medium text-neutral-700">
                        Example chat below 👇
                      </p>
                    </div>
                    <img src="/lovable-uploads/80af4c55-96c8-4c4e-9cb9-f4f6c8530524.png" alt="Resume Builder Agent conversation interface" className="mt-2 w-full max-w-xs rounded-lg shadow-md" />
                  </>}
                {title === "🔔 Job Alerts Agent" && <>
                    <div className="mt-3 inline-block border border-gray-800 bg-gray-100 px-2 py-1 rounded-lg">
                      <p className="text-xs font-medium text-neutral-700">
                        Example chat below 👇
                      </p>
                    </div>
                    <img src="/lovable-uploads/e5a7f299-f690-47de-a1b5-f44cfc229925.png" alt="Job Alerts Agent conversation interface" className="mt-2 w-full max-w-xs rounded-lg shadow-md" />
                  </>}
              </div>
              <div className="pt-3 md:pt-2 space-y-3">
                {isComingSoon ? <button type="button" disabled className="w-full bg-gray-700 text-white font-medium py-1.5 md:py-2 px-3 md:px-4 rounded-lg text-xs md:text-sm cursor-not-allowed opacity-75">
                    Coming Soon
                  </button> : buttonUrl ? <button type="button" onClick={handleButtonWithUrlClick} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-1.5 md:py-2 px-3 md:px-4 rounded-lg text-xs md:text-sm transition-all duration-200 flex items-center gap-2 justify-center">
                    <ExternalLink className="w-3 h-3" />
                    {buttonText}
                  </button> : <SignUpButton mode="modal">
                    <button type="button" className="w-full bg-gray-700 text-white dark:bg-white dark:text-black font-medium py-1.5 md:py-2 px-3 md:px-4 rounded-lg text-xs md:text-sm transition-all duration-200">
                      {buttonText}
                    </button>
                  </SignUpButton>}
                {additionalContent && <div className="border-t border-gray-200 pt-3">
                    {additionalContent}
                  </div>}
              </div>
            </div>
          </div>}
      </div>
    </section>;
};
export default FeatureSection;