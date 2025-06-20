
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
    <div className="mb-6 w-full">
      <div className="flex items-start gap-4 mb-4">
        <div className={`relative p-3 rounded-lg bg-gradient-to-r ${gradient} shadow-lg flex-shrink-0`}>
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center">
            <span className="text-sm font-bold text-gray-700">{number}</span>
          </div>
          <div className="text-white">
            {icon}
          </div>
        </div>
        <div className="flex-1">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">
            {title}
          </h2>
          <p className="text-gray-600 text-sm md:text-base leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};
