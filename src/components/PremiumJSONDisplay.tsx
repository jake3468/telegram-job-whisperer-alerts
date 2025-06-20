
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
      // Level 1: Main headers - Dark background with white text
      level1Bg: 'bg-yellow-700',
      level1Text: 'text-white',
      level1Icon: 'text-white',
      // Level 2: Subheaders - Medium background with dark text
      level2Bg: 'bg-yellow-200',
      level2Text: 'text-yellow-900',
      level2Icon: 'text-yellow-800',
      // Level 3: Content - Light background
      contentBg: 'bg-yellow-50',
      contentText: 'text-gray-800',
      contentIcon: 'text-yellow-600',
      border: 'border-yellow-300'
    },
    teal: {
      primary: 'from-teal-500 to-cyan-500',
      level1Bg: 'bg-teal-700',
      level1Text: 'text-white',
      level1Icon: 'text-white',
      level2Bg: 'bg-teal-200',
      level2Text: 'text-teal-900',
      level2Icon: 'text-teal-800',
      contentBg: 'bg-teal-50',
      contentText: 'text-gray-800',
      contentIcon: 'text-teal-600',
      border: 'border-teal-300'
    },
    indigo: {
      primary: 'from-indigo-500 to-purple-500',
      level1Bg: 'bg-indigo-700',
      level1Text: 'text-white',
      level1Icon: 'text-white',
      level2Bg: 'bg-indigo-200',
      level2Text: 'text-indigo-900',
      level2Icon: 'text-indigo-800',
      contentBg: 'bg-indigo-50',
      contentText: 'text-gray-800',
      contentIcon: 'text-indigo-600',
      border: 'border-indigo-300'
    },
    pink: {
      primary: 'from-pink-500 to-rose-500',
      level1Bg: 'bg-pink-700',
      level1Text: 'text-white',
      level1Icon: 'text-white',
      level2Bg: 'bg-pink-200',
      level2Text: 'text-pink-900',
      level2Icon: 'text-pink-800',
      contentBg: 'bg-pink-50',
      contentText: 'text-gray-800',
      contentIcon: 'text-pink-600',
      border: 'border-pink-300'
    },
    violet: {
      primary: 'from-violet-500 to-purple-500',
      level1Bg: 'bg-violet-700',
      level1Text: 'text-white',
      level1Icon: 'text-white',
      level2Bg: 'bg-violet-200',
      level2Text: 'text-violet-900',
      level2Icon: 'text-violet-800',
      contentBg: 'bg-violet-50',
      contentText: 'text-gray-800',
      contentIcon: 'text-violet-600',
      border: 'border-violet-300'
    },
    green: {
      primary: 'from-green-500 to-emerald-500',
      level1Bg: 'bg-green-700',
      level1Text: 'text-white',
      level1Icon: 'text-white',
      level2Bg: 'bg-green-200',
      level2Text: 'text-green-900',
      level2Icon: 'text-green-800',
      contentBg: 'bg-green-50',
      contentText: 'text-gray-800',
      contentIcon: 'text-green-600',
      border: 'border-green-300'
    },
    blue: {
      primary: 'from-blue-500 to-cyan-500',
      level1Bg: 'bg-blue-700',
      level1Text: 'text-white',
      level1Icon: 'text-white',
      level2Bg: 'bg-blue-200',
      level2Text: 'text-blue-900',
      level2Icon: 'text-blue-800',
      contentBg: 'bg-blue-50',
      contentText: 'text-gray-800',
      contentIcon: 'text-blue-600',
      border: 'border-blue-300'
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

  const getStatusIcon = (key: string, value: any, level: number) => {
    const keyLower = key.toLowerCase();
    let iconColor = currentTheme.contentIcon;
    
    if (level === 0) {
      iconColor = currentTheme.level1Icon;
    } else if (level === 1) {
      iconColor = currentTheme.level2Icon;
    }

    if (keyLower.includes('positive') || keyLower.includes('good') || keyLower.includes('strong') || keyLower.includes('benefit')) {
      return <CheckCircle className={`w-3 h-3 text-green-500 flex-shrink-0`} />;
    }
    if (keyLower.includes('negative') || keyLower.includes('risk') || keyLower.includes('concern') || keyLower.includes('challenge')) {
      return <AlertCircle className={`w-3 h-3 text-red-500 flex-shrink-0`} />;
    }
    if (keyLower.includes('salary') || keyLower.includes('compensation') || keyLower.includes('bonus') || keyLower.includes('pay')) {
      return <DollarSign className={`w-3 h-3 ${iconColor} flex-shrink-0`} />;
    }
    if (keyLower.includes('growth') || keyLower.includes('development') || keyLower.includes('advancement')) {
      return <TrendingUp className={`w-3 h-3 ${iconColor} flex-shrink-0`} />;
    }
    if (keyLower.includes('opportunity') || keyLower.includes('potential')) {
      return <Target className={`w-3 h-3 ${iconColor} flex-shrink-0`} />;
    }
    if (keyLower.includes('skill') || keyLower.includes('requirement') || keyLower.includes('experience')) {
      return <Star className={`w-3 h-3 ${iconColor} flex-shrink-0`} />;
    }
    return <Info className={`w-3 h-3 ${iconColor} flex-shrink-0`} />;
  };

  const renderValue = (value: any, level: number = 0, parentKey: string = ''): React.ReactNode => {
    if (Array.isArray(value)) {
      return (
        <div className="w-full space-y-1 min-w-0">
          {value.map((item, index) => (
            <div key={index} className={`w-full p-2 ${currentTheme.contentBg} rounded border ${currentTheme.border} min-w-0`}>
              <div className="w-full flex items-start gap-2 min-w-0">
                <div className={`p-1 bg-gradient-to-r ${currentTheme.primary} rounded flex-shrink-0`}>
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`${currentTheme.contentText} text-xs leading-relaxed break-words break-all`}>
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
        <div className="w-full space-y-1 min-w-0">
          {Object.entries(value).map(([key, val]) => (
            <div key={key} className="w-full space-y-1 min-w-0">
              {/* Level 0: Main Headers - Dark background with white text */}
              {level === 0 && (
                <div className={`w-full p-2 ${currentTheme.level1Bg} border ${currentTheme.border} rounded min-w-0`}>
                  <div className="w-full flex items-center gap-2 min-w-0">
                    <div className="p-1 bg-white/20 rounded shadow-sm flex-shrink-0">
                      {getStatusIcon(key, val, level)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-bold ${currentTheme.level1Text} text-sm break-words hyphens-auto`}>
                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </h4>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Level 1: Subheaders - Medium background with dark text */}
              {level === 1 && (
                <div className={`w-full p-2 ${currentTheme.level2Bg} border ${currentTheme.border} rounded min-w-0`}>
                  <div className="w-full flex items-center gap-2 min-w-0">
                    <div className="p-1 bg-white rounded shadow-sm flex-shrink-0">
                      {getStatusIcon(key, val, level)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className={`font-semibold ${currentTheme.level2Text} text-xs break-words hyphens-auto`}>
                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </h5>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Level 2+: Sub-subheaders - Light background */}
              {level >= 2 && (
                <div className={`w-full p-2 ${currentTheme.contentBg} border ${currentTheme.border} rounded min-w-0`}>
                  <div className="w-full flex items-center gap-2 min-w-0">
                    <div className="p-1 bg-white rounded shadow-sm flex-shrink-0">
                      {getStatusIcon(key, val, level)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h6 className={`font-medium ${currentTheme.contentText} text-xs break-words hyphens-auto`}>
                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </h6>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Content with proper left padding */}
              <div className="w-full pl-1 min-w-0">
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
      <div className={`w-full p-2 ${currentTheme.contentBg} rounded border ${currentTheme.border} min-w-0`}>
        <p className={`${currentTheme.contentText} text-xs leading-relaxed break-words break-all hyphens-auto`}>
          {formattedValue}
        </p>
      </div>
    );
  };

  return (
    <div className="w-full min-w-0">
      <Card className="w-full bg-white shadow-lg border-0 rounded-xl overflow-hidden min-w-0">
        <CardContent className="p-2 w-full min-w-0">
          <div className="w-full min-w-0">
            {renderValue(data)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
