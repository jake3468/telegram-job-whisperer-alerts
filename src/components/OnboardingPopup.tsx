import { useState, useRef } from 'react';
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
  const contentRef = useRef<HTMLDivElement>(null);
  const nextStep = () => {
    if (currentStep < 3) {
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
  const handleLetSGo = () => {
    setCurrentStep(0);
    onClose();
  };
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <div className="text-center space-y-4">
            {/* Logo and Brand */}
            <div className="flex flex-col items-center space-y-2 mb-4">
              <img src="/lovable-uploads/3fabfd8d-c393-407c-a35b-e87b89bf88b6.jpg" alt="Aspirely Logo" className="w-14 h-14 sm:w-20 sm:h-20 rounded-full object-cover" />
              <h1 className="text-xl sm:text-3xl font-bold italic bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
                Aspirely.ai
              </h1>
            </div>
            
            <h2 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
              This Isn't Another Boring Job Site.
            </h2>
            <p className="text-base sm:text-xl font-semibold text-gray-900">
              Welcome to Aspirely.ai — where we break the rules, rewrite the hiring game, and hand the power back to you.
            </p>
            <p className="text-sm sm:text-lg text-gray-600">
              You're not here to scroll through clutter. You're here to flip the system. And this is where it begins.
            </p>
          </div>;
      case 1:
        return <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 text-left">What you should do immediately ?</h2>
            </div>
            
            <div className="space-y-2">
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <h3 className="text-sm font-semibold text-purple-600 mb-1">📄 First let's feed the AI.</h3>
                <p className="text-gray-700 text-xs">Upload your resume after you close this popup message , so that our tools can understand your experience, skills, and background.</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <h3 className="text-sm font-semibold text-blue-600 mb-1">💬 Who are you beyond the PDF?</h3>
                <p className="text-gray-700 text-xs">Then, write a short intro — your story, your strengths, your vibe. Not just "hard-working team player" — tell us the stuff that makes you... you. not just the boring stuff. Brag. Be weird. Be real.</p>
                <p className="text-purple-600 text-xs mt-1 font-medium">
                  The better we know you, the better the results. It's quick, and it sets the stage for everything that follows.
                </p>
              </div>
            </div>
          </div>;
      case 2:
        return <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 text-left">What we offer (you can be explore this later)?</h2>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 space-y-2">
              <h3 className="text-sm font-semibold text-orange-600">🚨 Aspirely.ai is flipping the traditional job board system.</h3>
              <p className="text-gray-700 text-xs">
                No more random clutter, 3-week-old postings, or irrelevant spam.
              </p>
              
              <div className="space-y-1">
                <p className="text-gray-900 text-sm font-medium">You get:</p>
                <ul className="space-y-0.5 text-xs text-gray-700">
                  <li>🔍 Fresh job postings from the past 24 hours only</li>
                  <li>📍 Filtered by your job title & location</li>
                  <li>🕒 Delivered daily to your Telegram, at your preferred time</li>
                  <li>🧠 Personalized to you</li>
                </ul>
              </div>
              
              <p className="text-purple-600 font-medium text-xs">
                Unlike traditional portals, we don't overwhelm you — we give you fresh, relevant jobs, every single day.
              </p>
            </div>
          </div>;
      case 3:
        return <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">What we offer (you can be explore this after)?</h2>
            </div>
            
            <div className="space-y-2">
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <h3 className="text-sm font-semibold text-green-600 mb-1">🗂️ Job Board</h3>
                <p className="text-gray-700 text-xs mb-1">
                  Here, you'll only see all your:
                </p>
                <ul className="space-y-0.5 text-xs text-gray-700">
                  <li>📅 Jobs posted today</li>
                  <li>📆 Jobs from the last 7 days</li>
                </ul>
                <p className="text-red-600 text-xs mt-1 font-medium">
                  After 7 days, they vanish. Because who hires from ancient listings?
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-gray-700 text-xs mb-1">
                  🔖 You can save interesting jobs, apply later, or move them to your Job tracker when you're ready.
                </p>
                
                <h3 className="text-sm font-semibold text-blue-600 mb-1">📌 Job Tracker = your personal roadmap to the offer.</h3>
                <p className="text-gray-700 text-xs mb-1">
                  The last stop before the offer. When you're ready to apply, move a saved job to your Job Tracker.
                </p>
                
                <div className="space-y-0.5 text-xs text-gray-700">
                  <p className="text-gray-900 text-sm font-medium">You'll unlock:</p>
                  <ul className="space-y-0.5">
                    <li>✅ Resume & cover letter checklist</li>
                    <li>🤖 AI mock interviews</li>
                    <li>🔍 Job fit analysis</li>
                    <li>🕵️‍♀️ Company decoder</li>
                    <li>📆 Follow-up tracking</li>
                  </ul>
                </div>
                
                <p className="text-purple-600 font-medium text-xs mt-1">
                  No more guessing. Just progress. You don't just apply — you execute. Like a job-hunting assassin.
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
          <div className="flex items-center justify-between gap-3 sm:gap-4">
            <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-4 min-w-0 flex-1">
              <div className="flex items-center gap-1 sm:gap-2">
                {[1, 2, 3, 4].map(step => <div key={step} className="flex items-center">
                    <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold ${step <= currentStep + 1 ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                      {step}
                    </div>
                    {step < 4 && <div className={`w-4 sm:w-8 h-0.5 mx-0.5 sm:mx-1 ${step < currentStep + 1 ? 'bg-purple-500' : 'bg-gray-200'}`} />}
                  </div>)}
              </div>
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={handleClose} className="text-gray-500 hover:text-gray-700 h-8 w-8 p-0 hover:bg-gray-100 shrink-0">
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
            {currentStep === 3 ? <div className="flex flex-col gap-2 items-center w-full">
                <Button onClick={handleLetSGo} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold px-4 py-2 text-xs sm:text-sm rounded-lg">
                  <span className="sm:hidden">Let's Go 🔥</span>
                  <span className="hidden sm:inline">Let's Go 🔥</span>
                </Button>
                <Button variant="outline" onClick={handleDontShowAgain} className="w-full text-xs sm:text-sm text-red-600 border-red-300 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg">
                  <span className="sm:hidden">Don't show again</span>
                  <span className="hidden sm:inline">Don't show again</span>
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