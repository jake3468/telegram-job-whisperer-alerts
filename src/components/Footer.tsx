
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
    <footer className="bg-background py-12 px-4 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-8">
          {/* Company Info */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <img alt="JobBots Logo" className="h-8 w-8 rounded-lg" src="/lovable-uploads/d1063169-3726-4087-9672-b20c6091d9a4.jpg" />
              <span className="text-xl font-semibold text-foreground font-inter">Aspirely.ai</span>
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

        {/* Featured on Section */}
        <div className="py-8" itemScope itemType="https://schema.org/Organization">
          <meta itemProp="name" content="Aspirely.ai" />
          <meta itemProp="url" content="https://aspirely.ai" />
          <meta itemProp="description" content="AI-powered career advancement platform for job seekers" />
          
          <div className="flex flex-col items-center space-y-4">
            <h3 className="text-foreground font-semibold text-sm font-inter">Featured on</h3>
            <div className="flex flex-col items-center space-y-4">
              {/* Badge row - horizontal on desktop/tablet */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 justify-items-center max-w-4xl mx-auto">
                <a href="https://startupfa.me/s/aspirely.ai?utm_source=aspirely.ai" target="_blank" rel="noopener noreferrer">
                  <img src="https://startupfa.me/badges/featured-badge.webp" alt="Featured on Startup Fame" className="h-12 w-auto object-contain" loading="lazy" />
                </a>
                
                <div itemProp="award" itemScope itemType="https://schema.org/Award">
                  <meta itemProp="name" content="Featured on Findly Tools" />
                  <a 
                    href="https://findly.tools/aspirely-ai?utm_source=aspirely-ai" 
                    target="_blank"
                    rel="noopener noreferrer"
                    itemProp="url"
                    data-verification-target="findly-tools"
                  >
                    <img 
                      src="https://findly.tools/badges/findly-tools-badge-light.svg" 
                      alt="Featured on findly.tools" 
                      className="h-12 w-auto object-contain"
                      itemProp="image"
                      loading="lazy"
                    />
                  </a>
                </div>
                
                <a href="https://turbo0.com/item/aspirelyai" target="_blank" rel="noopener noreferrer">
                  <img src="https://img.turbo0.com/badge-listed-light.svg" alt="Listed on Turbo0" className="h-12 w-auto object-contain" loading="lazy" />
                </a>
                
                <div itemProp="award" itemScope itemType="https://schema.org/Award">
                  <meta itemProp="name" content="Featured on Twelve Tools" />
                  <a 
                    href="https://twelve.tools" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    itemProp="url"
                    data-verification-target="twelve-tools"
                  >
                    <img 
                      src="https://twelve.tools/badge0-light.svg" 
                      alt="Featured on Twelve Tools" 
                      className="h-12 w-auto object-contain"
                      itemProp="image"
                      loading="lazy"
                    />
                  </a>
                </div>
                
                <a href="https://fazier.com/launches/aspirely-ai" target="_blank" rel="noopener noreferrer" className="col-span-2 md:col-span-1">
                  <img src="https://fazier.com/api/v1/public/badges/embed_image.svg?launch_id=5237&badge_type=daily&theme=neutral" className="h-12 w-auto object-contain mx-auto" alt="Fazier badge" loading="lazy" decoding="async" />
                </a>
              </div>
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
              
              
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
