import { useState, useEffect, useRef } from "react";
import { SignUpButton } from "@clerk/clerk-react";
import { ArrowRight, ExternalLink } from "lucide-react";
import { logger } from "@/utils/logger";
import { useCachedUserProfile } from "@/hooks/useCachedUserProfile";
import { detectAndStoreLocation } from "@/utils/locationDetection";
import ActivationStatusTag from "./ActivationStatusTag";
import { JobTrackerVideo } from "./JobTrackerVideo";
import jobTrackerPreview from "@/assets/job-tracker-preview-new.png";
import aiPhoneInterviewPreview from "@/assets/ai-phone-interview-preview-new.png";
import jobBoardPreview from "@/assets/job-board-preview-new.png";
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
  imageSrc?: string;
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
  activationStatus,
  imageSrc
}: FeatureSectionProps) => {
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

  // Mobile: header section (title + subheading only)
  const mobileHeaderSection = <div className="lg:hidden">
      <h3 className="text-2xl md:text-3xl mb-2 font-inter text-primary font-bold">
        {title}
      </h3>
      {subheading && <p className="text-base md:text-lg text-foreground/70 font-inter mb-4">{subheading}</p>}
    </div>;

  // Mobile: description only
  const mobileDescriptionSection = <div className="lg:hidden">
      <p className="leading-relaxed font-inter text-foreground text-base">
        {description}
      </p>
    </div>;

  // Mobile: button only
  const mobileButtonSection = <div className={`lg:hidden ${title.includes("Job Tracker") ? "mt-8 md:mt-10" : "mt-6"}`}>
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
        <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 font-inter text-primary whitespace-nowrap">
          {title}
        </h3>
        {subheading && <p className="text-lg md:text-xl text-foreground/70 font-inter mb-4">{subheading}</p>}
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
  const animationSection = lottieUrl ? <div className="flex items-center justify-center w-full">
      <div className="w-full max-w-full lg:max-w-3xl">
        {title.includes("Job Tracker") ? (
          <img 
            src={jobTrackerPreview} 
            alt="Job Tracker Preview showing application tracking and status management features"
            className="w-full h-auto max-w-xs sm:max-w-sm md:max-w-md lg:max-w-3xl mx-auto rounded-lg mb-4 md:mb-6"
            loading="lazy"
            decoding="async"
          />
        ) : title.includes("AI Phone Interview") ? (
          <img 
            src={aiPhoneInterviewPreview} 
            alt="AI Phone Interview feature demonstrating automated interview practice"
            className="w-full h-auto max-w-xs sm:max-w-sm md:max-w-md lg:max-w-3xl mx-auto rounded-lg mb-4 md:mb-6"
            loading="lazy"
            decoding="async"
          />
        ) : title.includes("Job Board") ? (
          <img 
            src={jobBoardPreview} 
            alt="Job Board displaying curated job listings with AI matching"
            className="w-full h-auto max-w-xs sm:max-w-sm md:max-w-md lg:max-w-3xl mx-auto rounded-lg mb-4 md:mb-6"
            loading="lazy"
            decoding="async"
          />
        ) : null}
      </div>
    </div> : null;
  return <section className="py-1 md:py-2 px-4 bg-background rounded-3xl">
      <div className="max-w-7xl mx-auto">
        {lottieUrl ? <div 
            className="rounded-3xl p-6 md:p-8 lg:p-10 bg-card max-w-7xl mx-auto"
          >
            {/* Mobile Layout */}
            <div className="lg:hidden space-y-6">
              {mobileHeaderSection}
              {animationSection}
              {mobileDescriptionSection}
              {mobileButtonSection}
            </div>
            
            {/* Desktop Layout */}
            <div className={`hidden lg:grid grid-cols-2 gap-16 items-center ${isReversed ? 'lg:grid-flow-col-dense' : ''}`}>
              {isReversed ? <>
                  {/* Reversed: Content on LEFT, Image on RIGHT */}
                  <div className="lg:col-start-1">{desktopContentSection}</div>
                  <div className="lg:col-start-2">{animationSection}</div>
                </> : <>
                  {/* Normal: Image on LEFT, Content on RIGHT */}
                  {animationSection}
                  {desktopContentSection}
                </>}
            </div>
          </div> : <div className="relative bg-gray-100 dark:bg-gray-900 rounded-3xl p-3 md:p-4 lg:p-6 max-w-md mx-auto flex flex-col border border-gray-300 dark:border-gray-700 transition-shadow duration-300 hover:shadow-lg">
            {label && <div className="absolute -left-3 -top-3 bg-[#30313d] text-white w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shadow-lg">
                {label}
              </div>}
            <div className="text-left space-y-2 md:space-y-3 flex-1 flex flex-col">
              <h3 className="text-lg md:text-xl lg:text-2xl font-bold font-opensans text-foreground leading-tight pl-4 sm:pl-2">
                {title}
              </h3>
              <p className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs md:text-sm font-opensans font-medium leading-tight w-fit">
                {subheading}
              </p>
              {activationStatus !== undefined && (
                <div className="pl-4 sm:pl-2">
                  <ActivationStatusTag isActivated={activationStatus} />
                </div>
              )}
              <div className="flex-1 flex flex-col items-center">
                <p className="text-sm md:text-base leading-relaxed font-opensans font-normal text-neutral-950 text-left">
                  {description}
                </p>
              </div>
              <div className="pt-3 md:pt-2 space-y-3">
                {isComingSoon ? <button type="button" disabled className="w-fit mx-auto bg-gray-700 text-white font-medium py-2.5 md:py-3 px-6 md:px-8 rounded-lg text-sm md:text-base cursor-not-allowed opacity-75">
                    Coming Soon
                  </button> : buttonUrl ? <button type="button" onClick={handleButtonWithUrlClick} className="w-fit mx-auto bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 md:py-3 px-6 md:px-8 rounded-lg text-sm md:text-base transition-all duration-200 flex items-center gap-2 justify-center">
                    <ExternalLink className="w-4 h-4" />
                    {buttonText}
                  </button> : <SignUpButton mode="modal">
                    <button type="button" className="w-fit mx-auto bg-gray-700 text-white dark:bg-white dark:text-black font-medium py-2.5 md:py-3 px-6 md:px-8 rounded-lg text-sm md:text-base transition-all duration-200">
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