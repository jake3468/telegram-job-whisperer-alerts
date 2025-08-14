import { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useCachedUserCompletionStatus } from '@/hooks/useCachedUserCompletionStatus';
import { useCachedUserProfile } from '@/hooks/useCachedUserProfile';
import { Step1ResumeUpload } from './Step1ResumeUpload';
import { Step2BioCreation } from './Step2BioCreation';
import { Step3JobAlertsSetup } from './Step3JobAlertsSetup';
import { ProfileWizardComplete } from './ProfileWizardComplete';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const TOTAL_STEPS = 3;

export const ProfileWizard = () => {
  const { user } = useUser();
  const { hasResume, hasBio } = useCachedUserCompletionStatus();
  const { userProfile, refetch } = useCachedUserProfile();
  const [currentStep, setCurrentStep] = useState(1);
  const [isCompleting, setIsCompleting] = useState(false);

  const nextStep = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    } else {
      completeSetup();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeSetup = async () => {
    if (!userProfile?.id) return;
    
    setIsCompleting(true);
    try {
      const { error } = await supabase
        .from('user_profile')
        .update({ profile_setup_completed: true })
        .eq('id', userProfile.id);

      if (error) throw error;

      toast.success('Profile setup completed! 🎉');
      await refetch();
    } catch (error) {
      console.error('Error completing setup:', error);
      toast.error('Failed to complete setup');
    } finally {
      setIsCompleting(false);
    }
  };

  const getStepStatus = (stepNum: number) => {
    if (stepNum < currentStep) return 'complete';
    if (stepNum === currentStep) return 'current';
    return 'pending';
  };

  const canProceedToNext = () => {
    if (currentStep === 1) return hasResume;
    if (currentStep === 2) return hasBio;
    if (currentStep === 3) return true; // Can always proceed from job alerts
    return false;
  };

  const getProgressPercentage = () => {
    return Math.round((currentStep / TOTAL_STEPS) * 100);
  };

  // Show completion screen if profile setup is completed
  if (userProfile?.profile_setup_completed) {
    return <ProfileWizardComplete />;
  }

  return (
    <div className="w-full max-w-full px-3 py-1 sm:px-4 sm:py-2 sm:max-w-2xl md:max-w-4xl mx-auto flex flex-col">
      {/* Welcome Header */}
      <div className="text-center mb-1 sm:mb-2">
        <h1 className="font-extrabold text-lg sm:text-2xl md:text-4xl font-orbitron drop-shadow mb-1 break-words">
          <span className="mr-1 sm:mr-2">🎉</span>
          <span className="bg-gradient-to-r from-sky-400 via-fuchsia-400 to-pastel-lavender bg-clip-text text-transparent">
            Welcome, 
          </span>
          <span className="italic bg-gradient-to-r from-pastel-peach to-pastel-mint bg-clip-text text-transparent">
            {user?.firstName || 'User'}
          </span>
        </h1>
        <p className="text-gray-300 text-sm sm:text-lg mt-1 px-2">Let's set up your profile in just 3 steps</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-1 sm:mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs sm:text-sm text-gray-400">Progress</span>
          <span className="text-xs sm:text-sm text-gray-400">{getProgressPercentage()}% complete</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-1.5 sm:h-2">
          <div 
            className="h-1.5 sm:h-2 rounded-full bg-gradient-to-r from-red-500 via-orange-400 to-green-500 transition-all duration-500"
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
      </div>

      {/* Step Navigation */}
      <div className="flex flex-row justify-center items-center space-x-1 sm:space-x-2 mb-2 sm:mb-3">
        {[1, 2, 3].map((stepNum) => {
          const status = getStepStatus(stepNum);
          const isActive = stepNum === currentStep;
          
          return (
            <div key={stepNum} className="flex items-center">
              <div className="flex flex-col items-center">
                <button
                  onClick={() => setCurrentStep(stepNum)}
                  className={`flex flex-col items-center transition-all duration-200 min-h-[28px] sm:min-h-[36px] px-1 py-1 ${
                    status === 'pending' && stepNum !== currentStep ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'
                  }`}
                  disabled={status === 'pending' && stepNum !== currentStep}
                >
                  <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-base mb-1 transition-all duration-200 ${
                    status === 'complete' 
                      ? 'bg-emerald-500 text-black' 
                      : isActive 
                        ? 'bg-blue-500 text-white ring-2 ring-blue-300' 
                        : 'bg-gray-600 text-gray-300'
                  }`}>
                    {status === 'complete' ? '✓' : stepNum}
                  </div>
                  <span className={`text-xs sm:text-sm font-medium text-center break-words ${
                    isActive ? 'text-blue-400' : status === 'complete' ? 'text-emerald-400' : 'text-gray-400'
                  }`}>
                    {stepNum === 1 ? 'Resume' : stepNum === 2 ? 'Bio' : 'Job Alerts'}
                  </span>
                </button>
              </div>
              
              {stepNum < 3 && (
                <ArrowRight className={`w-3 h-3 sm:w-4 sm:h-4 mx-1 sm:mx-2 transition-all duration-200 ${
                  getStepStatus(stepNum) === 'complete' 
                    ? 'text-emerald-400' 
                    : isActive 
                      ? 'text-blue-400' 
                      : 'text-gray-600'
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="overflow-auto mb-4">
        {currentStep === 1 && <Step1ResumeUpload onComplete={nextStep} />}
        {currentStep === 2 && <Step2BioCreation onComplete={nextStep} />}
        {currentStep === 3 && <Step3JobAlertsSetup onComplete={nextStep} />}
      </div>

      {/* Navigation Buttons - Moved closer to content */}
      <div className="flex justify-between items-center gap-3 flex-shrink-0 pt-2 pb-2">
        <Button
          onClick={prevStep}
          variant="outline"
          disabled={currentStep === 1}
          className="flex items-center gap-2"
          size="sm"
        >
          <ChevronLeft className="w-4 h-4" />
          Go back
        </Button>

        <Button
          onClick={() => nextStep()}
          variant="ghost"
          className="text-gray-400 hover:text-gray-800"
          size="sm"
        >
          Skip for now
        </Button>
        
        <Button
          onClick={nextStep}
          disabled={currentStep < TOTAL_STEPS && !canProceedToNext() || isCompleting}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          size="sm"
        >
          {isCompleting ? 'Completing...' : currentStep === TOTAL_STEPS ? 'Complete Setup' : 'Next'}
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};