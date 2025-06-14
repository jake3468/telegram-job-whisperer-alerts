
import { SignedIn, SignedOut, SignInButton, SignUpButton } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

const AuthHeader = () => {
  const navigate = useNavigate();
  return (
    <header className="w-full bg-black/95 fixed top-0 left-0 right-0 z-50 border-b border-gray-900">
      <div className="flex justify-between items-center px-3 sm:px-6 py-4 max-w-7xl mx-auto">
        {/* Logo and Site Name: Left side */}
        <div
          className="flex items-center space-x-2 sm:space-x-3 z-40 cursor-pointer"
          onClick={() => navigate('/')}
        >
          <img
            src="/lovable-uploads/6239b4a7-4f3c-4902-a936-4216ae26d9af.png"
            alt="JobBots Logo"
            className="h-9 w-9 sm:h-10 sm:w-10"
          />
          <span
            className="text-[1.4rem] sm:text-3xl font-extrabold font-orbitron
            bg-gradient-to-r from-sky-400 to-indigo-500 bg-clip-text text-transparent tracking-wider drop-shadow-sm"
            style={{
              letterSpacing: '0.09em',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
            JobBots
          </span>
        </div>
        {/* Auth Buttons: Right side */}
        <div>
          <SignedOut>
            <div className="flex flex-col items-end space-y-1 sm:space-y-0 sm:space-x-4 sm:flex-row sm:items-center">
              <SignInButton mode="modal">
                <button className="text-white hover:text-sky-400 transition-colors duration-200 font-inter text-base font-medium px-1 py-1 sm:px-0 sm:py-0 z-50">
                  <span className="text-sm sm:text-base">Sign In</span>
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="bg-gradient-to-r from-sky-400 to-indigo-500 text-white px-5 py-2 rounded-lg shadow hover:from-sky-500 hover:to-indigo-600 transition-colors duration-200 font-inter font-semibold text-sm sm:text-base z-50">
                  Sign Up
                </button>
              </SignUpButton>
            </div>
          </SignedOut>
          <SignedIn>
            {/* Add user dropdown or account button here if needed */}
          </SignedIn>
        </div>
      </div>
    </header>
  );
};

export default AuthHeader;
