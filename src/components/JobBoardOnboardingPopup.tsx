import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
interface JobBoardOnboardingPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onDontShowAgain: () => void;
}
export function JobBoardOnboardingPopup({
  isOpen,
  onClose,
  onDontShowAgain
}: JobBoardOnboardingPopupProps) {
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
        return <div className="text-center space-y-4">
            {/* Logo and Brand */}
            <div className="flex flex-col items-center space-y-2 mb-4">
              <img src="/lovable-uploads/3fabfd8d-c393-407c-a35b-e87b89bf88b6.jpg" alt="Aspirely Logo" className="w-10 h-10 sm:w-16 sm:h-16 rounded-full object-cover" />
              <h1 className="text-lg sm:text-2xl font-bold italic bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
                Aspirely.ai
              </h1>
            </div>
            
            <h2 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Job Board — Where Job Alerts Come to Life</h2>
            
            <div className="text-left bg-gray-50 rounded-lg p-3 space-y-2">
              <p className="text-gray-700 text-xs">
                This is your personal job hub, powered by AI and tailored to you.
              </p>
              <p className="text-gray-700 text-xs">
                Every time you receive a job alert via Telegram, it's automatically added to the 'Posted Today' section here — no manual work needed.
              </p>
              <p className="text-gray-700 text-xs">
                These listings are fresh, relevant, and based on the alerts you've set on the 'Create Job Alerts' page.
              </p>
              
              <div className="bg-white rounded-md p-2 border-l-4 border-purple-500">
                <p className="text-purple-700 font-medium text-xs">
                  Fresh jobs. No noise. All in one place.
                </p>
                <p className="text-purple-600 text-xs">
                  AI does the hard work. You just focus on discovering and applying.
                </p>
              </div>
            </div>
          </div>;
      case 1:
        return <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-3">
                Explore. Save. Track. Win.
              </h2>
              <h3 className="text-base sm:text-xl font-semibold text-gray-900 mb-3">
                Here's how to use your Job Board
              </h3>
            </div>
            
            <div className="space-y-2">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-700 text-xs mb-2">
                  Your jobs are split into 3 simple tabs:
                </p>
                
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-purple-600 font-bold">🟣</span>
                    <span className="font-semibold">Posted Today</span>
                    <span className="text-gray-600">— Fresh listings from the past 24 hours</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600 font-bold">🕓</span>
                    <span className="font-semibold">Last 7 Days</span>
                    <span className="text-gray-600">— Recent jobs still worth a look</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-600 font-bold">⭐</span>
                    <span className="font-semibold">Saved</span>
                    <span className="text-gray-600">— Your personal stash of favorites</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <p className="text-gray-700 text-sm font-medium mb-1">You can:</p>
                <ul className="space-y-0.5 text-xs text-gray-700">
                  <li>• View full job details & apply externally</li>
                  <li>• Save jobs you like for later</li>
                  <li>• Add to Job Tracker when you're ready to apply — complete with resume checklist, AI mock interviews, job fit analysis, and more</li>
                </ul>
                
                <div className="mt-2 p-2 bg-orange-100 border border-orange-200 rounded-md">
                  <p className="text-orange-800 font-medium text-xs">
                    💡 Check back daily — jobs expire after 7 days, and fresh ones land every day.
                  </p>
                </div>
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
                <Button onClick={handleGotIt} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold px-4 py-2 text-xs sm:text-sm rounded-lg">
                  <span className="sm:hidden">Got it 🚀</span>
                  <span className="hidden sm:inline">Got it — Show Me the Jobs 🚀</span>
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