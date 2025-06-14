
const Footer = () => {
  return (
    <footer className="bg-black py-12 px-4 border-t border-gray-800">
      <div className="max-w-6xl mx-auto text-center">
        <div className="flex justify-center items-center mb-8 space-x-3">
          <img src="/lovable-uploads/00756136-40e8-4357-b19a-582e8625b09d.png" alt="JobBots Logo" className="h-8 w-8" />
          <span className="text-xl font-semibold text-white font-inter">JobBots</span>
        </div>

        <div className="flex flex-wrap justify-center items-center space-x-4 sm:space-x-6 mb-6">
          <a 
            href="#" 
            className="text-gray-400 hover:text-sky-400 transition-colors duration-200 text-sm font-inter"
          >
            Privacy Policy
          </a>
          <span className="text-gray-700 hidden sm:inline">•</span>
          <a 
            href="#" 
            className="text-gray-400 hover:text-sky-400 transition-colors duration-200 text-sm font-inter"
          >
            Terms of Service
          </a>
          <span className="text-gray-700 hidden sm:inline">•</span>
          <a 
            href="#" 
            className="text-gray-400 hover:text-sky-400 transition-colors duration-200 text-sm font-inter"
          >
            Contact Support
          </a>
        </div>
        
        <p className="text-gray-500 text-sm font-inter">
          © {new Date().getFullYear()} JobBots. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
