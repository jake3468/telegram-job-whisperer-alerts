
import React from 'react';
import { ExternalLink, Globe, FileText, Building } from 'lucide-react';

interface SourcesDisplayProps {
  sources: any;
}

export const SourcesDisplay: React.FC<SourcesDisplayProps> = ({ sources }) => {
  if (!sources || typeof sources !== 'object') return null;

  const getCategoryIcon = (category: string) => {
    const catLower = category.toLowerCase();
    if (catLower.includes('company') || catLower.includes('corporate')) {
      return <Building className="w-4 h-4 text-blue-400" />;
    }
    if (catLower.includes('news') || catLower.includes('article')) {
      return <FileText className="w-4 h-4 text-green-400" />;
    }
    return <Globe className="w-4 h-4 text-purple-400" />;
  };

  const renderSourceLinks = (links: string[] | string) => {
    const linkArray = Array.isArray(links) ? links : [links];
    
    return (
      <div className="space-y-2">
        {linkArray.map((link, index) => {
          if (typeof link === 'string' && link.startsWith('https://')) {
            const domain = new URL(link).hostname.replace('www.', '');
            return (
              <a
                key={index}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 p-3 bg-gray-800/40 hover:bg-gray-800/60 rounded-lg border border-gray-700/30 hover:border-green-400/30 transition-all duration-200"
              >
                <div className="p-2 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-md group-hover:from-green-500/30 group-hover:to-green-600/30 transition-all duration-200">
                  <ExternalLink className="w-4 h-4 text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-300 text-sm font-medium truncate">
                    {domain}
                  </p>
                  <p className="text-gray-500 text-xs truncate mt-1">
                    {link}
                  </p>
                </div>
                <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-green-400 transition-colors duration-200 flex-shrink-0" />
              </a>
            );
          }
          return null;
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4 p-4 bg-gradient-to-br from-gray-800/40 to-gray-800/20 rounded-xl border border-gray-700/30 shadow-lg">
      <div className="flex items-center gap-3 pb-2 border-b border-gray-700/40">
        <div className="p-2 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-lg">
          <ExternalLink className="w-4 h-4 text-purple-400" />
        </div>
        <h4 className="text-base font-bold text-white">
          Research Sources
        </h4>
        <div className="ml-auto text-xs text-gray-400 bg-gray-800/50 px-2 py-1 rounded-full">
          {Object.keys(sources).length} categories
        </div>
      </div>
      
      <div className="space-y-4">
        {Object.entries(sources).map(([category, links]) => (
          <div key={category} className="space-y-2">
            <div className="flex items-center gap-2">
              {getCategoryIcon(category)}
              <h5 className="text-sm font-semibold text-gray-300">
                {category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </h5>
            </div>
            <div className="ml-6">
              {renderSourceLinks(links as string[] | string)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
