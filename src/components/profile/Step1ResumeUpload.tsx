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
  return <div className="h-full flex flex-col">
      {/* Step Header */}
      <div className="flex items-center gap-3 px-2 mb-1">
        <div className="relative flex-shrink-0">
          <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg sm:rounded-xl border border-blue-400/30 backdrop-blur-sm">
            <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">1</span>
          </div>
        </div>
        <div className="flex-1">
          <h2 className="text-base sm:text-xl font-bold text-white mb-1">
            Upload Your Resume
          </h2>
          <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
            Upload your resume so our AI can personalize your experience (PDF format, max 5MB)
          </p>
        </div>
      </div>

      {/* Success Message */}
      {resumeExists && <div className="bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-400/20 rounded-lg p-2 flex items-center gap-2 backdrop-blur-sm mb-1">
          <div className="flex-shrink-0 w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center">
            <CheckCircle className="w-3 h-3 text-emerald-400" />
          </div>
          <div>
            <p className="text-emerald-300 font-semibold text-xs">Resume uploaded successfully!</p>
            <p className="text-emerald-200/80 text-xs">You can now continue to the next step.</p>
          </div>
        </div>}

      {/* Resume Upload Section */}
      <div className="flex-1">
        <ResumeSection updateActivity={updateActivity} />
      </div>
    </div>;
};