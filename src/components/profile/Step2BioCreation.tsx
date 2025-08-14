import { useState, useEffect } from 'react';
import { useFormTokenKeepAlive } from '@/hooks/useFormTokenKeepAlive';
import { useCachedUserCompletionStatus } from '@/hooks/useCachedUserCompletionStatus';
import ProfessionalBioSection from '@/components/dashboard/ProfessionalBioSection';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  return <div className="space-y-4 sm:space-y-6">
      {/* Step Header */}
      <div className="text-center px-2">
        <div className="flex items-center justify-center mb-3 sm:mb-4">
          <div className="p-2 sm:p-3 bg-purple-500/20 rounded-full">
            <PenTool className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
          </div>
        </div>
        <h2 className="text-lg sm:text-xl md:text-2xl font-orbitron font-bold text-purple-400 mb-2 break-words">
          Write Your Professional Bio
        </h2>
        <p className="text-gray-300 text-sm sm:text-base md:text-lg break-words">Tell us a bit about yourself - it helps our AI tailor tools to your unique profile.</p>
      </div>

      {/* Success Message */}
      {hasBio && <div className="bg-emerald-900/20 border border-emerald-400/30 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div>
            <p className="text-emerald-300 font-medium text-sm sm:text-base break-words">Bio completed successfully!</p>
            <p className="text-emerald-200 text-xs sm:text-sm break-words">You can continue to job alerts or refine your bio below.</p>
          </div>
        </div>}

      {/* Bio Section */}
      <ProfessionalBioSection />

      {/* Character Goal */}
      <div className="text-center p-3 sm:p-4 bg-purple-900/20 rounded-lg border border-purple-400/30">
        <p className="text-purple-300 text-xs sm:text-sm break-words">
          <strong>Tip:</strong> Aim for 150-300 characters for the best results. Quality over quantity!
        </p>
      </div>

    </div>;
};