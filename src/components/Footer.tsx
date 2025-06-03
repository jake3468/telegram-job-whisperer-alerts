
const Footer = () => {
  return (
    <footer className="bg-black py-12 px-4 border-t border-gray-900">
      <div className="max-w-6xl mx-auto text-center">
        <div className="flex flex-wrap justify-center items-center space-x-6 mb-6">
          <a 
            href="#" 
            className="text-gray-500 hover:text-white transition-colors duration-200 text-sm font-inter"
          >
            Privacy Policy
          </a>
          <span className="text-gray-700">•</span>
          <a 
            href="#" 
            className="text-gray-500 hover:text-white transition-colors duration-200 text-sm font-inter"
          >
            Terms of Service
          </a>
          <span className="text-gray-700">•</span>
          <a 
            href="#" 
            className="text-gray-500 hover:text-white transition-colors duration-200 text-sm font-inter"
          >
            Contact Support
          </a>
        </div>
        
        <p className="text-gray-600 text-sm font-inter">
          © 2025 JobBot. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
