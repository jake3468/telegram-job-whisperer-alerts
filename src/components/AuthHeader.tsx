
import { SignedIn, SignedOut, SignInButton, SignUpButton } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';

interface AuthHeaderProps {
  showSectionNav?: boolean;
}

const AuthHeader = ({ showSectionNav = true }: AuthHeaderProps) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { theme, setTheme } = useTheme();

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    // Floating liquid navbar with shrink-on-scroll
    <header className={`
      fixed left-0 right-0 z-50
      transition-all duration-300 ease-in-out
      ${isScrolled ? 'top-2' : 'top-4 sm:top-6'}
    `}>
      <div className={`
        flex justify-between items-center mx-auto
        rounded-full backdrop-blur-md
        bg-background/80 dark:bg-background/80
        shadow-lg border border-border/20
        transition-all duration-300 ease-in-out
        ${isScrolled 
          ? 'max-w-5xl px-3 sm:px-4 py-2' 
          : 'max-w-6xl px-4 sm:px-6 py-3 sm:py-4'
        }
      `}>
        {/* Logo and Site Name: Left side */}
        <div className="flex items-center space-x-2 sm:space-x-3 z-40 cursor-pointer transition-all duration-300" onClick={() => navigate('/')}>
          <img 
            alt="JobBots Logo" 
            className={`
              drop-shadow-lg rounded-lg transition-all duration-300
              ${isScrolled ? 'h-8 w-8' : 'h-9 w-9 sm:h-10 sm:w-10'}
            `}
            src="https://fnzloyyhzhrqsvslhhri.supabase.co/storage/v1/object/public/assets/logo.jpg"
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
          <span className={`
            font-inter text-foreground font-semibold tracking-normal transition-all duration-300
            ${isScrolled ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'}
          `}>
            Aspirely AI
          </span>
        </div>

        {/* Desktop Navigation Menu - only show on large screens */}
        {showSectionNav && (
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
        )}

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
        <div className="lg:hidden absolute top-full left-4 right-4 mt-2 bg-background dark:bg-background/95 backdrop-blur-md border border-border rounded-3xl shadow-lg">
          <div className="px-4 py-4 space-y-3">
            {/* Navigation Items */}
            {showSectionNav && (
              <>
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
              </>
            )}
            
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
