
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
    <div className="mb-4 w-full">
      <div className="flex flex-col gap-2 mb-4">
        <div className={`relative p-3 rounded-lg bg-gradient-to-r ${gradient} shadow-lg flex-shrink-0 w-fit`}>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center">
            <span className="text-sm font-bold text-gray-700">{number}</span>
          </div>
          <div className="text-white">
            {icon}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-1 break-words leading-tight">
            {title}
          </h2>
          <p className="text-gray-600 text-sm md:text-base break-words leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};
