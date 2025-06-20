
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
      return <Building className="w-6 h-6 text-blue-500" />;
    }
    if (catLower.includes('news') || catLower.includes('article')) {
      return <FileText className="w-6 h-6 text-green-500" />;
    }
    if (catLower.includes('salary') || catLower.includes('compensation')) {
      return <Award className="w-6 h-6 text-yellow-500" />;
    }
    if (catLower.includes('review') || catLower.includes('rating')) {
      return <Shield className="w-6 h-6 text-purple-500" />;
    }
    return <Globe className="w-6 h-6 text-indigo-500" />;
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
      <div className="grid gap-4">
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
                <div className={`flex items-center gap-4 p-6 bg-gradient-to-r ${categoryTheme.bg} hover:shadow-lg rounded-2xl border-2 ${categoryTheme.border} transition-all duration-300 hover:scale-[1.02]`}>
                  <div className="p-3 bg-white rounded-xl shadow-md group-hover:shadow-lg transition-shadow">
                    <ExternalLink className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold ${categoryTheme.text} text-lg truncate`}>
                      {domain}
                    </p>
                    <p className="text-gray-500 text-sm truncate mt-1 font-mono">
                      {link}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1 bg-white rounded-full shadow-sm">
                      <span className="text-xs font-medium text-gray-600">Trusted Source</span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-green-500 transition-colors flex-shrink-0" />
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
    <Card className="bg-white shadow-xl border-0 rounded-3xl overflow-hidden group-hover:shadow-2xl transition-all duration-300">
      <CardContent className="p-8">
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
          <div className="p-4 bg-gradient-to-r from-gray-100 to-slate-100 rounded-2xl">
            <Globe className="w-8 h-8 text-gray-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-gray-800">Trusted Research Sources</h3>
            <p className="text-gray-600 mt-1">Verified information from reliable sources</p>
          </div>
          <div className="text-right">
            <div className="px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full border border-green-200">
              <span className="text-sm font-bold text-green-700">
                {Object.keys(sources).length} Categories
              </span>
            </div>
          </div>
        </div>
        
        <div className="space-y-8">
          {Object.entries(sources).map(([category, links]) => {
            const categoryTheme = getCategoryTheme(category);
            
            return (
              <div key={category} className="space-y-4">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-white rounded-2xl shadow-lg border-2 border-gray-100">
                    {getCategoryIcon(category)}
                  </div>
                  <div className="flex-1">
                    <h4 className={`text-xl font-bold ${categoryTheme.text}`}>
                      {category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </h4>
                    <p className="text-gray-600">Verified data sources</p>
                  </div>
                </div>
                <div className="ml-16">
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
