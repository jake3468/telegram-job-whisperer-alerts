
import { SignedIn, SignedOut, SignInButton, SignUpButton } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const AuthHeader = () => {
  const navigate = useNavigate();
  return (
    <header className="w-full bg-black/95 fixed top-0 left-0 right-0 z-50 border-b border-gray-900">
      <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
        {/* Logo and Site Name: Left side */}
        <div className="flex items-center space-x-3 z-40 cursor-pointer" onClick={() => navigate('/')}>
          <img src="/lovable-uploads/6239b4a7-4f3c-4902-a936-4216ae26d9af.png" alt="JobBots Logo" className="h-9 w-9 sm:h-10 sm:w-10" />
          <span
            className="text-2xl sm:text-3xl font-extrabold font-orbitron 
            bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 bg-clip-text text-transparent tracking-wider drop-shadow-sm"
            style={{
              letterSpacing: '0.08em',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
            JobBots
          </span>
        </div>
        {/* Auth Buttons: Sign In / Sign Up */}
        <div>
          <SignedOut>
            <div className="flex space-x-4">
              <SignInButton mode="modal">
                <button className="text-white hover:text-sky-400 transition-colors duration-200 font-inter text-sm font-medium z-50">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="bg-gradient-to-r from-sky-400 to-indigo-500 text-white px-4 py-2 rounded-lg shadow hover:from-sky-500 hover:to-indigo-600 transition-colors duration-200 font-inter text-sm font-semibold z-50">
                  Sign Up
                </button>
              </SignUpButton>
            </div>
          </SignedOut>
          <SignedIn>
            {/* UserButton can be added here if desired */}
          </SignedIn>
        </div>
      </div>
    </header>
  );
};

export default AuthHeader;
