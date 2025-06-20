
import React from 'react';
import { CheckCircle, AlertCircle, Info, TrendingUp, Star, Award, Target, Lightbulb } from 'lucide-react';

interface PremiumBulletPointListProps {
  items: string[];
  title?: string;
  theme?: 'orange' | 'green' | 'purple' | 'blue' | 'yellow' | 'teal' | 'indigo' | 'pink' | 'violet';
}

export const PremiumBulletPointList: React.FC<PremiumBulletPointListProps> = ({ 
  items, 
  title,
  theme = 'blue'
}) => {
  if (!items || items.length === 0) return null;

  const themeConfig = {
    orange: {
      primary: 'from-orange-500 to-red-500',
      bg: 'from-orange-50 to-red-50',
      border: 'border-orange-200',
      text: 'text-orange-800',
      icon: 'text-orange-600'
    },
    green: {
      primary: 'from-green-500 to-emerald-500',
      bg: 'from-green-50 to-emerald-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: 'text-green-600'
    },
    purple: {
      primary: 'from-purple-500 to-pink-500',
      bg: 'from-purple-50 to-pink-50',
      border: 'border-purple-200',
      text: 'text-purple-800',
      icon: 'text-purple-600'
    },
    blue: {
      primary: 'from-blue-500 to-cyan-500',
      bg: 'from-blue-50 to-cyan-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: 'text-blue-600'
    }
  };

  const currentTheme = themeConfig[theme] || themeConfig.blue;

  const getItemIcon = (item: string, index: number) => {
    const itemLower = item.toLowerCase();
    if (itemLower.includes('positive') || itemLower.includes('good') || itemLower.includes('strong') || itemLower.includes('growth')) {
      return <CheckCircle className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${currentTheme.icon} flex-shrink-0`} />;
    }
    if (itemLower.includes('negative') || itemLower.includes('risk') || itemLower.includes('concern') || itemLower.includes('decline')) {
      return <AlertCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-500 flex-shrink-0" />;
    }
    if (itemLower.includes('trend') || itemLower.includes('increase') || itemLower.includes('improve')) {
      return <TrendingUp className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${currentTheme.icon} flex-shrink-0`} />;
    }
    if (itemLower.includes('opportunity') || itemLower.includes('potential')) {
      return <Target className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${currentTheme.icon} flex-shrink-0`} />;
    }
    if (itemLower.includes('insight') || itemLower.includes('analysis')) {
      return <Lightbulb className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${currentTheme.icon} flex-shrink-0`} />;
    }
    
    // Default icons based on position
    const icons = [Star, Award, Target, Lightbulb, TrendingUp];
    const IconComponent = icons[index % icons.length];
    return <IconComponent className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${currentTheme.icon} flex-shrink-0`} />;
  };

  const getItemStyle = (item: string) => {
    const itemLower = item.toLowerCase();
    if (itemLower.includes('negative') || itemLower.includes('risk') || itemLower.includes('concern') || itemLower.includes('decline')) {
      return 'border-red-200 bg-gradient-to-r from-red-50 to-pink-50 hover:from-red-100 hover:to-pink-100';
    }
    return `border-l-2 ${currentTheme.border} bg-gradient-to-r ${currentTheme.bg} hover:shadow-sm`;
  };

  return (
    <div className="w-full space-y-1.5 sm:space-y-2">
      {title && (
        <div className="flex items-center gap-1.5 mb-2 sm:mb-3">
          <div className={`w-0.5 h-3 sm:h-4 bg-gradient-to-b ${currentTheme.primary} rounded-full flex-shrink-0`} />
          <h4 className={`text-xs sm:text-sm font-bold ${currentTheme.text} break-words`}>{title}</h4>
        </div>
      )}
      <div className="grid gap-1.5 sm:gap-2">
        {items.map((item, index) => (
          <div
            key={index}
            className={`group flex items-start gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-md sm:rounded-lg border transition-all duration-300 ${getItemStyle(item)}`}
          >
            <div className="p-0.5 sm:p-1 bg-white rounded-sm sm:rounded-md shadow-sm group-hover:shadow-md transition-shadow flex-shrink-0">
              {getItemIcon(item, index)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-700 leading-relaxed font-medium text-xs break-words">
                {item}
              </p>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <div className={`w-1 h-1 bg-gradient-to-r ${currentTheme.primary} rounded-full`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
