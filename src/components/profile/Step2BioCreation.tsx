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

const BIO_EXAMPLES = [
  "Experienced software engineer with 5+ years in full-stack development, specializing in React and Node.js...",
  "Marketing professional with expertise in digital campaigns and brand strategy, proven track record of increasing ROI...",
  "Data scientist passionate about machine learning and analytics, experienced in Python, SQL, and cloud platforms..."
];

export const Step2BioCreation = ({ onComplete }: Step2BioCreationProps) => {
  const { updateActivity } = useFormTokenKeepAlive(true);
  const { hasBio, hasResume } = useCachedUserCompletionStatus();
  const [showExamples, setShowExamples] = useState(false);

  // Auto-scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6">
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
        <p className="text-gray-300 text-sm sm:text-base md:text-lg break-words">
          Tell employers about your experience, skills, and career goals
        </p>
      </div>

      {/* Success Message */}
      {hasBio && (
        <div className="bg-emerald-900/20 border border-emerald-400/30 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div>
            <p className="text-emerald-300 font-medium text-sm sm:text-base break-words">Bio completed successfully!</p>
            <p className="text-emerald-200 text-xs sm:text-sm break-words">You can continue to job alerts or refine your bio below.</p>
          </div>
        </div>
      )}

      {/* Bio Section */}
      <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-400/30">
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-purple-300 text-sm sm:text-base break-words">
            <Target className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            Professional Bio
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <ProfessionalBioSection />
        </CardContent>
      </Card>

      {/* Tips and Examples Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* Writing Tips */}
        <div className="bg-gradient-to-br from-purple-900/10 to-blue-900/10 rounded-xl p-4 sm:p-6 border border-purple-400/20">
          <h3 className="text-base sm:text-lg font-semibold text-purple-300 mb-3 sm:mb-4 flex items-center gap-2 break-words">
            <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            Writing Tips
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
              <p className="text-gray-300 text-xs sm:text-sm break-words">
                <strong>Start with your current role</strong> and years of experience
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
              <p className="text-gray-300 text-xs sm:text-sm break-words">
                <strong>Highlight key skills</strong> and technologies you work with
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
              <p className="text-gray-300 text-xs sm:text-sm break-words">
                <strong>Mention notable achievements</strong> or projects you're proud of
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
              <p className="text-gray-300 text-xs sm:text-sm break-words">
                <strong>End with career goals</strong> or what you're looking for
              </p>
            </div>
          </div>
        </div>

        {/* Bio Examples */}
        <div className="bg-gradient-to-br from-blue-900/10 to-indigo-900/10 rounded-xl p-4 sm:p-6 border border-blue-400/20">
          <h3 className="text-base sm:text-lg font-semibold text-blue-300 mb-3 sm:mb-4 break-words">
            Need inspiration?
          </h3>
          <Button 
            onClick={() => setShowExamples(!showExamples)}
            variant="outline"
            size="sm"
            className="mb-4 border-blue-400/30 text-blue-300 hover:bg-blue-900/20 min-h-[44px] break-words"
          >
            {showExamples ? 'Hide Examples' : 'View Example Bios'}
          </Button>
          
          {showExamples && (
            <div className="space-y-3">
              {BIO_EXAMPLES.map((example, index) => (
                <div key={index} className="p-2 sm:p-3 bg-blue-900/20 rounded-lg border border-blue-400/20">
                  <p className="text-gray-300 text-xs sm:text-sm italic break-words">{example}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-gradient-to-r from-purple-900/10 to-pink-900/10 rounded-xl p-4 sm:p-6 border border-purple-400/20">
        <h3 className="text-base sm:text-lg font-semibold text-purple-300 mb-3 sm:mb-4 break-words">How your bio helps</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
            <p className="text-gray-300 text-xs sm:text-sm break-words">
              <strong>Better job matching:</strong> Algorithms understand your experience level and interests
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
            <p className="text-gray-300 text-xs sm:text-sm break-words">
              <strong>Personalized cover letters:</strong> Generated letters reference your specific background
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
            <p className="text-gray-300 text-xs sm:text-sm break-words">
              <strong>Interview preparation:</strong> AI understands your strengths for better interview questions
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
            <p className="text-gray-300 text-xs sm:text-sm break-words">
              <strong>Professional branding:</strong> Consistent message across all job applications
            </p>
          </div>
        </div>
      </div>

      {/* Character Goal */}
      <div className="text-center p-3 sm:p-4 bg-purple-900/20 rounded-lg border border-purple-400/30">
        <p className="text-purple-300 text-xs sm:text-sm break-words">
          <strong>Tip:</strong> Aim for 150-300 characters for the best results. Quality over quantity!
        </p>
      </div>

      {/* Quick Action Buttons */}
      {hasBio && (
        <div className="text-center pt-4">
          <Button 
            onClick={onComplete}
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold px-6 sm:px-8 min-h-[44px] break-words"
          >
            Continue to Job Alerts →
          </Button>
        </div>
      )}
    </div>
  );
};