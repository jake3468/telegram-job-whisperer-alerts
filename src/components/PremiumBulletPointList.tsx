
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
      return <CheckCircle className={`w-4 h-4 ${currentTheme.icon}`} />;
    }
    if (itemLower.includes('negative') || itemLower.includes('risk') || itemLower.includes('concern') || itemLower.includes('decline')) {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
    if (itemLower.includes('trend') || itemLower.includes('increase') || itemLower.includes('improve')) {
      return <TrendingUp className={`w-4 h-4 ${currentTheme.icon}`} />;
    }
    if (itemLower.includes('opportunity') || itemLower.includes('potential')) {
      return <Target className={`w-4 h-4 ${currentTheme.icon}`} />;
    }
    if (itemLower.includes('insight') || itemLower.includes('analysis')) {
      return <Lightbulb className={`w-4 h-4 ${currentTheme.icon}`} />;
    }
    
    const icons = [Star, Award, Target, Lightbulb, TrendingUp];
    const IconComponent = icons[index % icons.length];
    return <IconComponent className={`w-4 h-4 ${currentTheme.icon}`} />;
  };

  const getItemStyle = (item: string) => {
    const itemLower = item.toLowerCase();
    if (itemLower.includes('negative') || itemLower.includes('risk') || itemLower.includes('concern') || itemLower.includes('decline')) {
      return 'border-red-200 bg-gradient-to-r from-red-50 to-pink-50 hover:from-red-100 hover:to-pink-100';
    }
    return `border-l-4 ${currentTheme.border} bg-gradient-to-r ${currentTheme.bg} hover:shadow-md`;
  };

  return (
    <div className="w-full space-y-3">
      {title && (
        <div className="flex items-center gap-2 mb-4">
          <div className={`w-1 h-6 bg-gradient-to-b ${currentTheme.primary} rounded-full`} />
          <h4 className={`text-base font-bold ${currentTheme.text}`}>{title}</h4>
        </div>
      )}
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 p-4 rounded-lg border transition-all duration-300 ${getItemStyle(item)}`}
          >
            <div className="p-2 bg-white rounded-lg shadow-sm flex-shrink-0 mt-1">
              {getItemIcon(item, index)}
            </div>
            <div className="flex-1">
              <p className="text-gray-700 leading-relaxed font-medium text-sm md:text-base">
                {item}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
