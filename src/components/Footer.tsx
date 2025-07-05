
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-black py-12 px-4 border-t border-gray-800">
      <div className="max-w-6xl mx-auto text-center">
        <div className="flex justify-center items-center mb-8 space-x-3">
          <img alt="JobBots Logo" className="h-8 w-8" src="/lovable-uploads/d1063169-3726-4087-9672-b20c6091d9a4.jpg" />
          <span className="text-xl font-semibold text-white font-orbitron">Aspirely.ai</span>
        </div>

        <div className="flex flex-wrap justify-center items-center space-x-4 sm:space-x-6 mb-6">
          <Link to="/blogs" className="text-gray-400 hover:text-sky-400 transition-colors duration-200 text-sm font-inter">
            Blogs
          </Link>
          <span className="text-gray-700 hidden sm:inline">•</span>
          <Link to="/privacy-policy" className="text-gray-400 hover:text-sky-400 transition-colors duration-200 text-sm font-inter">
            Privacy Policy
          </Link>
          <span className="text-gray-700 hidden sm:inline">•</span>
          <Link to="/terms-of-service" className="text-gray-400 hover:text-sky-400 transition-colors duration-200 text-sm font-inter">
            Terms of Service
          </Link>
          <span className="text-gray-700 hidden sm:inline">•</span>
          <Link to="/contact-support" className="text-gray-400 hover:text-sky-400 transition-colors duration-200 text-sm font-inter">
            Contact Support
          </Link>
        </div>
        
        <p className="text-gray-500 text-sm font-inter">
          © {new Date().getFullYear()} Aspirely.ai All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
