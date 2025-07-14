import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useJobAlertsOnboardingPopup } from '@/hooks/useJobAlertsOnboardingPopup';
import { X } from 'lucide-react';

export function JobAlertsOnboardingPopup() {
  const {
    showPopup,
    hidePopup,
    dontShowAgain,
    isUpdating
  } = useJobAlertsOnboardingPopup();
  
  return (
    <Dialog open={showPopup} onOpenChange={hidePopup}>
      <DialogContent className="w-[90vw] max-w-2xl h-[85vh] bg-white border border-gray-200 text-gray-900 flex flex-col rounded-2xl">
        <DialogHeader className="shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold text-gray-900">
              Job Alerts Onboarding
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={hidePopup}
              className="text-gray-500 hover:text-gray-700 h-8 w-8 p-0 hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto py-4 px-1">
          <div className="text-center space-y-4">
            {/* Logo and Brand */}
            <div className="flex flex-col items-center space-y-3 mb-6">
              <img 
                src="/lovable-uploads/3fabfd8d-c393-407c-a35b-e87b89bf88b6.jpg" 
                alt="Aspirely Logo" 
                className="w-16 h-16 rounded-full object-cover"
              />
              <h1 className="text-2xl font-bold italic bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
                Aspirely.ai
              </h1>
            </div>
            
            <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
              🪧 Your Job Hunt Just Got Smarter using Telegram Job Alerts
            </h2>
            
            <div className="text-left bg-gray-50 rounded-lg p-6 space-y-4">
              <p className="text-gray-700 leading-relaxed">
                We know — setting something up can feel like a chore.<br />
                You're probably thinking: "Do I really need to do this?"
              </p>
              
              <p className="text-gray-700 leading-relaxed font-medium">
                Yes. And it takes less than a minute.<br />
                All you need to do is activate our Telegram Job Alert Bot by following the quick steps on this page.
              </p>
              
              <div className="space-y-3">
                <p className="text-gray-900 font-semibold">Once you're in, you'll unlock:</p>
                <ul className="text-gray-700 space-y-2 pl-4">
                  <li className="flex items-center gap-2">
                    <span className="text-orange-500">🎯</span>
                    Job alerts based on your desired job title
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-500">🌍</span>
                    Filtered by your desired country and location
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">🕒</span>
                    Delivered at your chosen time — every single day
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-purple-500">🚀</span>
                    And it's all blazing fast, laser-targeted, and 100% fluff-free
                  </li>
                </ul>
              </div>
              
              <div className="bg-white rounded-md p-4 border-l-4 border-orange-500">
                <p className="text-orange-700 leading-relaxed font-medium">
                  This isn't just another job alert system — it's your personal AI-powered sidekick that delivers handpicked jobs while you sip your chai ☕.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="shrink-0 flex flex-col gap-3 pt-4 border-t border-gray-200">
          <Button 
            onClick={hidePopup} 
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold"
          >
            Let's Gooo, Job God Mode 🔥
          </Button>
          
          <Button 
            variant="outline" 
            onClick={dontShowAgain} 
            disabled={isUpdating}
            className="text-red-600 border-red-300 bg-red-50 hover:bg-red-100 font-medium"
          >
            {isUpdating ? 'Updating...' : "Don't show this message again"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}