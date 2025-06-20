
import React from 'react';
import { ExternalLink } from 'lucide-react';

interface SourcesDisplayProps {
  sources: any;
}

export const SourcesDisplay: React.FC<SourcesDisplayProps> = ({ sources }) => {
  if (!sources || typeof sources !== 'object') return null;

  const renderSourceLinks = (links: string[] | string) => {
    const linkArray = Array.isArray(links) ? links : [links];
    
    return (
      <div className="space-y-1">
        {linkArray.map((link, index) => {
          if (typeof link === 'string' && link.startsWith('https://')) {
            return (
              <a
                key={index}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1 break-all"
              >
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                {link}
              </a>
            );
          }
          return null;
        })}
      </div>
    );
  };

  return (
    <div className="space-y-3 p-3 bg-gray-800/30 rounded-lg border border-gray-700/20">
      <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
        <ExternalLink className="w-4 h-4" />
        Sources
      </h4>
      <div className="space-y-3">
        {Object.entries(sources).map(([category, links]) => (
          <div key={category}>
            <h5 className="text-xs font-medium text-gray-400 mb-2">
              {category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </h5>
            {renderSourceLinks(links as string[] | string)}
          </div>
        ))}
      </div>
    </div>
  );
};
