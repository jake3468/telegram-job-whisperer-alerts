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
      parentBg: 'bg-yellow-100',
      childBg: 'bg-yellow-50',
      grandchildBg: 'bg-white',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      accent: 'text-yellow-600',
      parentBorder: 'border-yellow-300',
      childBorder: 'border-yellow-200',
      grandchildBorder: 'border-yellow-100'
    },
    teal: {
      primary: 'from-teal-500 to-cyan-500',
      parentBg: 'bg-teal-100',
      childBg: 'bg-teal-50',
      grandchildBg: 'bg-white',
      border: 'border-teal-200',
      text: 'text-teal-800',
      accent: 'text-teal-600',
      parentBorder: 'border-teal-300',
      childBorder: 'border-teal-200',
      grandchildBorder: 'border-teal-100'
    },
    indigo: {
      primary: 'from-indigo-500 to-purple-500',
      parentBg: 'bg-indigo-100',
      childBg: 'bg-indigo-50',
      grandchildBg: 'bg-white',
      border: 'border-indigo-200',
      text: 'text-indigo-800',
      accent: 'text-indigo-600',
      parentBorder: 'border-indigo-300',
      childBorder: 'border-indigo-200',
      grandchildBorder: 'border-indigo-100'
    },
    pink: {
      primary: 'from-pink-500 to-rose-500',
      parentBg: 'bg-pink-100',
      childBg: 'bg-pink-50',
      grandchildBg: 'bg-white',
      border: 'border-pink-200',
      text: 'text-pink-800',
      accent: 'text-pink-600',
      parentBorder: 'border-pink-300',
      childBorder: 'border-pink-200',
      grandchildBorder: 'border-pink-100'
    },
    violet: {
      primary: 'from-violet-500 to-purple-500',
      parentBg: 'bg-violet-100',
      childBg: 'bg-violet-50',
      grandchildBg: 'bg-white',
      border: 'border-violet-200',
      text: 'text-violet-800',
      accent: 'text-violet-600',
      parentBorder: 'border-violet-300',
      childBorder: 'border-violet-200',
      grandchildBorder: 'border-violet-100'
    },
    green: {
      primary: 'from-green-500 to-emerald-500',
      parentBg: 'bg-green-100',
      childBg: 'bg-green-50',
      grandchildBg: 'bg-white',
      border: 'border-green-200',
      text: 'text-green-800',
      accent: 'text-green-600',
      parentBorder: 'border-green-300',
      childBorder: 'border-green-200',
      grandchildBorder: 'border-green-100'
    },
    blue: {
      primary: 'from-blue-500 to-cyan-500',
      parentBg: 'bg-blue-100',
      childBg: 'bg-blue-50',
      grandchildBg: 'bg-white',
      border: 'border-blue-200',
      text: 'text-blue-800',
      accent: 'text-blue-600',
      parentBorder: 'border-blue-300',
      childBorder: 'border-blue-200',
      grandchildBorder: 'border-blue-100'
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
      return <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />;
    }
    if (keyLower.includes('negative') || keyLower.includes('risk') || keyLower.includes('concern') || keyLower.includes('challenge')) {
      return <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />;
    }
    if (keyLower.includes('salary') || keyLower.includes('compensation') || keyLower.includes('bonus') || keyLower.includes('pay')) {
      return <DollarSign className={`w-4 h-4 ${currentTheme.accent} flex-shrink-0`} />;
    }
    if (keyLower.includes('growth') || keyLower.includes('development') || keyLower.includes('advancement')) {
      return <TrendingUp className={`w-4 h-4 ${currentTheme.accent} flex-shrink-0`} />;
    }
    if (keyLower.includes('opportunity') || keyLower.includes('potential')) {
      return <Target className={`w-4 h-4 ${currentTheme.accent} flex-shrink-0`} />;
    }
    if (keyLower.includes('skill') || keyLower.includes('requirement') || keyLower.includes('experience')) {
      return <Star className={`w-4 h-4 ${currentTheme.accent} flex-shrink-0`} />;
    }
    return <Info className={`w-4 h-4 ${currentTheme.accent} flex-shrink-0`} />;
  };

  const renderValue = (value: any, level: number = 0, parentKey: string = ''): React.ReactNode => {
    if (Array.isArray(value)) {
      return (
        <div className="space-y-3">
          {value.map((item, index) => (
            <div key={index} className={`flex items-start gap-3 p-4 ${level === 0 ? currentTheme.childBg : currentTheme.grandchildBg} rounded-lg border ${level === 0 ? currentTheme.childBorder : currentTheme.grandchildBorder}`}>
              <div className={`p-2 bg-gradient-to-r ${currentTheme.primary} rounded-lg flex-shrink-0`}>
                <div className="w-3 h-3 bg-white rounded-full" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-gray-700 leading-relaxed font-medium text-sm md:text-base break-words">
                  {typeof item === 'string' ? 
                    (parentKey.toLowerCase().includes('salary') || parentKey.toLowerCase().includes('compensation') ? 
                      formatCurrency(item) : item
                    ) : 
                    renderValue(item, level + 1, parentKey)
                  }
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
          {Object.entries(value).map(([key, val]) => {
            const bgClass = level === 0 ? currentTheme.parentBg : level === 1 ? currentTheme.childBg : currentTheme.grandchildBg;
            const borderClass = level === 0 ? currentTheme.parentBorder : level === 1 ? currentTheme.childBorder : currentTheme.grandchildBorder;
            
            return (
              <div key={key} className="space-y-3">
                {/* Key Header - Fixed sizing for better hierarchy */}
                <div className={`flex items-center gap-3 p-4 ${bgClass} border ${borderClass} rounded-lg`}>
                  <div className="p-2 bg-white rounded-lg shadow-sm flex-shrink-0">
                    {getStatusIcon(key, val)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h6 className={`font-semibold ${currentTheme.text} ${
                      level === 0 ? 'text-base md:text-lg' : 
                      level === 1 ? 'text-sm md:text-base' : 
                      'text-sm'
                    } break-words leading-relaxed`}>
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </h6>
                  </div>
                </div>
                
                {/* Value Content */}
                <div className={`p-4 ${level === 0 ? currentTheme.childBg : currentTheme.grandchildBg} border-l-4 ${borderClass} rounded-lg ml-4`}>
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
      <div className={`${currentTheme.grandchildBg} rounded-lg p-4 border ${currentTheme.grandchildBorder}`}>
        <p className="text-gray-700 leading-relaxed font-medium text-sm md:text-base break-words">
          {formattedValue}
        </p>
      </div>
    );
  };

  return (
    <div className="w-full overflow-hidden">
      <Card className="bg-white shadow-lg border-0 rounded-xl">
        <CardContent className="p-4 md:p-6">
          {renderValue(data)}
        </CardContent>
      </Card>
    </div>
  );
};
