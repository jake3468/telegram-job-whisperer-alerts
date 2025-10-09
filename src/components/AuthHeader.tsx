
import { SignedIn, SignedOut, SignInButton, SignUpButton } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';

const AuthHeader = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false); // Close mobile menu after navigation
  };

  const navItems = [
    { label: 'Features', id: 'telegram-agents' },
    { label: 'How It Works', id: 'how-it-works' },
    { label: 'Pricing', id: 'pricing' },
    { label: 'FAQ', id: 'faq' },
  ];

  return (
    // Blended navbar with transparent background
    <header className="w-full backdrop-blur-sm bg-transparent fixed top-0 left-0 right-0 z-50">
      <div className="flex justify-between items-center px-3 sm:px-6 py-4 max-w-7xl mx-auto">
        {/* Logo and Site Name: Left side */}
        <div className="flex items-center space-x-2 sm:space-x-3 z-40 cursor-pointer" onClick={() => navigate('/')}>
          <img 
            alt="JobBots Logo" 
            className="h-9 w-9 sm:h-10 sm:w-10 drop-shadow-lg rounded-lg" 
            src="https://fnzloyyhzhrqsvslhhri.supabase.co/storage/v1/object/public/assets/logo.jpg"
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
          <span className="font-inter text-foreground font-extrabold sm:text-3xl text-2xl tracking-wide">
            Aspirely
          </span>
        </div>

        {/* Desktop Navigation Menu - only show on large screens */}
        <nav className="hidden lg:flex items-center space-x-8">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className="text-foreground hover:text-primary transition-colors duration-200 font-inter font-medium text-base"
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Desktop Theme Toggle and Auth Buttons: Right side - only show on large screens */}
        <div className="hidden lg:flex items-center space-x-4">
          
          <SignedOut>
            <div className="flex items-center space-x-4">
              <SignInButton mode="modal" fallbackRedirectUrl="/ai-agents">
                <button className="rounded-xl border border-primary/80 bg-background/80 text-foreground hover:border-accent hover:text-black transition-colors duration-200 font-inter text-base font-semibold px-6 py-2 shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2" style={{
                  minWidth: '100px',
                  boxShadow: "0 4px 32px 0 rgba(56,189,248,0.09)"
                }}>
                  <span className="text-sm sm:text-base tracking-wide">Sign In</span>
                </button>
              </SignInButton>
              <SignUpButton mode="modal" fallbackRedirectUrl="/ai-agents">
                <button className="rounded-xl bg-[#30313d] hover:bg-[#2a2b35] text-white px-6 py-2 shadow-lg transition-all duration-200 font-inter font-semibold text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#30313d] focus:ring-offset-2">
                  Create Account
                </button>
              </SignUpButton>
            </div>
          </SignedOut>
          <SignedIn>
            {/* Add user dropdown or account button here if needed */}
          </SignedIn>
        </div>

        {/* Mobile/Tablet Hamburger Menu - show on tablet and mobile */}
        <div className="lg:hidden flex items-center space-x-2">
          
          <button
            onClick={toggleMenu}
            className="text-foreground p-2 rounded-lg hover:bg-muted transition-colors duration-200"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile/Tablet Dropdown Menu */}
      {isMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-background dark:bg-black backdrop-blur-md border-b border-border shadow-lg">
          <div className="px-4 py-4 space-y-3">
            {/* Navigation Items */}
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="w-full text-left text-foreground hover:text-primary transition-colors duration-200 font-inter font-medium text-base py-2 px-2 rounded hover:bg-muted"
              >
                {item.label}
              </button>
            ))}
            
            {/* Divider */}
            <div className="border-t border-border my-3"></div>
            
            {/* Auth Buttons */}
            <SignedOut>
              <SignInButton mode="modal" fallbackRedirectUrl="/ai-agents">
                <button 
                  className="w-full rounded-xl border border-primary/80 bg-background/80 text-foreground hover:border-accent hover:text-black transition-colors duration-200 font-inter text-base font-semibold px-6 py-3 shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal" fallbackRedirectUrl="/ai-agents">
                <button 
                  className="w-full rounded-xl bg-[#30313d] hover:bg-[#2a2b35] text-white px-6 py-3 shadow-lg transition-all duration-200 font-inter font-semibold text-base focus:outline-none focus:ring-2 focus:ring-[#30313d] focus:ring-offset-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Create Account
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              {/* Add user menu items here if needed */}
            </SignedIn>
          </div>
        </div>
      )}
    </header>
  );
};

export default AuthHeader;
