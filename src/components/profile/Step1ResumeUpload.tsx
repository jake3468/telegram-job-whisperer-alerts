import { useFormTokenKeepAlive } from '@/hooks/useFormTokenKeepAlive';
import { useCachedUserProfile } from '@/hooks/useCachedUserProfile';
import ResumeSection from '@/components/dashboard/ResumeSection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Upload, FileText } from 'lucide-react';
interface Step1ResumeUploadProps {
  onComplete: () => void;
}
export const Step1ResumeUpload = ({
  onComplete
}: Step1ResumeUploadProps) => {
  const {
    updateActivity
  } = useFormTokenKeepAlive(true);
  const {
    resumeExists
  } = useCachedUserProfile();
  return (
    <Card className="bg-gray-100 border border-gray-200 shadow-lg max-w-2xl mx-auto">
      <CardContent className="p-4 sm:p-6 space-y-4">
        {/* Step Header */}
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="relative flex-shrink-0">
              <div className="p-2 sm:p-3 bg-blue-600 rounded-xl border border-blue-700 shadow-lg">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-blue-800 rounded-full flex items-center justify-center shadow-md">
                <span className="text-white text-xs font-bold">1</span>
              </div>
            </div>
            <h2 className="text-base sm:text-xl font-bold text-black">
              Upload Your Resume
            </h2>
          </div>
          <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
            Upload your resume so our AI can personalize your experience (PDF format, max 5MB). It does not need to be perfect now, this can be made better later.
          </p>
        </div>

        {/* Success Message */}
        {resumeExists && (
          <div className="bg-green-100 border border-green-300 rounded-lg p-2 sm:p-3 flex items-center gap-2 mb-4">
            <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-green-200 rounded-full flex items-center justify-center">
              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-700" />
            </div>
            <div>
              <p className="text-green-800 font-semibold text-xs">Resume uploaded successfully!</p>
              <p className="text-green-700 text-xs">You can now continue to the next step.</p>
            </div>
          </div>
        )}

        {/* Resume Upload Section */}
        <div>
          <ResumeSection updateActivity={updateActivity} />
        </div>
      </CardContent>
    </Card>
  );
};