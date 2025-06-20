
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
      return <Building className="w-3 h-3 text-blue-500" />;
    }
    if (catLower.includes('news') || catLower.includes('article')) {
      return <FileText className="w-3 h-3 text-green-500" />;
    }
    if (catLower.includes('salary') || catLower.includes('compensation')) {
      return <Award className="w-3 h-3 text-yellow-500" />;
    }
    if (catLower.includes('review') || catLower.includes('rating')) {
      return <Shield className="w-3 h-3 text-purple-500" />;
    }
    return <Globe className="w-3 h-3 text-indigo-500" />;
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
      <div className="space-y-2 w-full min-w-0 overflow-hidden">
        {linkArray.map((link, index) => {
          if (typeof link === 'string' && link.startsWith('https://')) {
            const domain = new URL(link).hostname.replace('www.', '');
            return (
              <a
                key={index}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="group block w-full min-w-0 overflow-hidden"
              >
                <div className={`flex items-start gap-2 p-2 bg-gradient-to-r ${categoryTheme.bg} hover:shadow-md rounded-lg border ${categoryTheme.border} transition-all duration-300 w-full min-w-0 overflow-hidden`}>
                  <div className="p-1.5 bg-white rounded-lg shadow-sm group-hover:shadow-md transition-shadow flex-shrink-0">
                    <ExternalLink className="w-3 h-3 text-green-500" />
                  </div>
                  <div className="flex-1 min-w-0 w-full overflow-hidden">
                    <p className={`font-semibold ${categoryTheme.text} text-xs mb-1 break-words hyphens-auto overflow-wrap-anywhere`}>
                      {domain}
                    </p>
                    <p className="text-gray-600 text-xs leading-relaxed break-all hyphens-auto overflow-wrap-anywhere">
                      {link}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <div className="px-2 py-1 bg-white rounded-full shadow-sm">
                      <span className="text-xs font-medium text-gray-600">Trusted</span>
                    </div>
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
    <div className="w-full min-w-0 overflow-hidden max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-4xl mx-auto">
      <Card className="w-full bg-white shadow-lg border-0 rounded-xl overflow-hidden min-w-0">
        <CardContent className="p-2 w-full min-w-0 overflow-hidden">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100 w-full min-w-0 overflow-hidden">
            <div className="p-2 bg-gradient-to-r from-gray-100 to-slate-100 rounded-lg flex-shrink-0">
              <Globe className="w-3 h-3 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0 overflow-hidden">
              <h3 className="text-xs font-bold text-gray-800 break-words hyphens-auto overflow-wrap-anywhere">Trusted Research Sources</h3>
              <p className="text-gray-600 mt-1 text-xs break-words hyphens-auto overflow-wrap-anywhere">Verified information from reliable sources</p>
            </div>
            <div className="text-center flex-shrink-0">
              <div className="px-2 py-1 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full border border-green-200">
                <span className="text-xs font-bold text-green-700">
                  {Object.keys(sources).length} Categories
                </span>
              </div>
            </div>
          </div>
          
          <div className="space-y-3 w-full min-w-0 overflow-hidden">
            {Object.entries(sources).map(([category, links]) => {
              const categoryTheme = getCategoryTheme(category);
              
              return (
                <div key={category} className="space-y-2 w-full min-w-0 overflow-hidden">
                  <div className="flex items-center gap-2 mb-2 w-full min-w-0 overflow-hidden">
                    <div className="p-1.5 bg-white rounded-lg shadow-sm border border-gray-100 flex-shrink-0">
                      {getCategoryIcon(category)}
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <h4 className={`text-xs font-bold ${categoryTheme.text} break-words hyphens-auto overflow-wrap-anywhere`}>
                        {category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </h4>
                      <p className="text-gray-600 text-xs break-words hyphens-auto overflow-wrap-anywhere">Verified data sources</p>
                    </div>
                  </div>
                  <div className="w-full min-w-0 overflow-hidden">
                    {renderSourceLinks(links as string[] | string, categoryTheme)}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
