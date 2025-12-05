
import { Link } from 'react-router-dom';
import { Twitter, Linkedin, Youtube, Instagram } from 'lucide-react';

const Footer = () => {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth'
      });
    }
  };

  return (
    <footer id="footer-section" className="bg-background py-12 px-4 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-8">
          {/* Company Info */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <img alt="JobBots Logo" className="h-8 w-8 rounded-lg" src="/lovable-uploads/d1063169-3726-4087-9672-b20c6091d9a4.jpg" />
              <span className="text-xl font-semibold text-foreground font-inter">Aspirely AI</span>
            </div>
            <p className="text-foreground text-base font-inter leading-relaxed max-w-md">
              The AI-powered platform for finding and creating your perfect career path with advanced job matching and personalized guidance.
            </p>
            <div className="flex items-center space-x-4 mt-4">
              <a 
                href="https://x.com/Aspirely_ai" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-foreground hover:text-muted-foreground transition-colors duration-200"
                aria-label="Follow us on X"
              >
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a 
                href="https://www.linkedin.com/company/107778088/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-foreground hover:text-muted-foreground transition-colors duration-200"
                aria-label="Follow us on LinkedIn"
              >
                <Linkedin size={20} />
              </a>
              <a 
                href="https://www.youtube.com/@AspirelyAI" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-foreground hover:text-muted-foreground transition-colors duration-200"
                aria-label="Subscribe to our YouTube channel"
              >
                <Youtube size={20} />
              </a>
              <a 
                href="https://www.instagram.com/aspirely.ai/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-foreground hover:text-muted-foreground transition-colors duration-200"
                aria-label="Follow us on Instagram"
              >
                <Instagram size={20} />
              </a>
            </div>
          </div>

          {/* Product Section */}
          <div>
            <h3 className="text-foreground font-semibold text-base font-inter mb-4">Product</h3>
            <div className="space-y-3">
              <button onClick={() => scrollToSection('features')} className="block text-foreground hover:text-primary transition-colors duration-200 text-base font-inter">
                Features
              </button>
              <button onClick={() => scrollToSection('how-it-works')} className="block text-foreground hover:text-primary transition-colors duration-200 text-base font-inter">
                How It Works
              </button>
              <button onClick={() => scrollToSection('pricing')} className="block text-foreground hover:text-primary transition-colors duration-200 text-base font-inter">
                Pricing
              </button>
              <Link to="/ebook-jobs-that-will-vanish-by-2030" className="block text-foreground hover:text-primary transition-colors duration-200 text-base font-inter" onClick={() => window.scrollTo(0, 0)}>
                Get E-book
              </Link>
            </div>
          </div>

          {/* Company Section */}
          <div>
            <h3 className="text-foreground font-semibold text-base font-inter mb-4">Company</h3>
            <div className="space-y-3">
              <Link to="/contact-support" className="block text-foreground hover:text-primary transition-colors duration-200 text-base font-inter">
                Contact Support
              </Link>
              <Link to="/blogs" className="block text-foreground hover:text-primary transition-colors duration-200 text-base font-inter" onClick={() => window.scrollTo(0, 0)}>
                Blogs
              </Link>
              <a href="https://aspirelyai-affiliate.affonso.io" target="_blank" rel="noopener noreferrer" className="block text-foreground hover:text-primary transition-colors duration-200 text-base font-inter">
                Affiliate Program (50%)
              </a>
            </div>
          </div>

          {/* Legal Section - Using standard HTML anchor tags for better crawlability */}
          <div>
            <h3 className="text-foreground font-semibold text-base font-inter mb-4">Legal</h3>
            <div className="space-y-3">
              <a href="/privacy-policy" className="block text-foreground hover:text-primary transition-colors duration-200 text-base font-inter">
                Privacy Policy
              </a>
              <a href="/cookie-policy" className="block text-foreground hover:text-primary transition-colors duration-200 text-base font-inter">
                Cookie Policy
              </a>
              <a href="/terms-of-service" className="block text-foreground hover:text-primary transition-colors duration-200 text-base font-inter">
                Terms of Service
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t border-border">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <p className="text-muted-foreground text-sm font-inter mb-4 sm:mb-0">
              © {new Date().getFullYear()} Aspirely.ai. All rights reserved.
            </p>
            <div className="flex items-center space-x-6">
              <a href="https://wired.business" target="_blank" rel="noopener noreferrer">
                <img src="https://wired.business/badge3-white.svg" alt="Featured on Wired Business" width="200" height="54" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
