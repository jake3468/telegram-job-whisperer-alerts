
import { SignedIn, SignedOut, SignInButton, SignUpButton } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const AuthHeader = () => {
  const navigate = useNavigate();
  return (
    <header className="w-full bg-black/95 fixed top-0 left-0 right-0 z-30 border-b border-gray-900">
      <div className="flex justify-end items-center px-6 py-4">
        <SignedOut>
          <div className="flex space-x-4">
            <SignInButton mode="modal">
              <button className="text-white hover:text-gray-300 transition-colors duration-200 font-inter text-sm">
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 font-inter text-sm font-medium">
                Sign Up
              </button>
            </SignUpButton>
          </div>
        </SignedOut>
        <SignedIn>
          {/* UserButton can be added here if desired */}
        </SignedIn>
      </div>
    </header>
  );
};

export default AuthHeader;
