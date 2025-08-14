import { useFormTokenKeepAlive } from '@/hooks/useFormTokenKeepAlive';
import { useCachedUserCompletionStatus } from '@/hooks/useCachedUserCompletionStatus';
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
    hasResume
  } = useCachedUserCompletionStatus();
  return <div className="space-y-4 sm:space-y-6 max-w-2xl mx-auto">
      {/* Step Header */}
      <div className="text-center px-2">
        <div className="flex items-center justify-center mb-4">
          <div className="relative">
            <div className="p-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl border border-blue-400/30 backdrop-blur-sm">
              <FileText className="w-8 h-8 text-blue-400" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">1</span>
            </div>
          </div>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">
          Upload Your Resume
        </h2>
        <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
          Upload your resume so our AI can personalize your experience
        </p>
      </div>

      {/* Success Message */}
      {hasResume && <div className="bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-400/20 rounded-xl p-4 flex items-center gap-3 backdrop-blur-sm">
          <div className="flex-shrink-0 w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-emerald-300 font-semibold text-sm">Resume uploaded successfully!</p>
            <p className="text-emerald-200/80 text-xs">You can now continue to the next step.</p>
          </div>
        </div>}

      {/* Resume Upload Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-2xl blur-xl"></div>
        <Card className="relative bg-gray-900/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl shadow-2xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Upload className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Resume Upload</h3>
                <p className="text-gray-400 text-xs">PDF format, max 5MB</p>
              </div>
            </div>
            <ResumeSection updateActivity={updateActivity} />
          </CardContent>
        </Card>
      </div>
    </div>;
};