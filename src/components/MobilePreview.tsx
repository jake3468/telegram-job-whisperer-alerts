const MobilePreview = () => {
  return (
    <div className="relative flex justify-center items-center">
      {/* Mobile Device Frame - Made larger */}
      <div className="relative w-80 h-[650px] bg-black rounded-[2.5rem] shadow-2xl border-8 border-gray-800">
        {/* Screen Bezel */}
        <div className="absolute inset-2 bg-gray-900 rounded-[2rem] overflow-hidden">
          {/* Notch */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 h-6 bg-black rounded-b-2xl z-10"></div>
          
          {/* Screen Content - App Interface */}
          <div className="w-full h-full bg-gradient-to-br from-slate-900 via-gray-900 to-black p-6 pt-10 flex flex-col">
            {/* Status Bar Space */}
            <div className="h-4 mb-4"></div>
            
            {/* App Header */}
            <div className="text-center mb-6">
              <h1 className="text-white text-lg font-bold mb-2">Aspirely AI</h1>
              <p className="text-gray-300 text-xs leading-relaxed">Your AI-powered career assistant</p>
            </div>
            
            {/* Feature Cards */}
            <div className="space-y-4 flex-1">
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-lg">📝</span>
                  <span className="text-white text-sm font-medium">Resume Builder</span>
                </div>
                <p className="text-gray-400 text-xs">AI-enhanced resume optimization</p>
              </div>
              
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-lg">🎯</span>
                  <span className="text-white text-sm font-medium">Job Matching</span>
                </div>
                <p className="text-gray-400 text-xs">Find perfect job opportunities</p>
              </div>
              
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-lg">📋</span>
                  <span className="text-white text-sm font-medium">Cover Letters</span>
                </div>
                <p className="text-gray-400 text-xs">Tailored for each application</p>
              </div>
              
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-lg">🤝</span>
                  <span className="text-white text-sm font-medium">Interview Prep</span>
                </div>
                <p className="text-gray-400 text-xs">Practice with AI-powered questions</p>
              </div>
            </div>
            
            {/* CTA Button */}
            <div className="mt-4">
              <button className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 rounded-xl text-sm font-medium">
                Get Started
              </button>
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