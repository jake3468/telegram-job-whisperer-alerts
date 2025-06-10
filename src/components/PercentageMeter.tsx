
import { Progress } from '@/components/ui/progress';

interface PercentageMeterProps {
  percentage: string;
  className?: string;
}

const PercentageMeter = ({ percentage, className = '' }: PercentageMeterProps) => {
  // Parse percentage value (e.g., "85%" -> 85)
  const numericValue = parseInt(percentage.replace('%', ''), 10) || 0;
  
  // Determine color based on percentage
  const getColor = (value: number) => {
    if (value >= 80) return 'bg-green-500';
    if (value >= 60) return 'bg-yellow-500';
    if (value >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getGradientColor = (value: number) => {
    if (value >= 80) return 'from-green-600 to-green-400';
    if (value >= 60) return 'from-yellow-600 to-yellow-400';
    if (value >= 40) return 'from-orange-600 to-orange-400';
    return 'from-red-600 to-red-400';
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-white font-inter text-sm font-medium">Match Score</span>
        <span className={`text-lg font-bold font-inter ${
          numericValue >= 80 ? 'text-green-400' :
          numericValue >= 60 ? 'text-yellow-400' :
          numericValue >= 40 ? 'text-orange-400' :
          'text-red-400'
        }`}>
          {percentage}
        </span>
      </div>
      
      <div className="relative">
        <Progress 
          value={numericValue} 
          className="h-6 bg-gray-700 border border-white/20"
        />
        <div 
          className={`absolute top-0 left-0 h-full rounded-full bg-gradient-to-r ${getGradientColor(numericValue)} transition-all duration-500`}
          style={{ width: `${numericValue}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-white font-inter drop-shadow-lg">
            {percentage}
          </span>
        </div>
      </div>
      
      <div className="flex justify-between text-xs text-gray-400 font-inter">
        <span>0%</span>
        <span>Poor</span>
        <span>Good</span>
        <span>Excellent</span>
        <span>100%</span>
      </div>
    </div>
  );
};

export default PercentageMeter;
