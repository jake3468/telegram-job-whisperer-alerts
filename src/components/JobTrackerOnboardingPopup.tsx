import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
interface JobTrackerOnboardingPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onDontShowAgain: () => void;
}
export function JobTrackerOnboardingPopup({
  isOpen,
  onClose,
  onDontShowAgain
}: JobTrackerOnboardingPopupProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const nextStep = () => {
    if (currentStep < 1) {
      setCurrentStep(currentStep + 1);
      // Scroll to top of content
      setTimeout(() => {
        contentRef.current?.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }, 0);
    }
  };
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      // Scroll to top of content
      setTimeout(() => {
        contentRef.current?.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }, 0);
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
  const handleGotIt = () => {
    setCurrentStep(0);
    onClose();
  };
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <div className="text-center space-y-3 sm:space-y-4">
            {/* Logo and Brand */}
            <div className="flex flex-col items-center space-y-2 mb-3 sm:mb-4">
              <img src="/lovable-uploads/3fabfd8d-c393-407c-a35b-e87b89bf88b6.jpg" alt="Aspirely Logo" className="w-8 h-8 sm:w-12 sm:h-12 rounded-full object-cover" />
              <h1 className="text-sm sm:text-lg font-bold italic bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
                Aspirely.ai
              </h1>
            </div>
            
            <h2 className="text-sm sm:text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              From "Saved" to "You're Hired" — Let's Go.
            </h2>
            
            <div className="text-left bg-gray-50 rounded-lg p-2 sm:p-3 space-y-2">
              <p className="text-gray-700 text-xs">
                This is your job hunt HQ — the place where things get real.
              </p>
              <p className="text-gray-700 text-xs">
                Forget spreadsheets, sticky notes, and crossed fingers.
                The Job Tracker is where you stop browsing and start executing.
              </p>
              <p className="text-gray-700 text-xs">
                Every job you move here becomes a battle plan —
                with checklists, AI tools, and progress tracking that'll make you feel unstoppable.
              </p>
              
              <div className="bg-white rounded-md p-2 border-l-4 border-purple-500">
                <p className="text-purple-700 font-medium text-xs">
                  You're not just applying. You're plotting your takeover.
                </p>
              </div>
            </div>
          </div>;
      case 1:
        return <div className="space-y-3 sm:space-y-4">
            <div className="text-center">
              <h2 className="text-sm sm:text-lg font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2 sm:mb-3">
                Organized Chaos? Nah. This is Career Chess.
              </h2>
            </div>
            
            <div className="space-y-2">
              <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
                <p className="text-gray-700 text-xs mb-2">
                  You've got 5 battle stages, each designed to get you closer to "You're hired":
                </p>
                
                <div className="space-y-2 text-xs">
                  <div className="bg-blue-50 rounded-md p-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-blue-600 font-bold">🔵</span>
                      <span className="font-semibold">Saved – Your prep zone</span>
                    </div>
                    <p className="text-gray-600 text-xs mb-1">Your mission:</p>
                    <div className="text-xs text-gray-600 space-y-0.5">
                      <div>✅ Resume? Polished.</div>
                      <div>✅ Job? Analyzed.</div>
                      <div>✅ Company? Researched.</div>
                      <div>✅ Cover letter? 🔥</div>
                      <div>✅ Ready to hit send?</div>
                    </div>
                    <p className="text-blue-700 font-medium text-xs mt-1">Only then can you advance. We don't play messy.</p>
                  </div>

                  <div className="bg-green-50 rounded-md p-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-green-600 font-bold">🟢</span>
                      <span className="font-semibold">Applied – You sent it</span>
                    </div>
                    <p className="text-gray-600 text-xs">Log the date. Mark follow-ups. Avoid ghosting like a pro.</p>
                  </div>

                  <div className="bg-yellow-50 rounded-md p-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-yellow-600 font-bold">🟡</span>
                      <span className="font-semibold">Interview – Showtime</span>
                    </div>
                    <p className="text-gray-600 text-xs">Access AI-powered prep guides. Practice with mock interviews. Don't just wing it — dominate it.</p>
                  </div>

                  <div className="bg-red-50 rounded-md p-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-red-600 font-bold">🔴</span>
                      <span className="font-semibold">Rejected – It happens</span>
                    </div>
                    <p className="text-gray-600 text-xs">Record it. Learn from it. Then flex harder on the next one.</p>
                  </div>

                  <div className="bg-purple-50 rounded-md p-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-purple-600 font-bold">🟣</span>
                      <span className="font-semibold">Offer – Boom. 🎉</span>
                    </div>
                    <p className="text-gray-600 text-xs">You made it. Track your offers like a boss. Negotiate. Celebrate. Repeat.</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-orange-50 to-purple-50 rounded-lg p-2 sm:p-3 border border-orange-200">
                <p className="text-gray-800 font-medium text-xs text-center">
                  Aspirely.ai doesn't just help you apply — it helps you win.
                </p>
              </div>
            </div>
          </div>;
      default:
        return null;
    }
  };
  return <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[90vw] max-w-2xl h-[85vh] bg-white border border-gray-200 text-gray-900 flex flex-col rounded-2xl">
        <DialogHeader className="shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-4">
              <div className="flex items-center gap-2">
                {[1, 2].map(step => <div key={step} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${step <= currentStep + 1 ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                      {step}
                    </div>
                    {step < 2 && <div className={`w-8 h-0.5 mx-1 ${step < currentStep + 1 ? 'bg-purple-500' : 'bg-gray-200'}`} />}
                  </div>)}
              </div>
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={handleClose} className="text-gray-500 hover:text-gray-700 h-8 w-8 p-0 hover:bg-gray-100">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div ref={contentRef} className="flex-1 overflow-y-auto py-4 px-1">
          {renderStepContent()}
        </div>

        <div className="shrink-0 flex items-center justify-between pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={prevStep} disabled={currentStep === 0} className="flex items-center gap-2 border-gray-300 text-gray-700 disabled:opacity-50 hover:bg-gray-50">
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
          
          <div className="flex flex-col gap-2 min-w-0">
            {currentStep === 1 ? <div className="flex flex-col gap-2 items-center w-full">
                <Button onClick={handleGotIt} className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold px-4 py-2 text-xs sm:text-sm rounded-lg bg-green-300 hover:bg-green-200">
                  <span className="sm:hidden">Got it 🔥</span>
                  <span className="hidden sm:inline">Got it — Let's Track Some Wins 🔥</span>
                </Button>
                <Button variant="outline" onClick={handleDontShowAgain} className="w-full text-xs sm:text-sm text-red-600 border-red-300 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg">
                  <span className="sm:hidden">Don't show again</span>
                  <span className="hidden sm:inline">Don't show this message again</span>
                </Button>
              </div> : <Button onClick={nextStep} className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold flex items-center gap-2">
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>}
          </div>
        </div>
      </DialogContent>
    </Dialog>;
}