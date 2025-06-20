
import React from 'react';

interface PercentageMeterProps {
  score: number | null;
  label: string;
  className?: string;
}

export const PercentageMeter: React.FC<PercentageMeterProps> = ({ score, label, className = '' }) => {
  if (score === null || score === undefined) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-300">{label}</span>
          <span className="text-sm text-gray-400">N/A</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div className="bg-gray-600 h-2 rounded-full w-0"></div>
        </div>
      </div>
    );
  }

  // Calculate color based on score (0-100)
  const getColor = (value: number) => {
    if (value <= 25) return 'bg-red-500';
    if (value <= 50) return 'bg-yellow-500';
    if (value <= 75) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getGradientColor = (value: number) => {
    if (value <= 25) return 'from-red-600 to-red-400';
    if (value <= 50) return 'from-yellow-600 to-yellow-400';
    if (value <= 75) return 'from-orange-600 to-orange-400';
    return 'from-green-600 to-green-400';
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-white">{label}</span>
        <span className="text-sm font-bold text-white">{score}%</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
        <div 
          className={`h-3 rounded-full bg-gradient-to-r ${getGradientColor(score)} transition-all duration-500 ease-out`}
          style={{ width: `${score}%` }}
        ></div>
      </div>
    </div>
  );
};
