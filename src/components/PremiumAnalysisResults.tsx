
import React from 'react';
import { Calendar, MapPin, Building2, TrendingUp, Award, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { PremiumSectionHeader } from './PremiumSectionHeader';
import { EnhancedPercentageMeter } from './EnhancedPercentageMeter';
import { PremiumBulletPointList } from './PremiumBulletPointList';
import { PremiumJSONDisplay } from './PremiumJSONDisplay';
import { PremiumSourcesDisplay } from './PremiumSourcesDisplay';

interface CompanyRoleAnalysisData {
  id: string;
  company_name: string;
  location: string;
  job_title: string;
  research_date: string | null;
  local_role_market_context: string | null;
  company_news_updates: string[] | null;
  role_security_score: number | null;
  role_security_score_breakdown: string[] | null;
  role_security_outlook: string | null;
  role_security_automation_risks: string | null;
  role_security_departmental_trends: string | null;
  role_experience_score: number | null;
  role_experience_score_breakdown: string[] | null;
  role_experience_specific_insights: string | null;
  role_compensation_analysis: any | null;
  role_workplace_environment: any | null;
  career_development: any | null;
  role_specific_considerations: any | null;
  interview_and_hiring_insights: any | null;
  sources: any | null;
  created_at: string;
  updated_at: string;
}

interface PremiumAnalysisResultsProps {
  analysis: CompanyRoleAnalysisData;
}

export const PremiumAnalysisResults: React.FC<PremiumAnalysisResultsProps> = ({ analysis }) => {
  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-white min-h-screen">
      <div className="w-full max-w-none mx-auto space-y-6 md:space-y-8 px-2 sm:px-4 py-4 sm:py-6">
        {/* Hero Section */}
        <div className="w-full bg-white rounded-2xl md:rounded-3xl shadow-lg md:shadow-2xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-4 sm:p-6 md:p-8 text-white">
            <div className="flex flex-col gap-4 md:gap-6">
              <div className="space-y-3 md:space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 md:p-3 bg-white/20 rounded-lg md:rounded-xl backdrop-blur-sm flex-shrink-0">
                    <Building2 className="w-6 h-6 md:w-8 md:h-8" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold break-words">
                      {analysis.job_title}
                    </h1>
                    <p className="text-sm sm:text-base md:text-lg xl:text-xl text-blue-100 break-words">
                      at {analysis.company_name}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm">
                  <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 md:px-4 md:py-2 rounded-full backdrop-blur-sm">
                    <MapPin className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                    <span className="truncate">{analysis.location}</span>
                  </div>
                  {analysis.research_date && (
                    <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 md:px-4 md:py-2 rounded-full backdrop-blur-sm">
                      <Calendar className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                      <span className="truncate">
                        Research: {new Date(analysis.research_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Key Metrics Dashboard - Responsive Grid */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 mt-4">
                {analysis.role_security_score !== null && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 text-center">
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold mb-1">
                      {analysis.role_security_score}%
                    </div>
                    <div className="text-xs sm:text-sm text-blue-100">Security Score</div>
                    <div className="flex justify-center mt-1 md:mt-2">
                      <Award className="w-4 h-4 md:w-5 md:h-5 text-yellow-300" />
                    </div>
                  </div>
                )}
                {analysis.role_experience_score !== null && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 text-center">
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold mb-1">
                      {analysis.role_experience_score}%
                    </div>
                    <div className="text-xs sm:text-sm text-blue-100">Experience Score</div>
                    <div className="flex justify-center mt-1 md:mt-2">
                      <Star className="w-4 h-4 md:w-5 md:h-5 text-yellow-300" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Analysis Sections */}
        <div className="w-full space-y-6 md:space-y-8">
          {/* Market Context - Section 1 */}
          {analysis.local_role_market_context && (
            <div className="group w-full">
              <PremiumSectionHeader
                number={1}
                title="Market Context Analysis"
                icon={<TrendingUp className="w-5 h-5 md:w-6 md:h-6" />}
                gradient="from-blue-500 to-cyan-500"
                description="Current market trends and opportunities"
              />
              <Card className="w-full bg-white shadow-lg md:shadow-xl border-0 rounded-2xl md:rounded-3xl overflow-hidden group-hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-4 sm:p-6 md:p-8">
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl md:rounded-2xl p-4 sm:p-5 md:p-6 border-l-4 border-blue-500">
                    <p className="text-gray-700 leading-relaxed text-sm sm:text-base md:text-lg break-words">
                      {analysis.local_role_market_context}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Company News - Section 2 */}
          {analysis.company_news_updates && analysis.company_news_updates.length > 0 && (
            <div className="group w-full">
              <PremiumSectionHeader
                number={2}
                title="Company News & Updates"
                icon={<Building2 className="w-5 h-5 md:w-6 md:h-6" />}
                gradient="from-orange-500 to-red-500"
                description="Latest developments and company insights"
              />
              <Card className="w-full bg-white shadow-lg md:shadow-xl border-0 rounded-2xl md:rounded-3xl overflow-hidden group-hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-4 sm:p-6 md:p-8">
                  <PremiumBulletPointList 
                    items={analysis.company_news_updates} 
                    theme="orange"
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Role Security Analysis - Section 3 */}
          {(analysis.role_security_score !== null || analysis.role_security_outlook || analysis.role_security_automation_risks || analysis.role_security_departmental_trends || (analysis.role_security_score_breakdown && analysis.role_security_score_breakdown.length > 0)) && (
            <div className="group w-full">
              <PremiumSectionHeader
                number={3}
                title="Role Security Analysis"
                icon={<Award className="w-5 h-5 md:w-6 md:h-6" />}
                gradient="from-green-500 to-emerald-500"
                description="Job stability and future outlook"
              />
              <Card className="w-full bg-white shadow-lg md:shadow-xl border-0 rounded-2xl md:rounded-3xl overflow-hidden group-hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-5 md:space-y-6">
                  {analysis.role_security_score !== null && (
                    <EnhancedPercentageMeter 
                      score={analysis.role_security_score} 
                      label="Security Score" 
                      theme="green"
                    />
                  )}
                  
                  {analysis.role_security_score_breakdown && analysis.role_security_score_breakdown.length > 0 && (
                    <PremiumBulletPointList 
                      items={analysis.role_security_score_breakdown} 
                      title="Score Breakdown"
                      theme="green"
                    />
                  )}
                  
                  {analysis.role_security_outlook && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl md:rounded-2xl p-4 sm:p-5 md:p-6 border-l-4 border-green-500">
                      <h4 className="font-semibold text-green-800 mb-2 md:mb-3 text-sm sm:text-base">Outlook</h4>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base break-words">
                        {analysis.role_security_outlook}
                      </p>
                    </div>
                  )}
                  
                  {analysis.role_security_automation_risks && (
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl md:rounded-2xl p-4 sm:p-5 md:p-6 border-l-4 border-yellow-500">
                      <h4 className="font-semibold text-yellow-800 mb-2 md:mb-3 text-sm sm:text-base">Automation Risks</h4>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base break-words">
                        {analysis.role_security_automation_risks}
                      </p>
                    </div>
                  )}
                  
                  {analysis.role_security_departmental_trends && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl md:rounded-2xl p-4 sm:p-5 md:p-6 border-l-4 border-blue-500">
                      <h4 className="font-semibold text-blue-800 mb-2 md:mb-3 text-sm sm:text-base">Departmental Trends</h4>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base break-words">
                        {analysis.role_security_departmental_trends}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Role Experience Analysis - Section 4 */}
          {(analysis.role_experience_score !== null || analysis.role_experience_specific_insights || (analysis.role_experience_score_breakdown && analysis.role_experience_score_breakdown.length > 0)) && (
            <div className="group w-full">
              <PremiumSectionHeader
                number={4}
                title="Role Experience Analysis"
                icon={<Star className="w-5 h-5 md:w-6 md:h-6" />}
                gradient="from-purple-500 to-pink-500"
                description="Experience requirements and career fit"
              />
              <Card className="w-full bg-white shadow-lg md:shadow-xl border-0 rounded-2xl md:rounded-3xl overflow-hidden group-hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-5 md:space-y-6">
                  {analysis.role_experience_score !== null && (
                    <EnhancedPercentageMeter 
                      score={analysis.role_experience_score} 
                      label="Experience Score" 
                      theme="purple"
                    />
                  )}
                  
                  {analysis.role_experience_score_breakdown && analysis.role_experience_score_breakdown.length > 0 && (
                    <PremiumBulletPointList 
                      items={analysis.role_experience_score_breakdown} 
                      title="Score Breakdown"
                      theme="purple"
                    />
                  )}
                  
                  {analysis.role_experience_specific_insights && (
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl md:rounded-2xl p-4 sm:p-5 md:p-6 border-l-4 border-purple-500">
                      <h4 className="font-semibold text-purple-800 mb-2 md:mb-3 text-sm sm:text-base">Specific Insights</h4>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base break-words">
                        {analysis.role_experience_specific_insights}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* JSON Sections with premium styling */}
          {analysis.role_compensation_analysis && (
            <div className="group w-full">
              <PremiumSectionHeader
                number={5}
                title="Compensation Analysis"
                icon={<TrendingUp className="w-5 h-5 md:w-6 md:h-6" />}
                gradient="from-yellow-500 to-orange-500"
                description="Salary insights and benefits breakdown"
              />
              <PremiumJSONDisplay
                data={analysis.role_compensation_analysis}
                theme="yellow"
              />
            </div>
          )}

          {analysis.role_workplace_environment && (
            <div className="group w-full">
              <PremiumSectionHeader
                number={6}
                title="Workplace Environment"
                icon={<Building2 className="w-5 h-5 md:w-6 md:h-6" />}
                gradient="from-teal-500 to-cyan-500"
                description="Company culture and work environment"
              />
              <PremiumJSONDisplay
                data={analysis.role_workplace_environment}
                theme="teal"
              />
            </div>
          )}

          {analysis.career_development && (
            <div className="group w-full">
              <PremiumSectionHeader
                number={7}
                title="Career Development"
                icon={<TrendingUp className="w-5 h-5 md:w-6 md:h-6" />}
                gradient="from-indigo-500 to-purple-500"
                description="Growth opportunities and advancement paths"
              />
              <PremiumJSONDisplay
                data={analysis.career_development}
                theme="indigo"
              />
            </div>
          )}

          {analysis.role_specific_considerations && (
            <div className="group w-full">
              <PremiumSectionHeader
                number={8}
                title="Role-Specific Considerations"
                icon={<Award className="w-5 h-5 md:w-6 md:h-6" />}
                gradient="from-pink-500 to-rose-500"
                description="Important factors and considerations"
              />
              <PremiumJSONDisplay
                data={analysis.role_specific_considerations}
                theme="pink"
              />
            </div>
          )}

          {analysis.interview_and_hiring_insights && (
            <div className="group w-full">
              <PremiumSectionHeader
                number={9}
                title="Interview & Hiring Insights"
                icon={<Star className="w-5 h-5 md:w-6 md:h-6" />}
                gradient="from-violet-500 to-purple-500"
                description="Interview preparation and hiring process"
              />
              <PremiumJSONDisplay
                data={analysis.interview_and_hiring_insights}
                theme="violet"
              />
            </div>
          )}

          {/* Sources Section */}
          {analysis.sources && (
            <div className="group w-full">
              <PremiumSectionHeader
                number={10}
                title="Research Sources"
                icon={<Building2 className="w-5 h-5 md:w-6 md:h-6" />}
                gradient="from-gray-500 to-slate-500"
                description="Trusted sources and references"
              />
              <PremiumSourcesDisplay sources={analysis.sources} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
