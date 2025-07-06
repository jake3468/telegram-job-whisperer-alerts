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
  return <footer className="bg-black py-12 px-4 border-t border-gray-800">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
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
                Contact
              </Link>
              <Link to="/privacy-policy" className="block text-gray-400 hover:text-sky-400 transition-colors duration-200 text-sm font-inter">
                Privacy
              </Link>
              <Link to="/terms-of-service" className="block text-gray-400 hover:text-sky-400 transition-colors duration-200 text-sm font-inter">
                Terms of use
              </Link>
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
              <Link to="/blogs" className="text-gray-400 hover:text-sky-400 transition-colors duration-200 text-sm font-inter" onClick={() => window.scrollTo(0, 0)}>
                Blogs
              </Link>
              
              
            </div>
          </div>
        </div>
      </div>
    </footer>;
};
export default Footer;