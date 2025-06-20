
import React from 'react';

interface JSONSectionDisplayProps {
  title: string;
  data: any;
  icon?: React.ReactNode;
}

export const JSONSectionDisplay: React.FC<JSONSectionDisplayProps> = ({ title, data, icon }) => {
  if (!data) return null;

  const renderValue = (value: any, level: number = 0): React.ReactNode => {
    if (Array.isArray(value)) {
      return (
        <ul className="space-y-1 mt-1">
          {value.map((item, index) => (
            <li key={index} className="text-gray-300 text-xs leading-relaxed">
              {typeof item === 'string' ? `• ${item}` : renderValue(item, level + 1)}
            </li>
          ))}
        </ul>
      );
    }

    if (typeof value === 'object' && value !== null) {
      return (
        <div className={`space-y-2 ${level > 0 ? 'ml-3' : ''}`}>
          {Object.entries(value).map(([key, val]) => (
            <div key={key}>
              <h6 className={`font-medium text-gray-400 ${level === 0 ? 'text-sm' : 'text-xs'} mb-1`}>
                {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </h6>
              {renderValue(val, level + 1)}
            </div>
          ))}
        </div>
      );
    }

    return (
      <p className="text-gray-300 text-xs leading-relaxed">
        {String(value)}
      </p>
    );
  };

  return (
    <div className="space-y-3 p-3 bg-gray-800/30 rounded-lg border border-gray-700/20">
      <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
        {icon}
        {title}
      </h4>
      {renderValue(data)}
    </div>
  );
};
