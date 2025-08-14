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
  return <div className="w-full max-w-full px-3 py-1 sm:px-4 sm:py-2 sm:max-w-2xl md:max-w-4xl mx-auto flex flex-col">
      {/* Step Header */}
      <div className="text-center mb-1 sm:mb-2">
        <div className="flex items-center justify-center mb-2 sm:mb-6">
          <div className="relative">
            <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl sm:rounded-2xl border border-blue-400/30 backdrop-blur-sm">
              <PenTool className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">2</span>
            </div>
          </div>
        </div>
        <h2 className="text-lg sm:text-2xl font-bold text-white mb-2 sm:mb-4">
          Write Your Professional Bio
        </h2>
        <p className="text-gray-400 text-xs sm:text-base leading-relaxed">
          Tell us a bit about yourself - it helps our AI tailor tools to your unique profile
        </p>
      </div>

      {/* Success Message */}
      {hasBio && <div className="bg-emerald-900/20 border border-emerald-400/30 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-1 sm:mb-3">
          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 flex-shrink-0" />
          <div>
            <p className="text-emerald-300 font-medium text-xs sm:text-base break-words">Bio completed successfully!</p>
            <p className="text-emerald-200 text-xs sm:text-sm break-words">You can continue to job alerts or refine your bio below.</p>
          </div>
        </div>}

      {/* Bio Section */}
      <div className="relative flex-1 min-h-0 mb-4">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-xl sm:rounded-2xl blur-xl"></div>
        <Card className="relative bg-gray-900/40 backdrop-blur-sm border border-gray-700/50 rounded-xl sm:rounded-2xl shadow-2xl h-full flex flex-col">
          <CardContent className="p-4 sm:p-6 flex-1 flex flex-col min-h-0">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="p-1.5 sm:p-2 bg-blue-500/20 rounded-lg">
                <PenTool className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm sm:text-base">Professional Bio</h3>
                <p className="text-gray-400 text-xs">Write your professional summary</p>
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <ProfessionalBioSection />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Character Goal */}
      <div className="text-center p-2 sm:p-4 bg-purple-900/20 rounded-lg border border-purple-400/30 flex-shrink-0">
        <p className="text-purple-300 text-xs sm:text-sm break-words">
          <strong>Tip:</strong> Aim for 150-300 characters for the best results. Quality over quantity!
        </p>
      </div>

    </div>;
};