import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormTokenKeepAlive } from '@/hooks/useFormTokenKeepAlive';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';
interface Step3JobAlertsSetupProps {
  onComplete: () => void;
}
export const Step3JobAlertsSetup = ({
  onComplete
}: Step3JobAlertsSetupProps) => {
  const navigate = useNavigate();
  const {
    updateActivity
  } = useFormTokenKeepAlive(true);

  const handleHireAgents = useCallback(() => {
    updateActivity();
    navigate('/ai-agents');
  }, [navigate, updateActivity]);
  return (
    <Card className="bg-gray-800 border border-gray-600 shadow-lg max-w-2xl mx-auto">
      <CardContent className="p-4 sm:p-6 space-y-4">
        {/* Step Header */}
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="relative flex-shrink-0">
              <div className="p-2 sm:p-3 bg-blue-600 rounded-xl border border-blue-700 shadow-lg">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-blue-800 rounded-full flex items-center justify-center shadow-md">
                <span className="text-white text-xs font-bold">3</span>
              </div>
            </div>
            <h2 className="text-base sm:text-xl font-bold text-gray-100">
              Hire Your Job Hunt Agents
            </h2>
          </div>
          <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
            Now comes the crucial part. You're about to hire 3 personal AI agents who will work for you, day and night, to make your job hunt effortless.
          </p>
        </div>

        {/* Call to Action Content */}
        <div className="space-y-4">
          <div className="text-center space-y-3">
            <p className="text-gray-200 text-sm font-medium">
              Do you want to bring them on board?
            </p>
            <p className="text-gray-300 text-xs">
              Click the button below to Activate your AI Agents 👇
            </p>
          </div>

          <Button 
            onClick={handleHireAgents}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 text-sm font-medium rounded-lg transition-colors"
          >
            Yes, I Want Them!
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};