
import React from 'react';

interface BulletPointListProps {
  items: string[] | null;
  title?: string;
  className?: string;
}

export const BulletPointList: React.FC<BulletPointListProps> = ({ items, title, className = '' }) => {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {title && (
        <h4 className="text-sm font-medium text-gray-300 mb-2">{title}</h4>
      )}
      <div className="space-y-1">
        {items.map((item, index) => (
          <div key={index} className="text-sm text-gray-300 leading-relaxed">
            {item.startsWith('•') ? item : `• ${item}`}
          </div>
        ))}
      </div>
    </div>
  );
};
