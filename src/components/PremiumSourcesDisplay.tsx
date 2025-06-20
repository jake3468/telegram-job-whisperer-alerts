
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
      return <Building className="w-4 h-4 text-blue-500" />;
    }
    if (catLower.includes('news') || catLower.includes('article')) {
      return <FileText className="w-4 h-4 text-green-500" />;
    }
    if (catLower.includes('salary') || catLower.includes('compensation')) {
      return <Award className="w-4 h-4 text-yellow-500" />;
    }
    if (catLower.includes('review') || catLower.includes('rating')) {
      return <Shield className="w-4 h-4 text-purple-500" />;
    }
    return <Globe className="w-4 h-4 text-indigo-500" />;
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
      <div className="space-y-3">
        {linkArray.map((link, index) => {
          if (typeof link === 'string' && link.startsWith('https://')) {
            const domain = new URL(link).hostname.replace('www.', '');
            return (
              <a
                key={index}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="group block w-full"
              >
                <div className={`flex items-start gap-3 p-4 bg-gradient-to-r ${categoryTheme.bg} hover:shadow-md rounded-lg border ${categoryTheme.border} transition-all duration-300 w-full`}>
                  <div className="p-2 bg-white rounded-lg shadow-sm group-hover:shadow-md transition-shadow flex-shrink-0">
                    <ExternalLink className="w-4 h-4 text-green-500" />
                  </div>
                  <div className="flex-1 min-w-0 w-full">
                    <p className={`font-semibold ${categoryTheme.text} text-sm md:text-base mb-2 break-words`}>
                      {domain}
                    </p>
                    <p className="text-gray-600 text-xs md:text-sm leading-relaxed break-all">
                      {link}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="px-3 py-1 bg-white rounded-full shadow-sm">
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
    <Card className="w-full bg-white shadow-lg border-0 rounded-xl">
      <CardContent className="p-4 md:p-6">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
          <div className="p-3 bg-gradient-to-r from-gray-100 to-slate-100 rounded-lg flex-shrink-0">
            <Globe className="w-5 h-5 text-gray-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg md:text-xl font-bold text-gray-800 break-words">Trusted Research Sources</h3>
            <p className="text-gray-600 mt-1 text-sm md:text-base">Verified information from reliable sources</p>
          </div>
          <div className="text-center flex-shrink-0">
            <div className="px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full border border-green-200">
              <span className="text-sm font-bold text-green-700">
                {Object.keys(sources).length} Categories
              </span>
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          {Object.entries(sources).map(([category, links]) => {
            const categoryTheme = getCategoryTheme(category);
            
            return (
              <div key={category} className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100 flex-shrink-0">
                    {getCategoryIcon(category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-base md:text-lg font-bold ${categoryTheme.text} break-words`}>
                      {category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </h4>
                    <p className="text-gray-600 text-sm">Verified data sources</p>
                  </div>
                </div>
                <div className="w-full">
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
