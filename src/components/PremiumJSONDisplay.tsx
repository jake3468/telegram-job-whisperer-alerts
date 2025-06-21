
import React from 'react';
import { CheckCircle, AlertTriangle, ChevronRight, Star, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface PremiumJSONDisplayProps {
  data: any;
  theme?: 'blue' | 'green' | 'purple' | 'yellow' | 'orange' | 'teal' | 'indigo' | 'pink' | 'violet';
}

export const PremiumJSONDisplay: React.FC<PremiumJSONDisplayProps> = ({ data, theme = 'blue' }) => {
  if (!data) return null;

  const getThemeClasses = (theme: string) => {
    const themes = {
      blue: {
        gradient: 'from-blue-50 to-indigo-50',
        border: 'border-blue-500',
        text: 'text-blue-800',
        accent: 'text-blue-600',
        redFlag: 'bg-red-50 border-red-200 text-red-800',
        positiveFlag: 'bg-green-50 border-green-200 text-green-800'
      },
      green: {
        gradient: 'from-green-50 to-emerald-50',
        border: 'border-green-500',
        text: 'text-green-800',
        accent: 'text-green-600',
        redFlag: 'bg-red-50 border-red-200 text-red-800',
        positiveFlag: 'bg-green-50 border-green-200 text-green-800'
      },
      purple: {
        gradient: 'from-purple-50 to-pink-50',
        border: 'border-purple-500',
        text: 'text-purple-800',
        accent: 'text-purple-600',
        redFlag: 'bg-red-50 border-red-200 text-red-800',
        positiveFlag: 'bg-green-50 border-green-200 text-green-800'
      },
      yellow: {
        gradient: 'from-yellow-50 to-orange-50',
        border: 'border-yellow-500',
        text: 'text-yellow-800',
        accent: 'text-yellow-600',
        redFlag: 'bg-red-50 border-red-200 text-red-800',
        positiveFlag: 'bg-green-50 border-green-200 text-green-800'
      },
      orange: {
        gradient: 'from-orange-50 to-red-50',
        border: 'border-orange-500',
        text: 'text-orange-800',
        accent: 'text-orange-600',
        redFlag: 'bg-red-50 border-red-200 text-red-800',
        positiveFlag: 'bg-green-50 border-green-200 text-green-800'
      },
      teal: {
        gradient: 'from-teal-50 to-cyan-50',
        border: 'border-teal-500',
        text: 'text-teal-800',
        accent: 'text-teal-600',
        redFlag: 'bg-red-50 border-red-200 text-red-800',
        positiveFlag: 'bg-green-50 border-green-200 text-green-800'
      },
      indigo: {
        gradient: 'from-indigo-50 to-purple-50',
        border: 'border-indigo-500',
        text: 'text-indigo-800',
        accent: 'text-indigo-600',
        redFlag: 'bg-red-50 border-red-200 text-red-800',
        positiveFlag: 'bg-green-50 border-green-200 text-green-800'
      },
      pink: {
        gradient: 'from-pink-50 to-rose-50',
        border: 'border-pink-500',
        text: 'text-pink-800',
        accent: 'text-pink-600',
        redFlag: 'bg-red-50 border-red-200 text-red-800',
        positiveFlag: 'bg-green-50 border-green-200 text-green-800'
      },
      violet: {
        gradient: 'from-violet-50 to-purple-50',
        border: 'border-violet-500',
        text: 'text-violet-800',
        accent: 'text-violet-600',
        redFlag: 'bg-red-50 border-red-200 text-red-800',
        positiveFlag: 'bg-green-50 border-green-200 text-green-800'
      }
    };
    return themes[theme] || themes.blue;
  };

  const themeClasses = getThemeClasses(theme);

  const renderValue = (key: string, value: any, level: number = 0): React.ReactNode => {
    if (value === null || value === undefined) return null;

    const isRedFlag = key.toLowerCase().includes('red_flags') || key.toLowerCase().includes('redflag') || key.toLowerCase().includes('red flag');
    const isPositiveIndicator = key.toLowerCase().includes('positive_indicators') || key.toLowerCase().includes('positive') || key.toLowerCase().includes('benefit');

    if (Array.isArray(value)) {
      if (value.length === 0) return null;
      
      return (
        <div className="space-y-2">
          <h4 className={`font-bold text-xs mb-2 ${themeClasses.text} capitalize`}>
            {key.replace(/_/g, ' ')}
          </h4>
          <div className="space-y-2">
            {value.map((item, index) => (
              <div 
                key={index} 
                className={`flex items-start gap-2 p-2 rounded-lg border-l-2 transition-all duration-200 text-xs ${
                  isRedFlag 
                    ? themeClasses.redFlag 
                    : isPositiveIndicator 
                      ? themeClasses.positiveFlag 
                      : `bg-gradient-to-r ${themeClasses.gradient} border-l-4 ${themeClasses.border}`
                }`}
              >
                {isRedFlag ? (
                  <AlertTriangle className="w-3 h-3 text-red-500 flex-shrink-0 mt-0.5" />
                ) : isPositiveIndicator ? (
                  <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <ChevronRight className={`w-3 h-3 ${themeClasses.accent} flex-shrink-0 mt-0.5`} />
                )}
                <span className="leading-relaxed break-words hyphens-auto overflow-wrap-anywhere">
                  {typeof item === 'string' ? item : JSON.stringify(item)}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (typeof value === 'object' && value !== null) {
      return (
        <div className="space-y-3">
          <h4 className={`font-bold text-xs mb-2 ${themeClasses.text} capitalize`}>
            {key.replace(/_/g, ' ')}
          </h4>
          <div className="space-y-2 pl-2">
            {Object.entries(value).map(([subKey, subValue]) => (
              <div key={subKey}>
                {renderValue(subKey, subValue, level + 1)}
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (typeof value === 'string' || typeof value === 'number') {
      return (
        <div className={`bg-gradient-to-r ${themeClasses.gradient} rounded-lg p-2 border-l-4 ${themeClasses.border}`}>
          <h4 className={`font-bold ${themeClasses.text} text-xs mb-1 capitalize`}>
            {key.replace(/_/g, ' ')}
          </h4>
          <p className="text-gray-700 leading-relaxed text-xs break-words hyphens-auto overflow-wrap-anywhere">
            {value.toString()}
          </p>
        </div>
      );
    }

    return null;
  };

  return (
    <Card className="w-full bg-white shadow-lg border-0 rounded-lg overflow-hidden">
      <CardContent className="p-2 w-full space-y-3">
        {Object.entries(data).map(([key, value]) => (
          <div key={key}>
            {renderValue(key, value)}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
