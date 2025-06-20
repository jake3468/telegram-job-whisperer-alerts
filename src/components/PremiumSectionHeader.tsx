
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
    <div className="mb-3 sm:mb-4 md:mb-5 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
        <div className={`relative p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-r ${gradient} shadow-lg flex-shrink-0`}>
          <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-full shadow-lg flex items-center justify-center">
            <span className="text-xs font-bold text-gray-700">{number}</span>
          </div>
          <div className="text-white">
            {icon}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 mb-1 break-words">
            {title}
          </h2>
          <p className="text-gray-600 text-xs sm:text-sm md:text-base break-words">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};
