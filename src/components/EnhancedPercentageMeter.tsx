
import React from 'react';
import { TrendingUp, TrendingDown, Minus, Award, AlertTriangle } from 'lucide-react';

interface EnhancedPercentageMeterProps {
  score: number;
  label: string;
  maxScore?: number;
  theme?: 'green' | 'purple' | 'blue' | 'yellow' | 'orange' | 'teal' | 'indigo' | 'pink' | 'violet';
}

export const EnhancedPercentageMeter: React.FC<EnhancedPercentageMeterProps> = ({ 
  score, 
  label, 
  maxScore = 100,
  theme = 'green'
}) => {
  const percentage = Math.min(Math.max((score / maxScore) * 100, 0), 100);
  
  const themeConfig = {
    green: {
      gradient: 'from-green-400 via-green-500 to-green-600',
      bg: 'from-green-50 to-emerald-50',
      text: 'text-green-700',
      border: 'border-green-200',
      excellent: 'text-green-600',
      good: 'text-blue-600',
      average: 'text-yellow-600',
      poor: 'text-red-600'
    },
    purple: {
      gradient: 'from-purple-400 via-purple-500 to-purple-600',
      bg: 'from-purple-50 to-pink-50',
      text: 'text-purple-700',
      border: 'border-purple-200',
      excellent: 'text-purple-600',
      good: 'text-blue-600',
      average: 'text-yellow-600',
      poor: 'text-red-600'
    },
    blue: {
      gradient: 'from-blue-400 via-blue-500 to-blue-600',
      bg: 'from-blue-50 to-cyan-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      excellent: 'text-blue-600',
      good: 'text-green-600',
      average: 'text-yellow-600',
      poor: 'text-red-600'
    }
  };

  const currentTheme = themeConfig[theme] || themeConfig.green;

  const getScoreColor = (percent: number) => {
    if (percent >= 80) return currentTheme.excellent;
    if (percent >= 60) return currentTheme.good;
    if (percent >= 40) return currentTheme.average;
    return currentTheme.poor;
  };

  const getScoreIcon = (percent: number) => {
    if (percent >= 80) return <Award className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />;
    if (percent >= 60) return <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />;
    if (percent >= 40) return <Minus className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />;
    return <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />;
  };

  const getScoreDescription = (percent: number) => {
    if (percent >= 80) return 'Excellent';
    if (percent >= 60) return 'Good';
    if (percent >= 40) return 'Average';
    return 'Needs Attention';
  };

  const getScoreBadgeColor = (percent: number) => {
    if (percent >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (percent >= 60) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (percent >= 40) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  return (
    <div className={`w-full bg-gradient-to-r ${currentTheme.bg} rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 border ${currentTheme.border} shadow-md`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 sm:mb-3 gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
          <div className="p-1 sm:p-1.5 bg-white rounded-md sm:rounded-lg shadow-sm flex-shrink-0">
            {getScoreIcon(percentage)}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className={`text-xs sm:text-sm font-bold ${currentTheme.text} break-words leading-tight`}>{label}</h3>
            <p className="text-gray-600 text-xs">Performance Metric</p>
          </div>
        </div>
        <div className="text-center sm:text-right flex-shrink-0">
          <div className={`text-lg sm:text-xl font-bold ${getScoreColor(percentage)} mb-0.5`}>
            {score}%
          </div>
          <div className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full border text-xs font-medium ${getScoreBadgeColor(percentage)}`}>
            {getScoreDescription(percentage)}
          </div>
        </div>
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between text-xs font-medium text-gray-600">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
        <div className="relative h-2 bg-white rounded-full shadow-inner overflow-hidden border">
          <div 
            className={`absolute top-0 left-0 h-full bg-gradient-to-r ${currentTheme.gradient} rounded-full transition-all duration-1000 ease-out shadow-sm`}
            style={{ width: `${percentage}%` }}
          >
            <div className="absolute inset-0 bg-white/30 rounded-full animate-pulse" />
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-white rounded-full shadow-sm border border-current" />
          </div>
        </div>
        <div className="flex justify-center">
          <span className="text-xs text-gray-500 bg-white px-1.5 py-0.5 rounded-full shadow-sm">
            {percentage.toFixed(1)}% Achievement Rate
          </span>
        </div>
      </div>
    </div>
  );
};
