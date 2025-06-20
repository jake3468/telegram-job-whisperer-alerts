
import React from 'react';
import { CheckCircle, AlertCircle, Info, TrendingUp } from 'lucide-react';

interface BulletPointListProps {
  items: string[];
  title?: string;
}

export const BulletPointList: React.FC<BulletPointListProps> = ({ items, title }) => {
  if (!items || items.length === 0) return null;

  const getItemIcon = (item: string) => {
    const itemLower = item.toLowerCase();
    if (itemLower.includes('positive') || itemLower.includes('good') || itemLower.includes('strong') || itemLower.includes('growth')) {
      return <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />;
    }
    if (itemLower.includes('negative') || itemLower.includes('risk') || itemLower.includes('concern') || itemLower.includes('decline')) {
      return <AlertCircle className="w-3 h-3 text-red-400 flex-shrink-0" />;
    }
    if (itemLower.includes('trend') || itemLower.includes('increase') || itemLower.includes('improve')) {
      return <TrendingUp className="w-3 h-3 text-blue-400 flex-shrink-0" />;
    }
    return <Info className="w-3 h-3 text-gray-400 flex-shrink-0" />;
  };

  const getItemStyle = (item: string) => {
    const itemLower = item.toLowerCase();
    if (itemLower.includes('positive') || itemLower.includes('good') || itemLower.includes('strong') || itemLower.includes('growth')) {
      return 'border-l-green-400/40 bg-green-900/10';
    }
    if (itemLower.includes('negative') || itemLower.includes('risk') || itemLower.includes('concern') || itemLower.includes('decline')) {
      return 'border-l-red-400/40 bg-red-900/10';
    }
    if (itemLower.includes('trend') || itemLower.includes('increase') || itemLower.includes('improve')) {
      return 'border-l-blue-400/40 bg-blue-900/10';
    }
    return 'border-l-gray-400/40 bg-gray-800/20';
  };

  return (
    <div className="space-y-2">
      {title && (
        <h5 className="text-xs font-medium text-gray-400 mb-3">{title}</h5>
      )}
      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 p-3 rounded-lg border-l-2 transition-all duration-200 hover:bg-opacity-80 ${getItemStyle(item)}`}
          >
            {getItemIcon(item)}
            <p className="text-gray-300 text-sm leading-relaxed flex-1">
              {item}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
