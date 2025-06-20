
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
    <div className="w-full max-w-full bg-gradient-to-br from-gray-50 to-white min-h-screen overflow-hidden">
      <div className="w-full max-w-full mx-auto space-y-0.5 px-0.5 py-0.5 overflow-hidden">
        {/* Hero Section */}
        <div className="w-full max-w-full bg-white rounded-md shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-0.5 text-white">
            <div className="flex flex-col gap-0.5 w-full max-w-full overflow-hidden">
              <div className="space-y-0.5 w-full">
                <div className="flex items-start gap-0.5 w-full">
                  <div className="p-0.5 bg-white/20 rounded-sm backdrop-blur-sm flex-shrink-0">
                    <Building2 className="w-1.5 h-1.5" />
                  </div>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <h1 className="text-xs font-bold break-words leading-tight overflow-hidden">
                      {analysis.job_title}
                    </h1>
                    <p className="text-xs text-blue-100 break-words overflow-hidden">
                      at {analysis.company_name}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-0.5 text-xs w-full">
                  <div className="flex items-center gap-0.5 bg-white/10 px-0.5 py-0.5 rounded-full backdrop-blur-sm max-w-full overflow-hidden">
                    <MapPin className="w-1 h-1 flex-shrink-0" />
                    <span className="truncate text-xs overflow-hidden">{analysis.location}</span>
                  </div>
                  {analysis.research_date && (
                    <div className="flex items-center gap-0.5 bg-white/10 px-0.5 py-0.5 rounded-full backdrop-blur-sm max-w-full overflow-hidden">
                      <Calendar className="w-1 h-1 flex-shrink-0" />
                      <span className="truncate text-xs overflow-hidden">
                        {new Date(analysis.research_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Key Metrics Dashboard */}
              <div className="grid grid-cols-2 gap-0.5 w-full">
                {analysis.role_security_score !== null && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-sm p-0.5 text-center overflow-hidden">
                    <div className="text-xs font-bold">
                      {analysis.role_security_score}%
                    </div>
                    <div className="text-xs text-blue-100">Security</div>
                    <div className="flex justify-center">
                      <Award className="w-1 h-1 text-yellow-300" />
                    </div>
                  </div>
                )}
                {analysis.role_experience_score !== null && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-sm p-0.5 text-center overflow-hidden">
                    <div className="text-xs font-bold">
                      {analysis.role_experience_score}%
                    </div>
                    <div className="text-xs text-blue-100">Experience</div>
                    <div className="flex justify-center">
                      <Star className="w-1 h-1 text-yellow-300" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Analysis Sections */}
        <div className="w-full max-w-full space-y-0.5 overflow-hidden">
          {/* Market Context - Section 1 */}
          {analysis.local_role_market_context && (
            <div className="w-full max-w-full overflow-hidden">
              <PremiumSectionHeader
                number={1}
                title="Market Context Analysis"
                icon={<TrendingUp className="w-1.5 h-1.5" />}
                gradient="from-blue-500 to-cyan-500"
                description="Current market trends and opportunities"
              />
              <Card className="w-full max-w-full bg-white shadow-sm border-0 rounded-md overflow-hidden">
                <CardContent className="p-0.5 w-full max-w-full overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-sm p-0.5 border-l-2 border-blue-500 w-full overflow-hidden">
                    <p className="text-gray-700 leading-tight text-xs break-words overflow-hidden">
                      {analysis.local_role_market_context}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Company News - Section 2 */}
          {analysis.company_news_updates && analysis.company_news_updates.length > 0 && (
            <div className="w-full max-w-full overflow-hidden">
              <PremiumSectionHeader
                number={2}
                title="Company News & Updates"
                icon={<Building2 className="w-1.5 h-1.5" />}
                gradient="from-orange-500 to-red-500"
                description="Latest developments and company insights"
              />
              <Card className="w-full max-w-full bg-white shadow-sm border-0 rounded-md overflow-hidden">
                <CardContent className="p-0.5 w-full max-w-full overflow-hidden">
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
            <div className="w-full max-w-full overflow-hidden">
              <PremiumSectionHeader
                number={3}
                title="Role Security Analysis"
                icon={<Award className="w-1.5 h-1.5" />}
                gradient="from-green-500 to-emerald-500"
                description="Job stability and future outlook"
              />
              <Card className="w-full max-w-full bg-white shadow-sm border-0 rounded-md overflow-hidden">
                <CardContent className="p-0.5 space-y-0.5 w-full max-w-full overflow-hidden">
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
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-sm p-0.5 border-l-2 border-green-500 w-full overflow-hidden">
                      <h4 className="font-semibold text-green-800 text-xs">Outlook</h4>
                      <p className="text-gray-700 leading-tight text-xs break-words overflow-hidden">
                        {analysis.role_security_outlook}
                      </p>
                    </div>
                  )}
                  
                  {analysis.role_security_automation_risks && (
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-sm p-0.5 border-l-2 border-yellow-500 w-full overflow-hidden">
                      <h4 className="font-semibold text-yellow-800 text-xs">Automation Risks</h4>
                      <p className="text-gray-700 leading-tight text-xs break-words overflow-hidden">
                        {analysis.role_security_automation_risks}
                      </p>
                    </div>
                  )}
                  
                  {analysis.role_security_departmental_trends && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-sm p-0.5 border-l-2 border-blue-500 w-full overflow-hidden">
                      <h4 className="font-semibold text-blue-800 text-xs">Departmental Trends</h4>
                      <p className="text-gray-700 leading-tight text-xs break-words overflow-hidden">
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
            <div className="w-full max-w-full overflow-hidden">
              <PremiumSectionHeader
                number={4}
                title="Role Experience Analysis"
                icon={<Star className="w-1.5 h-1.5" />}
                gradient="from-purple-500 to-pink-500"
                description="Experience requirements and career fit"
              />
              <Card className="w-full max-w-full bg-white shadow-sm border-0 rounded-md overflow-hidden">
                <CardContent className="p-0.5 space-y-0.5 w-full max-w-full overflow-hidden">
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
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-sm p-0.5 border-l-2 border-purple-500 w-full overflow-hidden">
                      <h4 className="font-semibold text-purple-800 text-xs">Specific Insights</h4>
                      <p className="text-gray-700 leading-tight text-xs break-words overflow-hidden">
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
            <div className="w-full max-w-full overflow-hidden">
              <PremiumSectionHeader
                number={5}
                title="Compensation Analysis"
                icon={<TrendingUp className="w-1.5 h-1.5" />}
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
            <div className="w-full max-w-full overflow-hidden">
              <PremiumSectionHeader
                number={6}
                title="Workplace Environment"
                icon={<Building2 className="w-1.5 h-1.5" />}
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
            <div className="w-full max-w-full overflow-hidden">
              <PremiumSectionHeader
                number={7}
                title="Career Development"
                icon={<TrendingUp className="w-1.5 h-1.5" />}
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
            <div className="w-full max-w-full overflow-hidden">
              <PremiumSectionHeader
                number={8}
                title="Role-Specific Considerations"
                icon={<Award className="w-1.5 h-1.5" />}
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
            <div className="w-full max-w-full overflow-hidden">
              <PremiumSectionHeader
                number={9}
                title="Interview & Hiring Insights"
                icon={<Star className="w-1.5 h-1.5" />}
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
            <div className="w-full max-w-full overflow-hidden">
              <PremiumSectionHeader
                number={10}
                title="Research Sources"
                icon={<Building2 className="w-1.5 h-1.5" />}
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
