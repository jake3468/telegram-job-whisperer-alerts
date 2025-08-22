
import { Link } from 'react-router-dom';

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
    <footer className="bg-black py-12 px-4 border-t border-gray-800">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-8">
          {/* Company Info */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <img alt="JobBots Logo" className="h-8 w-8" src="/lovable-uploads/d1063169-3726-4087-9672-b20c6091d9a4.jpg" />
              <span className="text-xl font-semibold text-white font-orbitron">Aspirely.ai</span>
            </div>
            <p className="text-gray-400 text-sm font-inter max-w-md">
              The AI-powered platform for finding and creating your perfect career path with advanced job matching and personalized guidance.
            </p>
          </div>

          {/* Product Section */}
          <div>
            <h3 className="text-white font-semibold text-sm font-inter mb-4">Product</h3>
            <div className="space-y-3">
              <button onClick={() => scrollToSection('features')} className="block text-gray-400 hover:text-sky-400 transition-colors duration-200 text-sm font-inter">
                Features
              </button>
              <button onClick={() => scrollToSection('how-it-works')} className="block text-gray-400 hover:text-sky-400 transition-colors duration-200 text-sm font-inter">
                How It Works
              </button>
              <button onClick={() => scrollToSection('pricing')} className="block text-gray-400 hover:text-sky-400 transition-colors duration-200 text-sm font-inter">
                Pricing
              </button>
            </div>
          </div>

          {/* Company Section */}
          <div>
            <h3 className="text-white font-semibold text-sm font-inter mb-4">Company</h3>
            <div className="space-y-3">
              <button onClick={() => scrollToSection('about-us')} className="block text-gray-400 hover:text-sky-400 transition-colors duration-200 text-sm font-inter">
                About Us
              </button>
              <Link to="/contact-support" className="block text-gray-400 hover:text-sky-400 transition-colors duration-200 text-sm font-inter">
                Contact Support
              </Link>
              <Link to="/blogs" className="block text-gray-400 hover:text-sky-400 transition-colors duration-200 text-sm font-inter" onClick={() => window.scrollTo(0, 0)}>
                Blogs
              </Link>
            </div>
          </div>

          {/* Legal Section - Using standard HTML anchor tags for better crawlability */}
          <div>
            <h3 className="text-white font-semibold text-sm font-inter mb-4">Legal</h3>
            <div className="space-y-3">
              <a href="/privacy-policy" className="block text-gray-400 hover:text-sky-400 transition-colors duration-200 text-sm font-inter">
                Privacy Policy
              </a>
              <a href="/terms-of-service" className="block text-gray-400 hover:text-sky-400 transition-colors duration-200 text-sm font-inter">
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
            <h3 className="text-white font-semibold text-sm font-inter">Featured on</h3>
            <div className="flex flex-col items-center space-y-3">
              <div itemProp="award" itemScope itemType="https://schema.org/Award">
                <meta itemProp="name" content="Featured on Startup Fame" />
                <a 
                  href="https://startupfa.me/s/aspirely.ai?utm_source=aspirely.ai" 
                  target="_blank"
                  rel="noopener noreferrer"
                  itemProp="url"
                  data-verification-target="startup-fame"
                >
                  <img 
                    src="https://startupfa.me/badges/featured/default-rounded.webp" 
                    alt="Featured on Startup Fame" 
                    width="171" 
                    height="54"
                    itemProp="image"
                  />
                </a>
              </div>
              
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
                    width="150"
                    itemProp="image"
                  />
                </a>
              </div>
              
              <div itemProp="award" itemScope itemType="https://schema.org/Award">
                <meta itemProp="name" content="Featured on Micro SaaS Examples" />
                <a 
                  href="https://www.microsaasexamples.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-sky-400 transition-colors duration-200 text-sm font-inter"
                  itemProp="url"
                  data-verification-target="microsaas-examples"
                >
                  Featured On Micro SaaS Examples
                </a>
              </div>
              
              <div itemProp="award" itemScope itemType="https://schema.org/Award">
                <meta itemProp="name" content="Listed on Turbo0" />
                <a 
                  href="https://turbo0.com/item/aspirelyai" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  itemProp="url"
                  data-verification-target="turbo0"
                >
                  <img 
                    src="https://img.turbo0.com/badge-listed-light.svg" 
                    alt="Listed on Turbo0" 
                    style={{height: '54px', width: 'auto'}}
                    itemProp="image"
                  />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t border-gray-800">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm font-inter mb-4 sm:mb-0">
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
