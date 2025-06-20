
import React from 'react';
import { DollarSign, TrendingUp, AlertCircle, CheckCircle, Info, Star, Award, Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface PremiumJSONDisplayProps {
  data: any;
  theme?: 'yellow' | 'teal' | 'indigo' | 'pink' | 'violet' | 'green' | 'blue';
}

export const PremiumJSONDisplay: React.FC<PremiumJSONDisplayProps> = ({ data, theme = 'blue' }) => {
  if (!data) return null;

  const themeConfig = {
    yellow: {
      primary: 'from-yellow-500 to-orange-500',
      bg: 'from-yellow-50 to-orange-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      accent: 'text-yellow-600',
      keyBg: 'bg-yellow-100',
      valueBg: 'bg-white'
    },
    teal: {
      primary: 'from-teal-500 to-cyan-500',
      bg: 'from-teal-50 to-cyan-50',
      border: 'border-teal-200',
      text: 'text-teal-800',
      accent: 'text-teal-600',
      keyBg: 'bg-teal-100',
      valueBg: 'bg-white'
    },
    indigo: {
      primary: 'from-indigo-500 to-purple-500',
      bg: 'from-indigo-50 to-purple-50',
      border: 'border-indigo-200',
      text: 'text-indigo-800',
      accent: 'text-indigo-600',
      keyBg: 'bg-indigo-100',
      valueBg: 'bg-white'
    },
    pink: {
      primary: 'from-pink-500 to-rose-500',
      bg: 'from-pink-50 to-rose-50',
      border: 'border-pink-200',
      text: 'text-pink-800',
      accent: 'text-pink-600',
      keyBg: 'bg-pink-100',
      valueBg: 'bg-white'
    },
    violet: {
      primary: 'from-violet-500 to-purple-500',
      bg: 'from-violet-50 to-purple-50',
      border: 'border-violet-200',
      text: 'text-violet-800',
      accent: 'text-violet-600',
      keyBg: 'bg-violet-100',
      valueBg: 'bg-white'
    }
  };

  const currentTheme = themeConfig[theme] || themeConfig.yellow;

  const formatCurrency = (value: string) => {
    const numMatch = value.match(/(\d+(?:,\d+)*(?:\.\d+)?)/);
    if (numMatch) {
      return value.replace(numMatch[0], `₹${numMatch[0]}`);
    }
    return value;
  };

  const getStatusIcon = (key: string, value: any) => {
    const keyLower = key.toLowerCase();
    if (keyLower.includes('positive') || keyLower.includes('good') || keyLower.includes('strong') || keyLower.includes('benefit')) {
      return <CheckCircle className="w-2 h-2 text-green-500 flex-shrink-0" />;
    }
    if (keyLower.includes('negative') || keyLower.includes('risk') || keyLower.includes('concern') || keyLower.includes('challenge')) {
      return <AlertCircle className="w-2 h-2 text-red-500 flex-shrink-0" />;
    }
    if (keyLower.includes('salary') || keyLower.includes('compensation') || keyLower.includes('bonus') || keyLower.includes('pay')) {
      return <DollarSign className={`w-2 h-2 ${currentTheme.accent} flex-shrink-0`} />;
    }
    if (keyLower.includes('growth') || keyLower.includes('development') || keyLower.includes('advancement')) {
      return <TrendingUp className={`w-2 h-2 ${currentTheme.accent} flex-shrink-0`} />;
    }
    if (keyLower.includes('opportunity') || keyLower.includes('potential')) {
      return <Target className={`w-2 h-2 ${currentTheme.accent} flex-shrink-0`} />;
    }
    if (keyLower.includes('skill') || keyLower.includes('requirement') || keyLower.includes('experience')) {
      return <Star className={`w-2 h-2 ${currentTheme.accent} flex-shrink-0`} />;
    }
    return <Info className={`w-2 h-2 ${currentTheme.accent} flex-shrink-0`} />;
  };

  const renderValue = (value: any, level: number = 0, parentKey: string = ''): React.ReactNode => {
    if (Array.isArray(value)) {
      return (
        <div className="space-y-0.5">
          {value.map((item, index) => (
            <div key={index} className={`flex items-start gap-0.5 p-1 ${currentTheme.valueBg} rounded-sm border ${currentTheme.border} shadow-sm`}>
              <div className={`p-0.5 bg-gradient-to-r ${currentTheme.primary} rounded-sm flex-shrink-0`}>
                <div className="w-0.5 h-0.5 bg-white rounded-full" />
              </div>
              <div className="flex-1 text-gray-700 leading-tight font-normal text-xs break-words min-w-0">
                {typeof item === 'string' ? 
                  (parentKey.toLowerCase().includes('salary') || parentKey.toLowerCase().includes('compensation') ? 
                    formatCurrency(item) : item
                  ) : 
                  renderValue(item, level + 1, parentKey)
                }
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (typeof value === 'object' && value !== null) {
      return (
        <div className="space-y-1 w-full">
          {Object.entries(value).map(([key, val]) => {
            return (
              <div key={key} className="w-full">
                {/* Key Header - Colored background */}
                <div className={`flex items-center gap-0.5 p-1 ${currentTheme.keyBg} border ${currentTheme.border} rounded-t-sm`}>
                  <div className="p-0.5 bg-white rounded-sm shadow-sm flex-shrink-0">
                    {getStatusIcon(key, val)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h6 className={`font-semibold ${currentTheme.text} text-xs break-words leading-tight`}>
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </h6>
                  </div>
                </div>
                
                {/* Value Content - White background */}
                <div className={`p-1 ${currentTheme.valueBg} border-l ${currentTheme.border} border-r ${currentTheme.border} border-b ${currentTheme.border} rounded-b-sm`}>
                  {renderValue(val, level + 1, key)}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    const stringValue = String(value);
    const formattedValue = parentKey.toLowerCase().includes('salary') || 
                          parentKey.toLowerCase().includes('compensation') || 
                          parentKey.toLowerCase().includes('bonus') ? 
                          formatCurrency(stringValue) : stringValue;

    return (
      <div className={`${currentTheme.valueBg} rounded-sm p-1 border ${currentTheme.border} shadow-sm`}>
        <p className="text-gray-700 leading-tight font-normal text-xs break-words">
          {formattedValue}
        </p>
      </div>
    );
  };

  return (
    <div className="w-full overflow-hidden">
      <Card className="bg-white shadow-sm border-0 rounded-md overflow-hidden w-full">
        <CardContent className="p-1 w-full">
          <div className="w-full">
            {renderValue(data)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
