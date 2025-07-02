import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, FileText, User, Sparkles } from 'lucide-react';
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
  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-md max-h-[80vh] overflow-y-auto bg-gradient-to-br from-purple-900/95 via-blue-900/95 to-indigo-900/95 border-purple-500/30 text-white">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Welcome to Aspirely.ai! 🎉
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-white/70 hover:text-white h-8 w-8 p-0 bg-red-800 hover:bg-red-700">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="text-center">
            <h3 className="text-base font-semibold mb-2">
              🌟 We're thrilled to have you here{userName ? `, ${userName}` : ''}! 🌟
            </h3>
            <p className="text-purple-100/90 text-sm leading-relaxed">
              Get ready to supercharge your career journey with AI-powered tools! ✨
            </p>
          </div>

          <div className="bg-black/30 rounded-lg p-3 space-y-3">
            <h4 className="text-sm font-semibold text-center mb-2 text-blue-300">
              🚀 Let's get you started:
            </h4>
            
            <div className="space-y-2">
              <div className="flex items-start gap-3 p-2 bg-purple-800/30 rounded-lg">
                <div className="bg-purple-500 p-1 rounded-full flex-shrink-0">
                  <FileText className="w-3 h-3 text-white" />
                </div>
                <div>
                  <h5 className="font-semibold text-purple-200 text-xs">📄 Step 1: Upload Resume</h5>
                  <p className="text-purple-100/80 text-xs mt-1">
                    Upload your resume PDF to help our AI understand your background! 
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2 bg-blue-800/30 rounded-lg">
                <div className="bg-blue-500 p-1 rounded-full flex-shrink-0">
                  <User className="w-3 h-3 text-white" />
                </div>
                <div>
                  <h5 className="font-semibold text-blue-200 text-xs">✍️ Step 2: Tell Us About You</h5>
                  <p className="text-blue-100/80 text-xs mt-1">
                    Add a brief introduction in the "About You" section! 
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2 bg-indigo-800/30 rounded-lg">
                <div className="bg-indigo-500 p-1 rounded-full flex-shrink-0">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
                <div>
                  <h5 className="font-semibold text-indigo-200 text-xs">🎯 Step 3: Explore Our Tools</h5>
                  <p className="text-indigo-100/80 text-xs mt-1">
                    Now you're ready to use our powerful AI tools! 
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-purple-100/90 font-medium text-sm">
              💪 You've got this! 🎯
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-3 border-t border-purple-500/20">
          <Button onClick={onClose} className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold text-sm h-9">
            Got it! Let's start! 🚀
          </Button>
          <Button variant="outline" onClick={onDontShowAgain} className="w-full border-purple-400/30 text-sm h-8 bg-gray-100 text-gray-900">
            Don't show again
          </Button>
        </div>
      </DialogContent>
    </Dialog>;
}