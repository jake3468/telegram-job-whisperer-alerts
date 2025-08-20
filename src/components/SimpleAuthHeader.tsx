import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/clerk-react';

const SimpleAuthHeader = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };


  const navItems = [
    { label: 'About Us', id: 'about-us' },
    { label: 'Features', id: 'features' },
    { label: 'How It Works', id: 'how-it-works' },
    { label: 'Pricing', id: 'pricing' },
    { label: 'FAQ', id: 'faq' },
  ];

  return (
    <header className="w-full backdrop-blur-md bg-black/30 fixed top-0 left-0 right-0 z-50 border-b border-sky-600/20 shadow-[0_6px_24px_0px_rgba(16,118,238,0.05)]">
      <div className="flex justify-between items-center px-3 sm:px-6 py-4 max-w-7xl mx-auto">
        {/* Logo and Site Name */}
        <div className="flex items-center space-x-2 sm:space-x-3 z-40 cursor-pointer" onClick={() => navigate('/')}>
          <img alt="JobBots Logo" className="h-9 w-9 sm:h-10 sm:w-10 drop-shadow-lg" src="/lovable-uploads/924d7c77-405f-4345-8967-693eebdb7865.jpg" />
          <span className="font-orbitron text-white font-extrabold sm:text-3xl text-2xl tracking-wider drop-shadow">
            Aspirely.ai
          </span>
        </div>

        {/* Desktop Navigation Menu */}
        <nav className="hidden lg:flex items-center space-x-8">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className="text-white hover:text-sky-300 transition-colors duration-200 font-inter font-medium text-base"
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Desktop Auth Buttons */}
        <div className="hidden lg:block">
          <SignedOut>
            <div className="flex items-center space-x-4">
              <SignInButton mode="modal">
                <button 
                  className="rounded-xl border border-sky-400/80 bg-black/80 text-white hover:border-fuchsia-500 hover:text-fuchsia-300 transition-colors duration-200 font-inter text-base font-semibold px-6 py-2 shadow-md focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2"
                  style={{
                    minWidth: '100px',
                    boxShadow: "0 4px 32px 0 rgba(56,189,248,0.09)"
                  }}
                >
                  <span className="text-sm sm:text-base tracking-wide">Sign In</span>
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button 
                  className="rounded-xl bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white px-6 py-2 shadow-lg hover:from-blue-600 hover:to-blue-800 transition-all duration-200 font-inter font-semibold text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                >
                  Create Account
                </button>
              </SignUpButton>
            </div>
          </SignedOut>
          <SignedIn>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate('/dashboard')}
                className="rounded-xl bg-gradient-to-r from-purple-600 via-blue-600 to-purple-700 text-white px-6 py-2 shadow-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-inter font-semibold text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2"
              >
                Dashboard
              </button>
              <UserButton />
            </div>
          </SignedIn>
        </div>

        {/* Mobile Hamburger Menu */}
        <div className="lg:hidden">
          <button
            onClick={toggleMenu}
            className="text-white p-2 rounded-lg hover:bg-white/10 transition-colors duration-200"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {isMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-black/95 backdrop-blur-md border-b border-sky-600/20 shadow-lg">
          <div className="px-4 py-4 space-y-3">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="w-full text-left text-white hover:text-sky-300 transition-colors duration-200 font-inter font-medium text-base py-2 px-2 rounded hover:bg-white/5"
              >
                {item.label}
              </button>
            ))}
            
            <div className="border-t border-gray-600 my-3"></div>
            
            <SignedOut>
              <SignInButton mode="modal">
                <button 
                  className="w-full rounded-xl border border-sky-400/80 bg-black/80 text-white hover:border-fuchsia-500 hover:text-fuchsia-300 transition-colors duration-200 font-inter text-base font-semibold px-6 py-3 shadow-md focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2"
                >
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button 
                  className="w-full rounded-xl bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white px-6 py-3 shadow-lg hover:from-blue-600 hover:to-blue-800 transition-all duration-200 font-inter font-semibold text-base focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                >
                  Create Account
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <button 
                onClick={() => navigate('/dashboard')}
                className="w-full rounded-xl bg-gradient-to-r from-purple-600 via-blue-600 to-purple-700 text-white px-6 py-3 shadow-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-inter font-semibold text-base focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2"
              >
                Dashboard
              </button>
              <div className="flex justify-center mt-2">
                <UserButton />
              </div>
            </SignedIn>
          </div>
        </div>
      )}
    </header>
  );
};

export default SimpleAuthHeader;