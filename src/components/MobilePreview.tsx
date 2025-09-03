const MobilePreview = () => {
  return (
    <div className="relative flex justify-center items-center">
      {/* Mobile Device Frame */}
      <div className="relative w-64 h-[500px] bg-black rounded-[2.5rem] shadow-2xl border-8 border-gray-800">
        {/* Screen Bezel */}
        <div className="absolute inset-2 bg-gray-900 rounded-[2rem] overflow-hidden">
          {/* Notch */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 h-6 bg-black rounded-b-2xl z-10"></div>
          
          {/* Screen Content - Empty for now, video will be added here */}
          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
            <div className="text-gray-500 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-700 rounded-2xl flex items-center justify-center">
                <div className="w-8 h-8 bg-gray-600 rounded-lg animate-pulse"></div>
              </div>
              <p className="text-sm">Video Preview</p>
            </div>
          </div>
        </div>
        
        {/* Home Indicator */}
        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gray-700 rounded-full"></div>
      </div>
      
      {/* Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-[2.5rem] blur-xl scale-110 -z-10"></div>
    </div>
  );
};

export default MobilePreview;