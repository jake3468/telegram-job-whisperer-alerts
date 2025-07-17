import { useState, useEffect } from "react";
import { SignUpButton } from "@clerk/clerk-react";
import { ArrowRight } from "lucide-react";
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
  useEffect(() => {
    import('lottie-react').then(module => {
      setLottieComponent(() => module.default);
    });
  }, []);
  const [animationData, setAnimationData] = useState(null);
  useEffect(() => {
    const fetchAnimation = async () => {
      try {
        const response = await fetch(lottieUrl);
        const data = await response.json();
        setAnimationData(data);
      } catch (error) {
        console.error('Failed to load Lottie animation:', error);
      }
    };
    fetchAnimation();
  }, [lottieUrl]);
  const contentSection = <div className="flex flex-col justify-center space-y-4">
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
      
      {isComingSoon ? <button type="button" disabled className="w-fit bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-8 rounded-full flex items-center gap-2 transition-all duration-200 cursor-not-allowed opacity-75">
          Coming Soon
        </button> : <SignUpButton mode="modal">
          <button type="button" className="w-fit bg-primary hover:bg-primary/90 text-white font-bold py-3 px-8 rounded-full flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl">
            {buttonText}
            <ArrowRight className="w-5 h-5" />
          </button>
        </SignUpButton>}
    </div>;
  const animationSection = <div className="flex items-center justify-center">
      <div className="w-full max-w-xs md:max-w-sm lg:max-w-md">
        {LottieComponent && animationData ? <LottieComponent animationData={animationData} loop={true} autoplay={true} style={{
        width: '100%',
        height: 'auto'
      }} /> : <div className="w-full h-80 bg-gray-800 rounded-lg flex items-center justify-center">
            <div className="text-gray-400">Loading animation...</div>
          </div>}
      </div>
    </div>;
  return <section className="py-4 md:py-8 px-4 bg-black">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4 md:p-6">
          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center ${isReversed ? 'lg:grid-flow-col-dense' : ''}`}>
          {isReversed ? <>
              <div className={isReversed ? 'lg:col-start-2' : ''}>{animationSection}</div>
              <div className={isReversed ? 'lg:col-start-1' : ''}>{contentSection}</div>
            </> : <>
              {contentSection}
              {animationSection}
            </>}
        </div>
        </div>
      </div>
    </section>;
};
export default FeatureSection;