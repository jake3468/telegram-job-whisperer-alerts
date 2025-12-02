import React from 'react';

interface AuroraBackgroundProps {
  children?: React.ReactNode;
}

export const AuroraBackground: React.FC<AuroraBackgroundProps> = ({ children }) => {
  return (
    <div className="relative w-full h-full">
      {/* Aurora gradient blobs */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        {/* Blob 1 - Sky Blue */}
        <div
          className="absolute top-0 -left-4 w-96 h-96 bg-[#38bdf8] rounded-full opacity-[0.08] blur-3xl animate-aurora-drift-1"
          style={{ willChange: 'transform' }}
        />
        
        {/* Blob 2 - Cyan */}
        <div
          className="absolute top-1/4 right-0 w-[32rem] h-[32rem] bg-[#22d3ee] rounded-full opacity-[0.06] blur-3xl animate-aurora-drift-2"
          style={{ willChange: 'transform' }}
        />
        
        {/* Blob 3 - Soft Purple */}
        <div
          className="absolute bottom-0 left-1/4 w-[28rem] h-[28rem] bg-[#a78bfa] rounded-full opacity-[0.06] blur-3xl animate-aurora-drift-3"
          style={{ willChange: 'transform' }}
        />
        
        {/* Blob 4 - Mint */}
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#34d399] rounded-full opacity-[0.05] blur-3xl animate-aurora-drift-1"
          style={{ 
            willChange: 'transform',
            animationDelay: '5s'
          }}
        />
      </div>
      
      {/* Content */}
      {children}
    </div>
  );
};
