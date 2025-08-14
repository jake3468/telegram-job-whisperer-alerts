import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useCachedUserCompletionStatus } from '@/hooks/useCachedUserCompletionStatus';
import { Step1ResumeUpload } from './Step1ResumeUpload';
import { Step2BioCreation } from './Step2BioCreation';
import { Step3JobAlertsSetup } from './Step3JobAlertsSetup';
import { ProfileWizardComplete } from './ProfileWizardComplete';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const TOTAL_STEPS = 3;

export const ProfileWizard = () => {
  const { step } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const { hasResume, hasBio, isComplete } = useCachedUserCompletionStatus();
  
  const currentStep = parseInt(step || '1');
  
  // Redirect if invalid step
  useEffect(() => {
    if (currentStep < 1 || currentStep > TOTAL_STEPS) {
      navigate('/profile/step/1');
    }
  }, [currentStep, navigate]);

  const goToStep = (stepNumber: number) => {
    navigate(`/profile/step/${stepNumber}`);
  };

  const nextStep = () => {
    if (currentStep < TOTAL_STEPS) {
      goToStep(currentStep + 1);
    } else {
      navigate('/profile/complete');
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      goToStep(currentStep - 1);
    }
  };

  const getStepStatus = (stepNum: number) => {
    if (stepNum === 1) return hasResume ? 'complete' : 'current';
    if (stepNum === 2) return hasBio ? 'complete' : hasResume ? 'current' : 'pending';
    if (stepNum === 3) return isComplete ? 'current' : 'pending';
    return 'pending';
  };

  const canProceedToNext = () => {
    if (currentStep === 1) return hasResume;
    if (currentStep === 2) return hasBio;
    if (currentStep === 3) return true; // Can always proceed from job alerts
    return false;
  };

  const getProgressPercentage = () => {
    let progress = 0;
    if (hasResume) progress += 33;
    if (hasBio) progress += 33;
    if (isComplete) progress += 34;
    return progress;
  };

  if (currentStep === 4 || (currentStep > TOTAL_STEPS)) {
    return <ProfileWizardComplete />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Welcome Header */}
      <div className="text-center mb-8">
        <h1 className="font-extrabold text-3xl md:text-4xl font-orbitron drop-shadow mb-2">
          <span className="mr-2">🎉</span>
          <span className="bg-gradient-to-r from-sky-400 via-fuchsia-400 to-pastel-lavender bg-clip-text text-transparent">
            Welcome, 
          </span>
          <span className="italic bg-gradient-to-r from-pastel-peach to-pastel-mint bg-clip-text text-transparent">
            {user?.firstName || 'User'}
          </span>
        </h1>
        <p className="text-gray-300 text-lg mt-2">Let's set up your profile in just 3 steps</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-gray-400">Progress</span>
          <span className="text-sm text-gray-400">{getProgressPercentage()}% complete</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-blue-400 transition-all duration-500"
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
      </div>

      {/* Step Navigation */}
      <div className="flex justify-center items-center space-x-4 mb-12">
        {[1, 2, 3].map((stepNum) => {
          const status = getStepStatus(stepNum);
          const isActive = stepNum === currentStep;
          
          return (
            <div key={stepNum} className="flex items-center">
              <button
                onClick={() => goToStep(stepNum)}
                className={`flex flex-col items-center transition-all duration-200 ${
                  status === 'pending' && stepNum !== currentStep ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'
                }`}
                disabled={status === 'pending' && stepNum !== currentStep}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg mb-2 transition-all duration-200 ${
                  status === 'complete' 
                    ? 'bg-emerald-500 text-black' 
                    : isActive 
                      ? 'bg-blue-500 text-white ring-2 ring-blue-300' 
                      : 'bg-gray-600 text-gray-300'
                }`}>
                  {status === 'complete' ? '✓' : stepNum}
                </div>
                <span className={`text-sm font-medium ${
                  isActive ? 'text-blue-400' : status === 'complete' ? 'text-emerald-400' : 'text-gray-400'
                }`}>
                  {stepNum === 1 ? 'Resume' : stepNum === 2 ? 'Bio' : 'Job Alerts'}
                </span>
              </button>
              {stepNum < 3 && (
                <div className={`w-16 h-1 mx-4 transition-all duration-200 ${
                  getStepStatus(stepNum) === 'complete' 
                    ? 'bg-gradient-to-r from-emerald-400 to-blue-400' 
                    : 'bg-gray-600'
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="mb-8">
        {currentStep === 1 && <Step1ResumeUpload onComplete={nextStep} />}
        {currentStep === 2 && <Step2BioCreation onComplete={nextStep} />}
        {currentStep === 3 && <Step3JobAlertsSetup onComplete={nextStep} />}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center">
        <Button
          onClick={prevStep}
          variant="outline"
          disabled={currentStep === 1}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>

        <div className="flex gap-3">
          {currentStep < TOTAL_STEPS && (
            <Button
              onClick={() => nextStep()}
              variant="ghost"
              className="text-gray-400 hover:text-gray-300"
            >
              Skip for now
            </Button>
          )}
          
          <Button
            onClick={nextStep}
            disabled={currentStep < TOTAL_STEPS && !canProceedToNext()}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            {currentStep === TOTAL_STEPS ? 'Complete Setup' : 'Continue'}
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};