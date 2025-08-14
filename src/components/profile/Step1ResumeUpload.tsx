import { useState } from 'react';
import { useFormTokenKeepAlive } from '@/hooks/useFormTokenKeepAlive';
import { useCachedUserCompletionStatus } from '@/hooks/useCachedUserCompletionStatus';
import ResumeSection from '@/components/dashboard/ResumeSection';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Upload, FileText } from 'lucide-react';
import { ResumeHelpPopup } from '@/components/ResumeHelpPopup';

interface Step1ResumeUploadProps {
  onComplete: () => void;
}

export const Step1ResumeUpload = ({ onComplete }: Step1ResumeUploadProps) => {
  const { updateActivity } = useFormTokenKeepAlive(true);
  const { hasResume } = useCachedUserCompletionStatus();
  const [showResumeHelp, setShowResumeHelp] = useState(false);

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-blue-500/20 rounded-full">
            <FileText className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        <h2 className="text-2xl font-orbitron font-bold text-blue-400 mb-2">
          Upload Your Resume
        </h2>
        <p className="text-gray-300 text-lg">
          Help us understand your background to provide better job matches
        </p>
      </div>

      {/* Success Message */}
      {hasResume && (
        <div className="bg-emerald-900/20 border border-emerald-400/30 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <div>
            <p className="text-emerald-300 font-medium">Resume uploaded successfully!</p>
            <p className="text-emerald-200 text-sm">You can continue to the next step or update your resume below.</p>
          </div>
        </div>
      )}

      {/* Resume Upload Section */}
      <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-400/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-300">
            <Upload className="w-5 h-5" />
            Resume Upload
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResumeSection updateActivity={updateActivity} />
        </CardContent>
      </Card>

      {/* Help Section */}
      <div className="text-center">
        <Button 
          onClick={() => {
            updateActivity();
            setShowResumeHelp(true);
          }} 
          variant="outline" 
          size="sm" 
          className="border-blue-200 hover:border-blue-300 text-white bg-black/20"
        >
          Need help fixing your resume?
        </Button>
      </div>

      {/* Benefits Section */}
      <div className="bg-gradient-to-r from-blue-900/10 to-purple-900/10 rounded-xl p-6 border border-blue-400/20">
        <h3 className="text-lg font-semibold text-blue-300 mb-4">Why upload your resume?</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
            <p className="text-gray-300 text-sm">
              <strong>Personalized job matching:</strong> We analyze your skills and experience to find the most relevant opportunities
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
            <p className="text-gray-300 text-sm">
              <strong>Instant cover letters:</strong> Generate tailored cover letters for each job application
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
            <p className="text-gray-300 text-sm">
              <strong>Smart job alerts:</strong> Receive notifications only for jobs that match your qualifications
            </p>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      {hasResume && (
        <div className="text-center pt-4">
          <Button 
            onClick={onComplete}
            className="bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white font-semibold px-8"
          >
            Continue to Bio →
          </Button>
        </div>
      )}

      {/* Resume Help Popup */}
      {showResumeHelp && (
        <ResumeHelpPopup isOpen={showResumeHelp} onClose={() => setShowResumeHelp(false)} />
      )}
    </div>
  );
};