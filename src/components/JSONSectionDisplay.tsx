
import React from 'react';
import { ChevronRight, DollarSign, TrendingUp, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface JSONSectionDisplayProps {
  title: string;
  data: any;
  icon?: React.ReactNode;
}

export const JSONSectionDisplay: React.FC<JSONSectionDisplayProps> = ({ title, data, icon }) => {
  if (!data) return null;

  const formatCurrency = (value: string) => {
    const numMatch = value.match(/(\d+(?:,\d+)*(?:\.\d+)?)/);
    if (numMatch) {
      return value.replace(numMatch[0], `₹${numMatch[0]}`);
    }
    return value;
  };

  const getStatusIcon = (key: string, value: any) => {
    const keyLower = key.toLowerCase();
    if (keyLower.includes('positive') || keyLower.includes('good') || keyLower.includes('strong')) {
      return <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />;
    }
    if (keyLower.includes('negative') || keyLower.includes('risk') || keyLower.includes('concern')) {
      return <AlertCircle className="w-3 h-3 text-red-400 flex-shrink-0" />;
    }
    if (keyLower.includes('salary') || keyLower.includes('compensation') || keyLower.includes('bonus')) {
      return <DollarSign className="w-3 h-3 text-yellow-400 flex-shrink-0" />;
    }
    return <Info className="w-3 h-3 text-blue-400 flex-shrink-0" />;
  };

  const renderValue = (value: any, level: number = 0, parentKey: string = ''): React.ReactNode => {
    if (Array.isArray(value)) {
      return (
        <div className="space-y-2 mt-2">
          {value.map((item, index) => (
            <div key={index} className="flex items-start gap-2 p-2 bg-gray-800/40 rounded-md border-l-2 border-green-400/30">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0" />
              <div className="flex-1 text-gray-300 text-sm leading-relaxed">
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
        <div className={`space-y-3 ${level > 0 ? 'ml-3 mt-2' : ''}`}>
          {Object.entries(value).map(([key, val]) => (
            <div key={key} className={`${level === 0 ? 'p-3 bg-gray-800/20 rounded-lg border border-gray-700/30' : ''}`}>
              <div className="flex items-center gap-2 mb-2">
                {getStatusIcon(key, val)}
                <h6 className={`font-semibold text-gray-300 ${level === 0 ? 'text-sm' : 'text-xs'}`}>
                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </h6>
              </div>
              <div className={level === 0 ? 'ml-5' : 'ml-3'}>
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
      <div className="bg-gray-800/30 rounded-md p-3 border-l-2 border-blue-400/30">
        <p className="text-gray-300 text-sm leading-relaxed">
          {formattedValue}
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-4 p-4 bg-gradient-to-br from-gray-800/40 to-gray-800/20 rounded-xl border border-gray-700/30 shadow-lg">
      <div className="flex items-center gap-3 pb-2 border-b border-gray-700/40">
        <div className="p-2 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-lg">
          {icon}
        </div>
        <h4 className="text-base font-bold text-white">
          {title}
        </h4>
        <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
      </div>
      <div className="space-y-3">
        {renderValue(data)}
      </div>
    </div>
  );
};
