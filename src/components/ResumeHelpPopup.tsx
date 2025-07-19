import React from 'react';
import { X, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ResumeHelpPopupProps {
  isOpen: boolean;
  onClose: () => void;
  userProfileId?: string;
}

export const ResumeHelpPopup: React.FC<ResumeHelpPopupProps> = ({
  isOpen,
  onClose,
  userProfileId
}) => {
  if (!isOpen) return null;

  const handleGoToResumeBot = () => {
    window.open('https://t.me/Resume_builder_AI_bot', '_blank');
    onClose();
  };

  const handleCopyUserId = () => {
    if (userProfileId) {
      navigator.clipboard.writeText(userProfileId);
      toast.success('User ID copied to clipboard!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl animate-scale-in">
        {/* Close button */}
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors z-10">
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* Content */}
        <div className="p-6 pt-12">
          <h3 className="text-xl font-bold text-gray-900 mb-4 font-orbitron">
            Need Resume Help?
          </h3>
          
          <div className="text-gray-700 text-sm mb-6 font-inter leading-relaxed space-y-4">
            <p>
              If your current resume feels really outdated or boring, no worries 😉.
            </p>
            
            <p>
              Unlike platforms where you have to manually fill out long forms, our <em>Telegram AI Resume Bot</em> lets you build or upgrade your resume through a simple, human-like chat.
            </p>
            
            <p>
              Just answer a few smart questions, and get a polished, modern PDF tailored to your goals effortlessly.
            </p>
            
            {userProfileId && (
              <div className="bg-gray-50 rounded-lg p-4 border">
                <p className="text-gray-600 text-xs mb-2 font-medium">
                  When the bot asks for your user ID, copy and paste this:
                </p>
                <div className="flex items-center gap-2 bg-white rounded border p-2">
                  <code className="text-xs font-mono text-gray-800 flex-1 break-all">
                    {userProfileId}
                  </code>
                  <button
                    onClick={handleCopyUserId}
                    className="p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                    title="Copy user ID"
                  >
                    <Copy className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <Button 
            onClick={handleGoToResumeBot} 
            className="w-full bg-gradient-to-r from-sky-500 to-fuchsia-500 hover:from-sky-600 hover:to-fuchsia-600 text-white font-semibold font-inter rounded-xl py-3"
          >
            Go to Telegram Resume Bot
          </Button>
        </div>
      </div>
    </div>
  );
};