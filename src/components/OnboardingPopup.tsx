import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, ChevronRight, ChevronLeft, FileText, User, Bell, Target } from 'lucide-react';

interface OnboardingPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onDontShowAgain: () => void;
  userName?: string;
}

export function OnboardingPopup({
  isOpen,
  onClose,
  onDontShowAgain,
  userName
}: OnboardingPopupProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    onClose();
  };

  const handleDontShowAgain = () => {
    setCurrentStep(0);
    onDontShowAgain();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
              This Isn't Another Boring Job Site.
            </h2>
            <p className="text-lg font-semibold text-white">
              Welcome to Aspirely.ai — where we break the rules, rewrite the hiring game, and hand the power back to you.
            </p>
            <p className="text-gray-300">
              You're not here to scroll through clutter. You're here to flip the system. And this is where it begins.
            </p>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                <FileText className="w-6 h-6 text-purple-400" />
                Power Up Your Profile
              </h2>
            </div>
            
            <div className="space-y-3">
              <div className="bg-black/30 rounded-lg p-4">
                <h3 className="font-semibold text-purple-300 mb-2">📄 Let's feed the AI.</h3>
                <p className="text-gray-300 text-sm">
                  Upload your resume so our tools can understand your experience, skills, and background.
                </p>
              </div>
              
              <div className="bg-black/30 rounded-lg p-4">
                <h3 className="font-semibold text-blue-300 mb-2">💬 Who are you beyond the PDF?</h3>
                <p className="text-gray-300 text-sm">
                  Write a short intro — your story, your strengths, your vibe. Not just "hard-working team player" — tell us the stuff that makes you... you. not just the boring stuff. Brag. Be weird. Be real.
                </p>
                <p className="text-purple-300 text-sm mt-2 font-medium">
                  The better we know you, the better the results. It's quick, and it sets the stage for everything that follows.
                </p>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                <Bell className="w-6 h-6 text-orange-400" />
                Set Smart Job Alerts That Actually Work
              </h2>
            </div>
            
            <div className="bg-black/30 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-orange-300">🚨 This is where Aspirely flips the system.</h3>
              <p className="text-gray-300 text-sm">
                No more random clutter, 3-week-old postings, or irrelevant spam.
              </p>
              
              <div className="space-y-2">
                <p className="text-white font-medium">You get:</p>
                <ul className="space-y-1 text-sm text-gray-300">
                  <li>🔍 Fresh job postings from the past 24 hours only</li>
                  <li>📍 Filtered by your job title & location</li>
                  <li>🕒 Delivered daily to your Telegram, at your preferred time</li>
                  <li>🧠 Personalized to you</li>
                </ul>
              </div>
              
              <p className="text-purple-300 font-medium text-sm">
                Unlike traditional portals, we don't overwhelm you — we give you fresh, relevant jobs, every single day.
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                <Target className="w-6 h-6 text-green-400" />
                Save, Track, and Conquer Jobs Like a Pro
              </h2>
            </div>
            
            <div className="space-y-3">
              <div className="bg-black/30 rounded-lg p-4">
                <h3 className="font-semibold text-green-300 mb-2">🗂️ Welcome to the Job Board</h3>
                <p className="text-gray-300 text-sm mb-2">
                  Here, you'll only see all your:
                </p>
                <ul className="space-y-1 text-sm text-gray-300">
                  <li>📅 Jobs posted today</li>
                  <li>📆 Jobs from the last 7 days</li>
                </ul>
                <p className="text-red-300 text-sm mt-2 font-medium">
                  After 7 days, they vanish. Because who hires from ancient listings?
                </p>
              </div>
              
              <div className="bg-black/30 rounded-lg p-4">
                <p className="text-gray-300 text-sm mb-2">
                  🔖 You can save interesting jobs, apply later, or move them to your Job tracker when you're ready.
                </p>
                
                <h3 className="font-semibold text-blue-300 mb-2">📌 Job Tracker = your personal roadmap to the offer.</h3>
                <p className="text-gray-300 text-sm mb-2">
                  The last stop before the offer. When you're ready to apply, move a saved job to your Job Tracker.
                </p>
                
                <div className="space-y-1 text-sm text-gray-300">
                  <p className="text-white font-medium">You'll unlock:</p>
                  <ul className="space-y-1">
                    <li>✅ Resume & cover letter checklist</li>
                    <li>🤖 AI mock interviews</li>
                    <li>🔍 Job fit analysis</li>
                    <li>🕵️‍♀️ Company decoder</li>
                    <li>📆 Follow-up tracking</li>
                  </ul>
                </div>
                
                <p className="text-purple-300 font-medium text-sm mt-2">
                  No more guessing. Just progress. You don't just apply — you execute. Like a job-hunting assassin.
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[90vw] max-w-2xl max-h-[85vh] overflow-hidden bg-gradient-to-br from-gray-900/95 via-purple-900/95 to-indigo-900/95 border-purple-500/30 text-white">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent flex items-center gap-2">
              <div className="flex items-center gap-2">
                <span>Step {currentStep + 1} of 4</span>
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((step) => (
                    <div
                      key={step}
                      className={`w-2 h-2 rounded-full ${
                        step <= currentStep ? 'bg-purple-400' : 'bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-white/70 hover:text-white h-8 w-8 p-0 hover:bg-red-600/50"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto py-4">
          {renderStepContent()}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-purple-500/20">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center gap-2 border-purple-400/30 text-white disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
          
          <div className="flex gap-2">
            {currentStep === 3 ? (
              <>
                <Button
                  onClick={handleDontShowAgain}
                  className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold px-6"
                >
                  Let's Go — I'm Ready to Flip the Job Hunt 🔥
                </Button>
              </>
            ) : (
              <Button
                onClick={nextStep}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold flex items-center gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}