
import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PercentageMeterProps {
  score: number;
  label: string;
  maxScore?: number;
}

export const PercentageMeter: React.FC<PercentageMeterProps> = ({ 
  score, 
  label, 
  maxScore = 100 
}) => {
  const percentage = Math.min(Math.max((score / maxScore) * 100, 0), 100);
  
  const getScoreColor = (percent: number) => {
    if (percent >= 80) return 'text-green-400';
    if (percent >= 60) return 'text-blue-400';
    if (percent >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getProgressColor = (percent: number) => {
    if (percent >= 80) return 'from-green-500 to-green-600';
    if (percent >= 60) return 'from-blue-500 to-blue-600';
    if (percent >= 40) return 'from-yellow-500 to-yellow-600';
    return 'from-red-500 to-red-600';
  };

  const getScoreIcon = (percent: number) => {
    if (percent >= 70) return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (percent >= 40) return <Minus className="w-4 h-4 text-yellow-400" />;
    return <TrendingDown className="w-4 h-4 text-red-400" />;
  };

  const getScoreDescription = (percent: number) => {
    if (percent >= 80) return 'Excellent';
    if (percent >= 60) return 'Good';
    if (percent >= 40) return 'Average';
    return 'Needs Attention';
  };

  return (
    <div className="space-y-3 p-4 bg-gradient-to-br from-gray-800/30 to-gray-800/10 rounded-lg border border-gray-700/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getScoreIcon(percentage)}
          <span className="text-sm font-medium text-gray-300">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xl font-bold ${getScoreColor(percentage)}`}>
            {score}%
          </span>
          <span className="text-xs text-gray-400 bg-gray-800/50 px-2 py-1 rounded-full">
            {getScoreDescription(percentage)}
          </span>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-gray-400">
          <span>0%</span>
          <span>100%</span>
        </div>
        <div className="relative h-3 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className={`absolute top-0 left-0 h-full bg-gradient-to-r ${getProgressColor(percentage)} rounded-full transition-all duration-1000 ease-out shadow-lg`}
            style={{ width: `${percentage}%` }}
          >
            <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-full" />
        </div>
      </div>
    </div>
  );
};
