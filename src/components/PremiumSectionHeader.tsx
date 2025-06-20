
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
    <div className="mb-1 w-full">
      <div className="flex flex-col gap-1 mb-1">
        <div className={`relative p-1 rounded-sm bg-gradient-to-r ${gradient} shadow-sm flex-shrink-0 w-fit`}>
          <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-white rounded-full shadow-sm flex items-center justify-center">
            <span className="text-xs font-bold text-gray-700">{number}</span>
          </div>
          <div className="text-white">
            {icon}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xs md:text-sm font-bold text-gray-800 mb-0.5 break-words leading-tight">
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
