
import React from 'react';

interface PremiumSectionHeaderProps {
  number: number;
  title: string;
  icon: React.ReactNode;
  gradient: string;
  description: string;
}

export const PremiumSectionHeader: React.FC<PremiumSectionHeaderProps> = ({
  number,
  title,
  icon,
  gradient,
  description
}) => {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-4 mb-4">
        <div className={`relative p-4 rounded-2xl bg-gradient-to-r ${gradient} shadow-lg`}>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
            <span className="text-sm font-bold text-gray-700">{number}</span>
          </div>
          <div className="text-white">
            {icon}
          </div>
        </div>
        <div className="flex-1">
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-1">
            {title}
          </h2>
          <p className="text-gray-600 text-lg">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};
