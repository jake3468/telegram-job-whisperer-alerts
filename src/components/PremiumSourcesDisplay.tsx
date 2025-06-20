
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
      return <Building className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />;
    }
    if (catLower.includes('news') || catLower.includes('article')) {
      return <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />;
    }
    if (catLower.includes('salary') || catLower.includes('compensation')) {
      return <Award className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />;
    }
    if (catLower.includes('review') || catLower.includes('rating')) {
      return <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />;
    }
    return <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-500" />;
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
      <div className="grid gap-3 sm:gap-4">
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
                <div className={`flex items-center gap-3 sm:gap-4 p-4 sm:p-5 md:p-6 bg-gradient-to-r ${categoryTheme.bg} hover:shadow-lg rounded-xl sm:rounded-2xl border-2 ${categoryTheme.border} transition-all duration-300 hover:scale-[1.02]`}>
                  <div className="p-2 sm:p-3 bg-white rounded-lg sm:rounded-xl shadow-md group-hover:shadow-lg transition-shadow flex-shrink-0">
                    <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold ${categoryTheme.text} text-base sm:text-lg truncate`}>
                      {domain}
                    </p>
                    <p className="text-gray-500 text-xs sm:text-sm truncate mt-1 font-mono break-all">
                      {link}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="px-2 sm:px-3 py-1 bg-white rounded-full shadow-sm">
                      <span className="text-xs font-medium text-gray-600">Trusted Source</span>
                    </div>
                    <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 group-hover:text-green-500 transition-colors flex-shrink-0" />
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
    <Card className="w-full bg-white shadow-lg md:shadow-xl border-0 rounded-2xl sm:rounded-3xl overflow-hidden group-hover:shadow-2xl transition-all duration-300">
      <CardContent className="p-4 sm:p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8 pb-4 sm:pb-6 border-b border-gray-100">
          <div className="p-3 sm:p-4 bg-gradient-to-r from-gray-100 to-slate-100 rounded-xl sm:rounded-2xl flex-shrink-0">
            <Globe className="w-6 h-6 sm:w-8 sm:h-8 text-gray-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 break-words">Trusted Research Sources</h3>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Verified information from reliable sources</p>
          </div>
          <div className="text-center sm:text-right flex-shrink-0">
            <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full border border-green-200">
              <span className="text-xs sm:text-sm font-bold text-green-700">
                {Object.keys(sources).length} Categories
              </span>
            </div>
          </div>
        </div>
        
        <div className="space-y-6 sm:space-y-8">
          {Object.entries(sources).map(([category, links]) => {
            const categoryTheme = getCategoryTheme(category);
            
            return (
              <div key={category} className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="p-2 sm:p-3 bg-white rounded-xl sm:rounded-2xl shadow-lg border-2 border-gray-100 flex-shrink-0">
                    {getCategoryIcon(category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-lg sm:text-xl font-bold ${categoryTheme.text} break-words`}>
                      {category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </h4>
                    <p className="text-gray-600 text-sm sm:text-base">Verified data sources</p>
                  </div>
                </div>
                <div className="ml-0 sm:ml-16">
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
