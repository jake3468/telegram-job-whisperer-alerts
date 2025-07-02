import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, FileText, User, Sparkles } from 'lucide-react';

interface OnboardingPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onDontShowAgain: () => void;
  userName?: string;
}

export function OnboardingPopup({ isOpen, onClose, onDontShowAgain, userName }: OnboardingPopupProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md sm:max-w-2xl mx-4 bg-gradient-to-br from-purple-900/95 via-blue-900/95 to-indigo-900/95 border-purple-500/30 text-white">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-400" />
              Welcome to Aspirely.ai! 🎉
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-3">
              🌟 We're thrilled to have you here{userName ? `, ${userName}` : ''}! 🌟
            </h3>
            <p className="text-purple-100/90 text-lg leading-relaxed">
              Get ready to supercharge your career journey with AI-powered tools that will transform how you approach job hunting! ✨
            </p>
          </div>

          <div className="bg-black/30 rounded-xl p-6 space-y-4">
            <h4 className="text-lg font-semibold text-center mb-4 text-blue-300">
              🚀 Let's get you started with these simple steps:
            </h4>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-purple-800/30 rounded-lg">
                <div className="bg-purple-500 p-2 rounded-full flex-shrink-0">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h5 className="font-semibold text-purple-200">📄 Step 1: Upload Your Resume</h5>
                  <p className="text-purple-100/80 text-sm mt-1">
                    Head to your Profile page and upload your resume PDF. This helps our AI understand your background and create personalized content! 
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-blue-800/30 rounded-lg">
                <div className="bg-blue-500 p-2 rounded-full flex-shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h5 className="font-semibold text-blue-200">✍️ Step 2: Tell Us About You</h5>
                  <p className="text-blue-100/80 text-sm mt-1">
                    Add a brief introduction in the "About You" section. Share your career goals, interests, and what makes you unique! 
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-indigo-800/30 rounded-lg">
                <div className="bg-indigo-500 p-2 rounded-full flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h5 className="font-semibold text-indigo-200">🎯 Step 3: Explore Our Tools</h5>
                  <p className="text-indigo-100/80 text-sm mt-1">
                    Now you're ready to use our powerful AI tools! Create cover letters, prep for interviews, analyze jobs, and much more! 
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-purple-100/90 font-medium">
              💪 You've got this! Our AI is here to help you land your dream job! 🎯
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-purple-500/20">
          <Button
            onClick={onClose}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold"
          >
            Got it! Let's start! 🚀
          </Button>
          <Button
            variant="outline"
            onClick={onDontShowAgain}
            className="bg-transparent border-purple-400/30 text-purple-200 hover:bg-purple-800/30 hover:text-white"
          >
            Don't show again
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}