import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useJobAlertsOnboardingPopup } from '@/hooks/useJobAlertsOnboardingPopup';
import { X } from 'lucide-react';

export function JobAlertsOnboardingPopup() {
  const { showPopup, hidePopup, dontShowAgain, isUpdating } = useJobAlertsOnboardingPopup();

  return (
    <Dialog open={showPopup} onOpenChange={hidePopup}>
      <DialogContent className="max-w-sm sm:max-w-md mx-4 p-0 overflow-hidden border-orange-200">
        {/* Header Section with Close Button */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4 relative">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={hidePopup}
            className="absolute top-2 right-2 h-8 w-8 text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </Button>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white text-center pr-8">
              🪧 Your Job Hunt Just Got Smarter (and Slightly More Fun)
            </DialogTitle>
          </DialogHeader>
        </div>
        
        {/* Body Section */}
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 px-6 py-5">
          <div className="space-y-4 text-orange-800">
            <p className="text-sm leading-relaxed">
              We know — setting something up can feel like a chore.<br />
              You're probably thinking: "Do I really need to do this?"
            </p>
            
            <p className="text-sm leading-relaxed font-medium">
              Yes. And it takes less than a minute.<br />
              All you need to do is activate our Telegram Job Alert Bot by following the quick steps on this page.
            </p>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Once you're in, you'll unlock:</p>
              <ul className="text-sm space-y-1 pl-4">
                <li>🎯 Job alerts based on your desired job title</li>
                <li>🌍 Filtered by your desired country and location</li>
                <li>🕒 Delivered at your chosen time — every single day</li>
                <li>🚀 And it's all blazing fast, laser-targeted, and 100% fluff-free</li>
              </ul>
            </div>
            
            <p className="text-sm leading-relaxed">
              This isn't just another job alert system — it's your personal AI-powered sidekick that delivers handpicked jobs while you sip your chai ☕.
            </p>
          </div>
          
          <div className="flex flex-col gap-3 pt-6">
            <Button 
              onClick={hidePopup} 
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold"
            >
              Let's Gooo, Job God Mode 🔥
            </Button>
            
            <Button 
              variant="outline" 
              onClick={dontShowAgain} 
              disabled={isUpdating}
              className="w-full border-orange-300 text-orange-700 bg-white hover:bg-orange-50 hover:text-orange-800 font-medium"
            >
              {isUpdating ? 'Updating...' : "Don't show again"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}