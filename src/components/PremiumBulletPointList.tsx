
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
      headerBg: 'bg-orange-100',
      contentBg: 'bg-gray-50',
      border: 'border-orange-300',
      headerText: 'text-orange-900',
      contentText: 'text-gray-800',
      icon: 'text-orange-600'
    },
    green: {
      primary: 'from-green-500 to-emerald-500',
      headerBg: 'bg-green-100',
      contentBg: 'bg-gray-50',
      border: 'border-green-300',
      headerText: 'text-green-900',
      contentText: 'text-gray-800',
      icon: 'text-green-600'
    },
    purple: {
      primary: 'from-purple-500 to-pink-500',
      headerBg: 'bg-purple-100',
      contentBg: 'bg-gray-50',
      border: 'border-purple-300',
      headerText: 'text-purple-900',
      contentText: 'text-gray-800',
      icon: 'text-purple-600'
    },
    blue: {
      primary: 'from-blue-500 to-cyan-500',
      headerBg: 'bg-blue-100',
      contentBg: 'bg-gray-50',
      border: 'border-blue-300',
      headerText: 'text-blue-900',
      contentText: 'text-gray-800',
      icon: 'text-blue-600'
    },
    yellow: {
      primary: 'from-yellow-500 to-orange-500',
      headerBg: 'bg-yellow-100',
      contentBg: 'bg-gray-50',
      border: 'border-yellow-300',
      headerText: 'text-yellow-900',
      contentText: 'text-gray-800',
      icon: 'text-yellow-600'
    },
    teal: {
      primary: 'from-teal-500 to-cyan-500',
      headerBg: 'bg-teal-100',
      contentBg: 'bg-gray-50',
      border: 'border-teal-300',
      headerText: 'text-teal-900',
      contentText: 'text-gray-800',
      icon: 'text-teal-600'
    },
    indigo: {
      primary: 'from-indigo-500 to-purple-500',
      headerBg: 'bg-indigo-100',
      contentBg: 'bg-gray-50',
      border: 'border-indigo-300',
      headerText: 'text-indigo-900',
      contentText: 'text-gray-800',
      icon: 'text-indigo-600'
    },
    pink: {
      primary: 'from-pink-500 to-rose-500',
      headerBg: 'bg-pink-100',
      contentBg: 'bg-gray-50',
      border: 'border-pink-300',
      headerText: 'text-pink-900',
      contentText: 'text-gray-800',
      icon: 'text-pink-600'
    },
    violet: {
      primary: 'from-violet-500 to-purple-500',
      headerBg: 'bg-violet-100',
      contentBg: 'bg-gray-50',
      border: 'border-violet-300',
      headerText: 'text-violet-900',
      contentText: 'text-gray-800',
      icon: 'text-violet-600'
    }
  };

  const currentTheme = themeConfig[theme] || themeConfig.blue;

  const getItemIcon = (item: string, index: number) => {
    const itemLower = item.toLowerCase();
    if (itemLower.includes('positive') || itemLower.includes('good') || itemLower.includes('strong') || itemLower.includes('growth')) {
      return <CheckCircle className={`w-3 h-3 ${currentTheme.icon} flex-shrink-0`} />;
    }
    if (itemLower.includes('negative') || itemLower.includes('risk') || itemLower.includes('concern') || itemLower.includes('decline')) {
      return <AlertCircle className="w-3 h-3 text-red-500 flex-shrink-0" />;
    }
    if (itemLower.includes('trend') || itemLower.includes('increase') || itemLower.includes('improve')) {
      return <TrendingUp className={`w-3 h-3 ${currentTheme.icon} flex-shrink-0`} />;
    }
    if (itemLower.includes('opportunity') || itemLower.includes('potential')) {
      return <Target className={`w-3 h-3 ${currentTheme.icon} flex-shrink-0`} />;
    }
    if (itemLower.includes('insight') || itemLower.includes('analysis')) {
      return <Lightbulb className={`w-3 h-3 ${currentTheme.icon} flex-shrink-0`} />;
    }
    
    const icons = [Star, Award, Target, Lightbulb, TrendingUp];
    const IconComponent = icons[index % icons.length];
    return <IconComponent className={`w-3 h-3 ${currentTheme.icon} flex-shrink-0`} />;
  };

  const getItemStyle = (item: string)  => {
    const itemLower = item.toLowerCase();
    if (itemLower.includes('negative') || itemLower.includes('risk') || itemLower.includes('concern') || itemLower.includes('decline')) {
      return 'border-red-300 bg-red-50 hover:bg-red-100';
    }
    return `${currentTheme.border} ${currentTheme.contentBg} hover:bg-gray-100`;
  };

  return (
    <div className="w-full space-y-1 min-w-0">
      {title && (
        <div className="w-full flex items-center gap-2 mb-2 min-w-0">
          <div className={`w-1 h-4 bg-gradient-to-b ${currentTheme.primary} rounded-full flex-shrink-0`} />
          <h4 className={`text-xs font-bold ${currentTheme.headerText} break-words hyphens-auto`}>{title}</h4>
        </div>
      )}
      <div className="w-full space-y-1 min-w-0">
        {items.map((item, index) => (
          <div
            key={index}
            className={`w-full flex items-start gap-2 p-2 rounded border transition-all duration-300 min-w-0 ${getItemStyle(item)}`}
          >
            <div className="p-1 bg-white rounded shadow-sm flex-shrink-0">
              {getItemIcon(item, index)}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`${currentTheme.contentText} leading-relaxed font-medium text-xs break-words break-all hyphens-auto`}>
                {item}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
