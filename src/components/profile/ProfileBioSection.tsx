import { useFormTokenKeepAlive } from '@/hooks/useFormTokenKeepAlive';
import { useCachedUserCompletionStatus } from '@/hooks/useCachedUserCompletionStatus';
import ProfessionalBioSection from '@/components/dashboard/ProfessionalBioSection';
import { Card, CardContent } from '@/components/ui/card';
import { PenTool } from 'lucide-react';

export const ProfileBioSection = () => {
  const {
    updateActivity
  } = useFormTokenKeepAlive(true);
  const {
    hasBio
  } = useCachedUserCompletionStatus();

  return (
    <Card className="bg-gray-800 shadow-lg border border-gray-600 max-w-2xl mx-auto">
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <div className="p-2 sm:p-3 bg-blue-600 rounded-xl border border-blue-700 shadow-lg">
                <PenTool className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-blue-800 rounded-full flex items-center justify-center shadow-md">
                <span className="text-white text-xs font-bold">2</span>
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-base sm:text-xl font-bold text-gray-100 mb-1">
                Manage Your Professional Bio
              </h2>
              <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
                Tell us a bit about yourself - it helps our AI tailor tools to your unique profile
              </p>
            </div>
          </div>

          {/* Info Message */}
          {hasBio && (
            <div className="px-2">
              <p className="text-gray-400 text-xs sm:text-sm">
                You can edit and update your bio as needed.
              </p>
            </div>
          )}

          {/* Bio Section */}
          <div>
            <ProfessionalBioSection />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};