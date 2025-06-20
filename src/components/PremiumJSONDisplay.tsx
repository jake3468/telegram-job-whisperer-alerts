
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
      accent: 'text-yellow-600'
    },
    teal: {
      primary: 'from-teal-500 to-cyan-500',
      bg: 'from-teal-50 to-cyan-50',
      border: 'border-teal-200',
      text: 'text-teal-800',
      accent: 'text-teal-600'
    },
    indigo: {
      primary: 'from-indigo-500 to-purple-500',
      bg: 'from-indigo-50 to-purple-50',
      border: 'border-indigo-200',
      text: 'text-indigo-800',
      accent: 'text-indigo-600'
    },
    pink: {
      primary: 'from-pink-500 to-rose-500',
      bg: 'from-pink-50 to-rose-50',
      border: 'border-pink-200',
      text: 'text-pink-800',
      accent: 'text-pink-600'
    },
    violet: {
      primary: 'from-violet-500 to-purple-500',
      bg: 'from-violet-50 to-purple-50',
      border: 'border-violet-200',
      text: 'text-violet-800',
      accent: 'text-violet-600'
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
      return <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />;
    }
    if (keyLower.includes('negative') || keyLower.includes('risk') || keyLower.includes('concern') || keyLower.includes('challenge')) {
      return <AlertCircle className="w-3 h-3 text-red-500 flex-shrink-0" />;
    }
    if (keyLower.includes('salary') || keyLower.includes('compensation') || keyLower.includes('bonus') || keyLower.includes('pay')) {
      return <DollarSign className={`w-3 h-3 ${currentTheme.accent} flex-shrink-0`} />;
    }
    if (keyLower.includes('growth') || keyLower.includes('development') || keyLower.includes('advancement')) {
      return <TrendingUp className={`w-3 h-3 ${currentTheme.accent} flex-shrink-0`} />;
    }
    if (keyLower.includes('opportunity') || keyLower.includes('potential')) {
      return <Target className={`w-3 h-3 ${currentTheme.accent} flex-shrink-0`} />;
    }
    if (keyLower.includes('skill') || keyLower.includes('requirement') || keyLower.includes('experience')) {
      return <Star className={`w-3 h-3 ${currentTheme.accent} flex-shrink-0`} />;
    }
    return <Info className={`w-3 h-3 ${currentTheme.accent} flex-shrink-0`} />;
  };

  const renderValue = (value: any, level: number = 0, parentKey: string = ''): React.ReactNode => {
    if (Array.isArray(value)) {
      return (
        <div className="space-y-1 mt-1">
          {value.map((item, index) => (
            <div key={index} className={`flex items-start gap-1 p-1.5 bg-white rounded-sm border ${currentTheme.border} shadow-sm`}>
              <div className={`p-0.5 bg-gradient-to-r ${currentTheme.primary} rounded-sm`}>
                <div className="w-1 h-1 bg-white rounded-full" />
              </div>
              <div className="flex-1 text-gray-700 leading-relaxed font-medium text-xs break-words">
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
        <div className={`space-y-1 ${level > 0 ? 'ml-1 mt-1' : ''}`}>
          {Object.entries(value).map(([key, val]) => {
            return (
              <Card key={key} className="bg-white shadow-sm border border-gray-100 rounded-sm overflow-hidden">
                <CardContent className="p-0">
                  <div className={`flex items-center gap-1 p-2 bg-gradient-to-r ${currentTheme.bg}`}>
                    <div className="p-1 bg-white rounded-sm shadow-sm">
                      {getStatusIcon(key, val)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className={`font-bold ${currentTheme.text} text-xs break-words`}>
                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </h5>
                    </div>
                  </div>
                  
                  <div className="p-2 border-t border-gray-100">
                    {renderValue(val, level + 1, key)}
                  </div>
                </CardContent>
              </Card>
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
      <div className={`bg-gradient-to-r ${currentTheme.bg} rounded-sm p-2 border ${currentTheme.border} shadow-sm`}>
        <p className="text-gray-700 leading-relaxed font-medium text-xs break-words">
          {formattedValue}
        </p>
      </div>
    );
  };

  return (
    <Card className="bg-white shadow-sm border-0 rounded-md overflow-hidden">
      <CardContent className="p-2">
        <div className="space-y-2">
          {renderValue(data)}
        </div>
      </CardContent>
    </Card>
  );
};
