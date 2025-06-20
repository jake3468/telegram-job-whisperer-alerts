
import React from 'react';
import { ExternalLink, Globe, FileText, Building, Shield, Award } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface PremiumSourcesDisplayProps {
  sources: any;
}

export const PremiumSourcesDisplay: React.FC<PremiumSourcesDisplayProps> = ({ sources }) => {
  if (!sources || typeof sources !== 'object') return null;

  const getCategoryIcon = (category: string) => {
    const catLower = category.toLowerCase();
    if (catLower.includes('company') || catLower.includes('corporate')) {
      return <Building className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />;
    }
    if (catLower.includes('news') || catLower.includes('article')) {
      return <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />;
    }
    if (catLower.includes('salary') || catLower.includes('compensation')) {
      return <Award className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />;
    }
    if (catLower.includes('review') || catLower.includes('rating')) {
      return <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500" />;
    }
    return <Globe className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-500" />;
  };

  const getCategoryTheme = (category: string) => {
    const catLower = category.toLowerCase();
    if (catLower.includes('company') || catLower.includes('corporate')) {
      return {
        bg: 'from-blue-50 to-cyan-50',
        border: 'border-blue-200',
        text: 'text-blue-800'
      };
    }
    if (catLower.includes('news') || catLower.includes('article')) {
      return {
        bg: 'from-green-50 to-emerald-50',
        border: 'border-green-200',
        text: 'text-green-800'
      };
    }
    if (catLower.includes('salary') || catLower.includes('compensation')) {
      return {
        bg: 'from-yellow-50 to-orange-50',
        border: 'border-yellow-200',
        text: 'text-yellow-800'
      };
    }
    return {
      bg: 'from-gray-50 to-slate-50',
      border: 'border-gray-200',
      text: 'text-gray-800'
    };
  };

  const renderSourceLinks = (links: string[] | string, categoryTheme: any) => {
    const linkArray = Array.isArray(links) ? links : [links];
    
    return (
      <div className="grid gap-1.5 sm:gap-2">
        {linkArray.map((link, index) => {
          if (typeof link === 'string' && link.startsWith('https://')) {
            const domain = new URL(link).hostname.replace('www.', '');
            return (
              <a
                key={index}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                <div className={`flex items-center gap-1.5 sm:gap-2 p-2 sm:p-3 bg-gradient-to-r ${categoryTheme.bg} hover:shadow-md rounded-md sm:rounded-lg border ${categoryTheme.border} transition-all duration-300 hover:scale-[1.01]`}>
                  <div className="p-1 sm:p-1.5 bg-white rounded-sm sm:rounded-md shadow-sm group-hover:shadow-md transition-shadow flex-shrink-0">
                    <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold ${categoryTheme.text} text-xs truncate`}>
                      {domain}
                    </p>
                    <p className="text-gray-500 text-xs truncate mt-0.5 font-mono break-all">
                      {link}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <div className="px-1.5 py-0.5 bg-white rounded-full shadow-sm">
                      <span className="text-xs font-medium text-gray-600">Trusted</span>
                    </div>
                    <ExternalLink className="w-2.5 h-2.5 text-gray-400 group-hover:text-green-500 transition-colors flex-shrink-0" />
                  </div>
                </div>
              </a>
            );
          }
          return null;
        })}
      </div>
    );
  };

  return (
    <Card className="w-full bg-white shadow-sm md:shadow-md border-0 rounded-lg sm:rounded-xl overflow-hidden">
      <CardContent className="p-2 sm:p-3 md:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-gray-100">
          <div className="p-1.5 sm:p-2 bg-gradient-to-r from-gray-100 to-slate-100 rounded-md sm:rounded-lg flex-shrink-0">
            <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-gray-800 break-words">Trusted Research Sources</h3>
            <p className="text-gray-600 mt-0.5 text-xs">Verified information from reliable sources</p>
          </div>
          <div className="text-center sm:text-right flex-shrink-0">
            <div className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full border border-green-200">
              <span className="text-xs font-bold text-green-700">
                {Object.keys(sources).length} Categories
              </span>
            </div>
          </div>
        </div>
        
        <div className="space-y-3 sm:space-y-4">
          {Object.entries(sources).map(([category, links]) => {
            const categoryTheme = getCategoryTheme(category);
            
            return (
              <div key={category} className="space-y-1.5 sm:space-y-2">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                  <div className="p-1 sm:p-1.5 bg-white rounded-md sm:rounded-lg shadow-md border border-gray-100 flex-shrink-0">
                    {getCategoryIcon(category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-xs sm:text-sm font-bold ${categoryTheme.text} break-words`}>
                      {category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </h4>
                    <p className="text-gray-600 text-xs">Verified data sources</p>
                  </div>
                </div>
                <div className="ml-0 sm:ml-8">
                  {renderSourceLinks(links as string[] | string, categoryTheme)}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
