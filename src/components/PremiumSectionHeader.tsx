
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
    <div className="mb-2 sm:mb-3 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
        <div className={`relative p-1.5 sm:p-2 rounded-md sm:rounded-lg bg-gradient-to-r ${gradient} shadow-md flex-shrink-0`}>
          <div className="absolute -top-0.5 -right-0.5 w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full shadow-md flex items-center justify-center">
            <span className="text-xs font-bold text-gray-700">{number}</span>
          </div>
          <div className="text-white">
            {icon}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm sm:text-base font-bold text-gray-800 mb-0.5 break-words leading-tight">
            {title}
          </h2>
          <p className="text-gray-600 text-xs break-words leading-tight">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};
