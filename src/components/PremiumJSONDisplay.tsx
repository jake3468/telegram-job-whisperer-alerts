
import React, { useState } from 'react';
import { ChevronDown, ChevronRight, DollarSign, TrendingUp, AlertCircle, CheckCircle, Info, Star, Award, Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface PremiumJSONDisplayProps {
  data: any;
  theme?: 'yellow' | 'teal' | 'indigo' | 'pink' | 'violet' | 'green' | 'blue';
}

export const PremiumJSONDisplay: React.FC<PremiumJSONDisplayProps> = ({ data, theme = 'blue' }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

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
      return <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />;
    }
    if (keyLower.includes('negative') || keyLower.includes('risk') || keyLower.includes('concern') || keyLower.includes('challenge')) {
      return <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />;
    }
    if (keyLower.includes('salary') || keyLower.includes('compensation') || keyLower.includes('bonus') || keyLower.includes('pay')) {
      return <DollarSign className={`w-5 h-5 ${currentTheme.accent} flex-shrink-0`} />;
    }
    if (keyLower.includes('growth') || keyLower.includes('development') || keyLower.includes('advancement')) {
      return <TrendingUp className={`w-5 h-5 ${currentTheme.accent} flex-shrink-0`} />;
    }
    if (keyLower.includes('opportunity') || keyLower.includes('potential')) {
      return <Target className={`w-5 h-5 ${currentTheme.accent} flex-shrink-0`} />;
    }
    if (keyLower.includes('skill') || keyLower.includes('requirement') || keyLower.includes('experience')) {
      return <Star className={`w-5 h-5 ${currentTheme.accent} flex-shrink-0`} />;
    }
    return <Info className={`w-5 h-5 ${currentTheme.accent} flex-shrink-0`} />;
  };

  const toggleExpansion = (key: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedSections(newExpanded);
  };

  const renderValue = (value: any, level: number = 0, parentKey: string = '', path: string = ''): React.ReactNode => {
    if (Array.isArray(value)) {
      return (
        <div className="space-y-3 mt-4">
          {value.map((item, index) => (
            <div key={index} className={`flex items-start gap-4 p-4 bg-white rounded-xl border-2 ${currentTheme.border} shadow-sm hover:shadow-md transition-all duration-200`}>
              <div className={`p-2 bg-gradient-to-r ${currentTheme.primary} rounded-lg`}>
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
              <div className="flex-1 text-gray-700 leading-relaxed font-medium">
                {typeof item === 'string' ? 
                  (parentKey.toLowerCase().includes('salary') || parentKey.toLowerCase().includes('compensation') ? 
                    formatCurrency(item) : item
                  ) : 
                  renderValue(item, level + 1, parentKey, `${path}.${index}`)
                }
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (typeof value === 'object' && value !== null) {
      return (
        <div className={`space-y-4 ${level > 0 ? 'ml-4 mt-4' : ''}`}>
          {Object.entries(value).map(([key, val]) => {
            const currentPath = `${path}.${key}`;
            const isExpanded = expandedSections.has(currentPath);
            const hasNestedContent = (typeof val === 'object' && val !== null);
            
            return (
              <Card key={key} className="bg-white shadow-lg border-2 border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300">
                <CardContent className="p-0">
                  <div 
                    className={`flex items-center gap-4 p-6 bg-gradient-to-r ${currentTheme.bg} cursor-pointer hover:opacity-80 transition-opacity`}
                    onClick={() => hasNestedContent && toggleExpansion(currentPath)}
                  >
                    <div className="p-3 bg-white rounded-xl shadow-sm">
                      {getStatusIcon(key, val)}
                    </div>
                    <div className="flex-1">
                      <h5 className={`font-bold ${currentTheme.text} text-lg`}>
                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </h5>
                      {!hasNestedContent && (
                        <p className="text-gray-600 text-sm mt-1">Click to view details</p>
                      )}
                    </div>
                    {hasNestedContent && (
                      <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                        <ChevronRight className={`w-5 h-5 ${currentTheme.accent}`} />
                      </div>
                    )}
                  </div>
                  
                  {hasNestedContent ? (
                    <div className={`transition-all duration-300 overflow-hidden ${isExpanded ? 'max-h-none p-6' : 'max-h-0'}`}>
                      {renderValue(val, level + 1, key, currentPath)}
                    </div>
                  ) : (
                    <div className="p-6 border-t border-gray-100">
                      <div className={`bg-gradient-to-r ${currentTheme.bg} rounded-xl p-6 border-l-4 ${currentTheme.border}`}>
                        <p className="text-gray-700 leading-relaxed font-medium text-lg">
                          {parentKey.toLowerCase().includes('salary') || 
                           parentKey.toLowerCase().includes('compensation') || 
                           parentKey.toLowerCase().includes('bonus') ? 
                           formatCurrency(String(val)) : String(val)}
                        </p>
                      </div>
                    </div>
                  )}
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
      <div className={`bg-gradient-to-r ${currentTheme.bg} rounded-2xl p-6 border-2 ${currentTheme.border} shadow-sm`}>
        <p className="text-gray-700 leading-relaxed font-medium text-lg">
          {formattedValue}
        </p>
      </div>
    );
  };

  return (
    <Card className="bg-white shadow-xl border-0 rounded-3xl overflow-hidden group-hover:shadow-2xl transition-all duration-300">
      <CardContent className="p-8">
        <div className="space-y-6">
          {renderValue(data)}
        </div>
      </CardContent>
    </Card>
  );
};
