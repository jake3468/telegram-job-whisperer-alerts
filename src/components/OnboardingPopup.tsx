import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, ChevronRight, ChevronLeft, FileText, User, Bell, Target } from 'lucide-react';
import { useCachedUserProfile } from '@/hooks/useCachedUserProfile';
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
  const {
    userProfile
  } = useCachedUserProfile();
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
            
            
            <p className="text-base sm:text-xl font-semibold text-gray-900">
              Welcome to Aspirely.ai — where we break the rules, rewrite the hiring game, and hand the power back to you.
            </p>
            <p className="text-sm sm:text-lg text-gray-600">

You're not here to scroll through clutter. You're here to flip the system. And this is where it begins.</p>
          </div>;
      case 1:
        return <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 text-center mb-4">
              <p className="text-blue-700 text-sm font-bold">Below are the three steps you need to do first to be ahead of 99% of all job seekers. If you do these 3 simple steps, we can assure you that you will see and feel the changes and be more efficient.</p>
            </div>
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <h3 className="text-sm font-bold text-purple-600 mb-1">📄 Step 1: Upload Your Resume</h3>
                <p className="text-gray-700 text-xs">Feed the AI your resume so it can understand your skills and experience.</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <h3 className="text-sm font-bold text-blue-600 mb-1">💬 Step 2: Write a Short Intro</h3>
                <p className="text-gray-700 text-xs">Tell us who you are beyond the PDF. Be real, be bold — it helps us personalize everything for you.</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <h3 className="text-sm font-bold text-orange-600 mb-1">📲 Step 3: Activate Telegram Alerts</h3>
                <p className="text-gray-700 text-xs mb-2">Get your own personalized daily job alerts like the example below 👇</p>
                <div className="mb-3 flex justify-center">
                  <img src="/lovable-uploads/f2862620-a249-47c6-982e-20ecd839539d.png" alt="Telegram job alert example" className="max-w-full h-auto rounded-lg shadow-sm max-h-64" loading="lazy" onError={e => {
                  e.currentTarget.style.display = 'none';
                }} />
                </div>
                <p className="text-gray-700 text-xs mb-1 font-medium">Each alert gives you:</p>
                <ul className="space-y-0.5 text-xs text-gray-600 ml-2">
                  <li>• One-tap resume, cover letter, and visa info</li>
                  <li>• Instant company insights & job fit checks</li>
                  <li>• Effortless job tracking — way easier than anything you've used before</li>
                </ul>
              </div>
              
              <div className="bg-green-50 rounded-lg p-3 border border-green-200 text-center">
                <p className="text-green-700 text-sm font-bold">✅ Now, close this popup and get started — it takes just 2 minutes!</p>
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
                {[1, 2].map(step => <div key={step} className="flex items-center">
                    <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold ${step <= currentStep + 1 ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                      {step}
                    </div>
                    {step < 2 && <div className={`w-4 sm:w-8 h-0.5 mx-0.5 sm:mx-1 ${step < currentStep + 1 ? 'bg-purple-500' : 'bg-gray-200'}`} />}
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
            {currentStep === 1 ? <div className="flex flex-col gap-2 items-center w-full">
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