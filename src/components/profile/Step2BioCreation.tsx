import { useState, useEffect } from 'react';
import { useFormTokenKeepAlive } from '@/hooks/useFormTokenKeepAlive';
import { useCachedUserCompletionStatus } from '@/hooks/useCachedUserCompletionStatus';
import ProfessionalBioSection from '@/components/dashboard/ProfessionalBioSection';
import { Button } from '@/components/ui/button';
import { CheckCircle, PenTool, Lightbulb, Target } from 'lucide-react';
interface Step2BioCreationProps {
  onComplete: () => void;
}
const BIO_EXAMPLES = ["Experienced software engineer with 5+ years in full-stack development, specializing in React and Node.js...", "Marketing professional with expertise in digital campaigns and brand strategy, proven track record of increasing ROI...", "Data scientist passionate about machine learning and analytics, experienced in Python, SQL, and cloud platforms..."];
export const Step2BioCreation = ({
  onComplete
}: Step2BioCreationProps) => {
  const {
    updateActivity
  } = useFormTokenKeepAlive(true);
  const {
    hasBio,
    hasResume
  } = useCachedUserCompletionStatus();
  const [showExamples, setShowExamples] = useState(false);

  // Auto-scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);
  return <div className="space-y-2 sm:space-y-4 max-w-2xl mx-auto">
      {/* Step Header */}
      <div className="flex items-center gap-3 px-2 mb-2">
        <div className="relative flex-shrink-0">
          <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl border border-blue-400/30 backdrop-blur-sm">
            <PenTool className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">2</span>
          </div>
        </div>
        <div className="flex-1">
          <h2 className="text-base sm:text-xl font-bold text-white mb-1">
            Write Your Professional Bio
          </h2>
          <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
            Tell us a bit about yourself - it helps our AI tailor tools to your unique profile. If you don't want to update it now, you can always do it later.
          </p>
        </div>
      </div>


      {/* Bio Section */}
      <div>
        <ProfessionalBioSection />
      </div>

    </div>;
};