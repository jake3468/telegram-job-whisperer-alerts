
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
      headerBg: 'bg-yellow-100',
      contentBg: 'bg-gray-50',
      border: 'border-yellow-300',
      headerText: 'text-yellow-900',
      contentText: 'text-gray-800',
      accent: 'text-yellow-600'
    },
    teal: {
      primary: 'from-teal-500 to-cyan-500',
      headerBg: 'bg-teal-100',
      contentBg: 'bg-gray-50',
      border: 'border-teal-300',
      headerText: 'text-teal-900',
      contentText: 'text-gray-800',
      accent: 'text-teal-600'
    },
    indigo: {
      primary: 'from-indigo-500 to-purple-500',
      headerBg: 'bg-indigo-100',
      contentBg: 'bg-gray-50',
      border: 'border-indigo-300',
      headerText: 'text-indigo-900',
      contentText: 'text-gray-800',
      accent: 'text-indigo-600'
    },
    pink: {
      primary: 'from-pink-500 to-rose-500',
      headerBg: 'bg-pink-100',
      contentBg: 'bg-gray-50',
      border: 'border-pink-300',
      headerText: 'text-pink-900',
      contentText: 'text-gray-800',
      accent: 'text-pink-600'
    },
    violet: {
      primary: 'from-violet-500 to-purple-500',
      headerBg: 'bg-violet-100',
      contentBg: 'bg-gray-50',
      border: 'border-violet-300',
      headerText: 'text-violet-900',
      contentText: 'text-gray-800',
      accent: 'text-violet-600'
    },
    green: {
      primary: 'from-green-500 to-emerald-500',
      headerBg: 'bg-green-100',
      contentBg: 'bg-gray-50',
      border: 'border-green-300',
      headerText: 'text-green-900',
      contentText: 'text-gray-800',
      accent: 'text-green-600'
    },
    blue: {
      primary: 'from-blue-500 to-cyan-500',
      headerBg: 'bg-blue-100',
      contentBg: 'bg-gray-50',
      border: 'border-blue-300',
      headerText: 'text-blue-900',
      contentText: 'text-gray-800',
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
        <div className="w-full space-y-2">
          {value.map((item, index) => (
            <div key={index} className={`w-full p-2 ${currentTheme.contentBg} rounded border ${currentTheme.border}`}>
              <div className="w-full flex items-start gap-2 min-w-0">
                <div className={`p-1 bg-gradient-to-r ${currentTheme.primary} rounded flex-shrink-0`}>
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`${currentTheme.contentText} text-xs leading-relaxed break-words`}>
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
        <div className="w-full space-y-2">
          {Object.entries(value).map(([key, val]) => (
            <div key={key} className="w-full space-y-1">
              {/* Header with distinct styling */}
              <div className={`w-full p-2 ${currentTheme.headerBg} border ${currentTheme.border} rounded`}>
                <div className="w-full flex items-center gap-2 min-w-0">
                  <div className="p-1 bg-white rounded shadow-sm flex-shrink-0">
                    {getStatusIcon(key, val)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-bold ${currentTheme.headerText} text-xs break-words`}>
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </h4>
                  </div>
                </div>
              </div>
              
              {/* Content with neutral background */}
              <div className="w-full pl-1">
                {renderValue(val, level + 1, key)}
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
      <div className={`w-full p-2 ${currentTheme.contentBg} rounded border ${currentTheme.border}`}>
        <p className={`${currentTheme.contentText} text-xs leading-relaxed break-words`}>
          {formattedValue}
        </p>
      </div>
    );
  };

  return (
    <div className="w-full">
      <Card className="w-full bg-white shadow-lg border-0 rounded-xl overflow-hidden">
        <CardContent className="p-3 w-full">
          <div className="w-full">
            {renderValue(data)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
