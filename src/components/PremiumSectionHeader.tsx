
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
    <div className="mb-4 sm:mb-5 md:mb-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
        <div className={`relative p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-r ${gradient} shadow-lg flex-shrink-0`}>
          <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
            <span className="text-xs sm:text-sm font-bold text-gray-700">{number}</span>
          </div>
          <div className="text-white">
            {icon}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-1 break-words">
            {title}
          </h2>
          <p className="text-gray-600 text-sm sm:text-base md:text-lg break-words">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};
