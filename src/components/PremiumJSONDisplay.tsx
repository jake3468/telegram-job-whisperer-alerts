
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
      parentBg: 'bg-yellow-50',
      childBg: 'bg-yellow-25',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      accent: 'text-yellow-600'
    },
    teal: {
      primary: 'from-teal-500 to-cyan-500',
      parentBg: 'bg-teal-50',
      childBg: 'bg-teal-25',
      border: 'border-teal-200',
      text: 'text-teal-800',
      accent: 'text-teal-600'
    },
    indigo: {
      primary: 'from-indigo-500 to-purple-500',
      parentBg: 'bg-indigo-50',
      childBg: 'bg-indigo-25',
      border: 'border-indigo-200',
      text: 'text-indigo-800',
      accent: 'text-indigo-600'
    },
    pink: {
      primary: 'from-pink-500 to-rose-500',
      parentBg: 'bg-pink-50',
      childBg: 'bg-pink-25',
      border: 'border-pink-200',
      text: 'text-pink-800',
      accent: 'text-pink-600'
    },
    violet: {
      primary: 'from-violet-500 to-purple-500',
      parentBg: 'bg-violet-50',
      childBg: 'bg-violet-25',
      border: 'border-violet-200',
      text: 'text-violet-800',
      accent: 'text-violet-600'
    },
    green: {
      primary: 'from-green-500 to-emerald-500',
      parentBg: 'bg-green-50',
      childBg: 'bg-green-25',
      border: 'border-green-200',
      text: 'text-green-800',
      accent: 'text-green-600'
    },
    blue: {
      primary: 'from-blue-500 to-cyan-500',
      parentBg: 'bg-blue-50',
      childBg: 'bg-blue-25',
      border: 'border-blue-200',
      text: 'text-blue-800',
      accent: 'text-blue-600'
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
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    if (keyLower.includes('negative') || keyLower.includes('risk') || keyLower.includes('concern') || keyLower.includes('challenge')) {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
    if (keyLower.includes('salary') || keyLower.includes('compensation') || keyLower.includes('bonus') || keyLower.includes('pay')) {
      return <DollarSign className={`w-4 h-4 ${currentTheme.accent}`} />;
    }
    if (keyLower.includes('growth') || keyLower.includes('development') || keyLower.includes('advancement')) {
      return <TrendingUp className={`w-4 h-4 ${currentTheme.accent}`} />;
    }
    if (keyLower.includes('opportunity') || keyLower.includes('potential')) {
      return <Target className={`w-4 h-4 ${currentTheme.accent}`} />;
    }
    if (keyLower.includes('skill') || keyLower.includes('requirement') || keyLower.includes('experience')) {
      return <Star className={`w-4 h-4 ${currentTheme.accent}`} />;
    }
    return <Info className={`w-4 h-4 ${currentTheme.accent}`} />;
  };

  const renderValue = (value: any, level: number = 0, parentKey: string = ''): React.ReactNode => {
    if (Array.isArray(value)) {
      return (
        <div className="space-y-3">
          {value.map((item, index) => (
            <div key={index} className={`p-3 ${currentTheme.childBg} rounded-lg border ${currentTheme.border} shadow-sm`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 bg-gradient-to-r ${currentTheme.primary} rounded-md flex-shrink-0 mt-1`}>
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-700 text-sm md:text-base leading-relaxed font-medium">
                    {typeof item === 'string' ? 
                      (parentKey.toLowerCase().includes('salary') || parentKey.toLowerCase().includes('compensation') ? 
                        formatCurrency(item) : item
                      ) : 
                      renderValue(item, level + 1, parentKey)
                    }
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (typeof value === 'object' && value !== null) {
      return (
        <div className="space-y-4">
          {Object.entries(value).map(([key, val]) => (
            <div key={key} className="space-y-3">
              <div className={`p-4 ${currentTheme.parentBg} border ${currentTheme.border} rounded-lg shadow-sm`}>
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm flex-shrink-0 mt-1">
                    {getStatusIcon(key, val)}
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-semibold ${currentTheme.text} text-base md:text-lg mb-2`}>
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </h4>
                  </div>
                </div>
                
                <div className="ml-2">
                  {renderValue(val, level + 1, key)}
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    const stringValue = String(value);
    const formattedValue = parentKey.toLowerCase().includes('salary') || 
                          parentKey.toLowerCase().includes('compensation') || 
                          parentKey.toLowerCase().includes('bonus') ? 
                          formatCurrency(stringValue) : stringValue;

    return (
      <div className={`p-3 ${currentTheme.childBg} rounded-lg border ${currentTheme.border} shadow-sm`}>
        <p className="text-gray-700 text-sm md:text-base leading-relaxed font-medium">
          {formattedValue}
        </p>
      </div>
    );
  };

  return (
    <div className="w-full">
      <Card className="bg-white shadow-lg border-0 rounded-xl">
        <CardContent className="p-4 md:p-6">
          {renderValue(data)}
        </CardContent>
      </Card>
    </div>
  );
};
