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
  isComingSoon = false,
}: FeatureSectionProps) => {
  const [LottieComponent, setLottieComponent] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    import('lottie-react').then((module) => {
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

  const contentSection = (
    <div className="flex flex-col justify-center space-y-6">
      <div>
        <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 font-inter">
          {title}
        </h3>
        <p className="text-xl md:text-2xl text-gray-300 mb-6 font-inter font-light">
          {subheading}
        </p>
        <p className="text-base md:text-lg text-gray-400 leading-relaxed font-inter">
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
      <div className="w-full max-w-md lg:max-w-lg">
        {LottieComponent && animationData ? (
          <LottieComponent
            animationData={animationData}
            loop={true}
            autoplay={true}
            style={{ width: '100%', height: 'auto' }}
          />
        ) : (
          <div className="w-full h-80 bg-gray-800 rounded-lg flex items-center justify-center">
            <div className="text-gray-400">Loading animation...</div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <section className="py-16 md:py-24 px-4 bg-black">
      <div className="max-w-7xl mx-auto">
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center ${isReversed ? 'lg:grid-flow-col-dense' : ''}`}>
          {isReversed ? (
            <>
              <div className={isReversed ? 'lg:col-start-2' : ''}>{animationSection}</div>
              <div className={isReversed ? 'lg:col-start-1' : ''}>{contentSection}</div>
            </>
          ) : (
            <>
              {contentSection}
              {animationSection}
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;