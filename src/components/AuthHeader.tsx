
import { SignedIn, SignedOut, SignInButton, SignUpButton } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

const AuthHeader = () => {
  const navigate = useNavigate();

  return (
    <header className="w-full backdrop-blur-md bg-black/70 fixed top-0 left-0 right-0 z-50 border-b border-sky-600/40 shadow-[0_6px_24px_0px_rgba(16,118,238,0.08)]">
      <div className="flex justify-between items-center px-3 sm:px-6 py-4 max-w-7xl mx-auto">
        {/* Logo and Site Name: Left side */}
        <div className="flex items-center space-x-2 sm:space-x-3 z-40 cursor-pointer" onClick={() => navigate('/')}>
          <img alt="JobBots Logo" className="h-9 w-9 sm:h-10 sm:w-10 drop-shadow-lg" src="/lovable-uploads/924d7c77-405f-4345-8967-693eebdb7865.jpg" />
          <span style={{
            letterSpacing: '0.09em',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }} className="font-orbitron bg-gradient-to-r from-sky-400 via-fuchsia-400 to-indigo-500 bg-clip-text tracking-wider drop-shadow font-extrabold sm:text-3xl text-white text-2xl">Aspirely.ai</span>
        </div>
        
        {/* Auth Buttons: Right side */}
        <div className="flex items-center">
          <SignedOut>
            <div className="flex flex-col items-end space-y-1 sm:space-y-0 sm:space-x-4 sm:flex-row sm:items-center">
              <SignInButton mode="modal">
                <button className="rounded-xl border border-sky-400/80 bg-black/80 text-white hover:border-fuchsia-500 hover:text-fuchsia-300 transition-colors duration-200 font-inter text-base font-semibold px-6 py-2 shadow-md focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2" style={{
                  minWidth: '100px',
                  boxShadow: "0 4px 32px 0 rgba(56,189,248,0.09)"
                }}>
                  <span className="text-sm sm:text-base tracking-wide">Sign In</span>
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="rounded-xl bg-gradient-to-r from-sky-400 via-fuchsia-400 to-indigo-500 text-white px-6 py-2 shadow-lg hover:from-sky-500 hover:to-indigo-600 transition-all duration-200 font-inter font-semibold text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:ring-offset-2 animate-pulse-[2s_1s_infinite_alternate]">
                    Sign Up
                  </button>
              </SignUpButton>
            </div>
          </SignedOut>
          <SignedIn>
            <button
              onClick={() => navigate('/profile')}
              className="rounded-xl bg-gradient-to-r from-green-400 to-blue-500 text-white px-6 py-2 shadow-lg hover:from-green-500 hover:to-blue-600 transition-all duration-200 font-inter font-semibold text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
            >
              Dashboard
            </button>
          </SignedIn>
        </div>
      </div>
    </header>
  );
};

export default AuthHeader;
