import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
interface ResumeHelpPopupProps {
  isOpen: boolean;
  onClose: () => void;
}
export const ResumeHelpPopup: React.FC<ResumeHelpPopupProps> = ({
  isOpen,
  onClose
}) => {
  const navigate = useNavigate();
  if (!isOpen) return null;
  const handleGoToResumeBot = () => {
    navigate('/resume-builder');
    onClose();
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
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
          
          <p className="text-gray-700 text-sm mb-6 font-inter leading-relaxed">If your current resume feels really outdated or boring, no worries 😉. 


Unlike platforms where you have to manually fill out long forms, our Telegram AI Resume Bot lets you build or upgrade your resume through a simple, human-like chat. 


Just answer a few smart questions, and get a polished, modern PDF tailored to your goals effortlessly.</p>

          <Button onClick={handleGoToResumeBot} className="w-full bg-gradient-to-r from-sky-500 to-fuchsia-500 hover:from-sky-600 hover:to-fuchsia-600 text-white font-semibold font-inter rounded-xl py-3">Go to Telegram Resume Bot</Button>
        </div>
      </div>
    </div>;
};