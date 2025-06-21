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
export const PremiumAnalysisResults: React.FC<PremiumAnalysisResultsProps> = ({
  analysis
}) => {
  return <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 to-white overflow-hidden min-w-0">
      <div className="w-full max-w-xs sm:max-w-md md:max-w-2xl lg:max-w-4xl mx-auto px-1 sm:px-2 md:px-4 py-2 sm:py-4 space-y-3 sm:space-y-4 min-w-0 overflow-hidden">
        {/* Hero Section */}
        <div className="w-full min-w-0 overflow-hidden">
          <div className="w-full bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden min-w-0">
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-2 sm:p-3 text-white min-w-0 overflow-hidden">
              <div className="w-full flex flex-col gap-2 sm:gap-3 min-w-0 overflow-hidden">
                <div className="w-full space-y-1 sm:space-y-2 min-w-0 overflow-hidden">
                  <div className="w-full flex items-start gap-2 sm:gap-3 min-w-0 overflow-hidden">
                    <div className="p-1 sm:p-2 bg-white/20 rounded-lg backdrop-blur-sm flex-shrink-0">
                      <Building2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    </div>
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <h1 className="text-xs sm:text-sm font-bold leading-tight break-words hyphens-auto overflow-wrap-anywhere md:text-2xl">
                        {analysis.job_title}
                      </h1>
                      <p className="text-blue-100 mt-1 break-words hyphens-auto overflow-wrap-anywhere text-base">
                        at {analysis.company_name}
                      </p>
                    </div>
                  </div>
                  
                  <div className="w-full flex flex-wrap gap-1 text-xs min-w-0 overflow-hidden">
                    <div className="flex items-center gap-1 bg-white/10 px-1 sm:px-2 py-1 rounded-full backdrop-blur-sm min-w-0 overflow-hidden">
                      <MapPin className="w-2 h-2 flex-shrink-0" />
                      <span className="break-words truncate overflow-wrap-anywhere text-sm">{analysis.location}</span>
                    </div>
                    {analysis.research_date && <div className="flex items-center gap-1 bg-white/10 px-1 sm:px-2 py-1 rounded-full backdrop-blur-sm min-w-0 overflow-hidden">
                        <Calendar className="w-2 h-2 flex-shrink-0" />
                        <span className="break-words truncate overflow-wrap-anywhere text-sm">
                          {new Date(analysis.research_date).toLocaleDateString()}
                        </span>
                      </div>}
                  </div>
                </div>

                {/* Key Metrics Dashboard */}
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2 min-w-0 overflow-hidden">
                  {analysis.role_security_score !== null && <div className="backdrop-blur-sm rounded-lg p-1 sm:p-2 text-center min-w-0 overflow-hidden bg-violet-950">
                      <div className="text-sm sm:text-base font-bold mb-1">
                        {analysis.role_security_score}%
                      </div>
                      <div className="text-xs text-blue-100 mb-1 truncate">Security Score</div>
                      <div className="flex justify-center">
                        <Award className="w-3 h-3 text-yellow-300" />
                      </div>
                    </div>}
                  {analysis.role_experience_score !== null && <div className="backdrop-blur-sm rounded-lg p-1 sm:p-2 text-center min-w-0 overflow-hidden bg-violet-950">
                      <div className="text-sm sm:text-base font-bold mb-1">
                        {analysis.role_experience_score}%
                      </div>
                      <div className="text-xs text-blue-100 mb-1 truncate">Experience Score</div>
                      <div className="flex justify-center">
                        <Star className="w-3 h-3 text-yellow-300" />
                      </div>
                    </div>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Analysis Sections */}
        <div className="w-full space-y-3 sm:space-y-4 min-w-0 overflow-hidden">
          {/* Market Context - Section 1 */}
          {analysis.local_role_market_context && <div className="w-full min-w-0 overflow-hidden">
              <PremiumSectionHeader number={1} title="Market Context Analysis" icon={<TrendingUp className="w-4 h-4" />} gradient="from-blue-500 to-cyan-500" description="Current market trends and opportunities" />
              <Card className="w-full bg-white shadow-lg border-0 rounded-lg overflow-hidden min-w-0">
                <CardContent className="p-2 w-full min-w-0 overflow-hidden">
                  <div className="w-full bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-2 border-l-4 border-blue-500 min-w-0 overflow-hidden">
                    <p className="text-gray-700 leading-relaxed text-xs break-words hyphens-auto overflow-wrap-anywhere">
                      {analysis.local_role_market_context}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>}

          {/* Company News - Section 2 */}
          {analysis.company_news_updates && analysis.company_news_updates.length > 0 && <div className="w-full min-w-0 overflow-hidden">
              <PremiumSectionHeader number={2} title="Company News & Updates" icon={<Building2 className="w-4 h-4" />} gradient="from-orange-500 to-red-500" description="Latest developments and company insights" />
              <Card className="w-full bg-white shadow-lg border-0 rounded-lg overflow-hidden min-w-0">
                <CardContent className="p-2 w-full min-w-0 overflow-hidden">
                  <PremiumBulletPointList items={analysis.company_news_updates} theme="orange" />
                </CardContent>
              </Card>
            </div>}

          {/* Role Security Analysis - Section 3 */}
          {(analysis.role_security_score !== null || analysis.role_security_outlook || analysis.role_security_automation_risks || analysis.role_security_departmental_trends || analysis.role_security_score_breakdown && analysis.role_security_score_breakdown.length > 0) && <div className="w-full min-w-0 overflow-hidden">
              <PremiumSectionHeader number={3} title="Role Security Analysis" icon={<Award className="w-4 h-4" />} gradient="from-green-500 to-emerald-500" description="Job stability and future outlook" />
              <Card className="w-full bg-white shadow-lg border-0 rounded-lg overflow-hidden min-w-0">
                <CardContent className="p-2 w-full space-y-2 min-w-0 overflow-hidden">
                  {analysis.role_security_score !== null && <EnhancedPercentageMeter score={analysis.role_security_score} label="Security Score" theme="green" />}
                  
                  {analysis.role_security_score_breakdown && analysis.role_security_score_breakdown.length > 0 && <PremiumBulletPointList items={analysis.role_security_score_breakdown} title="Score Breakdown" theme="green" />}
                  
                  {analysis.role_security_outlook && <div className="w-full bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-2 border-l-4 border-green-500 min-w-0 overflow-hidden">
                      <h4 className="font-bold text-green-800 text-xs mb-1">Outlook</h4>
                      <p className="text-gray-700 leading-relaxed text-xs break-words hyphens-auto overflow-wrap-anywhere">
                        {analysis.role_security_outlook}
                      </p>
                    </div>}
                  
                  {analysis.role_security_automation_risks && <div className="w-full bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-2 border-l-4 border-yellow-500 min-w-0 overflow-hidden">
                      <h4 className="font-bold text-yellow-800 text-xs mb-1">Automation Risks</h4>
                      <p className="text-gray-700 leading-relaxed text-xs break-words hyphens-auto overflow-wrap-anywhere">
                        {analysis.role_security_automation_risks}
                      </p>
                    </div>}
                  
                  {analysis.role_security_departmental_trends && <div className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-2 border-l-4 border-blue-500 min-w-0 overflow-hidden">
                      <h4 className="font-bold text-blue-800 text-xs mb-1">Departmental Trends</h4>
                      <p className="text-gray-700 leading-relaxed text-xs break-words hyphens-auto overflow-wrap-anywhere">
                        {analysis.role_security_departmental_trends}
                      </p>
                    </div>}
                </CardContent>
              </Card>
            </div>}

          {/* Role Experience Analysis - Section 4 */}
          {(analysis.role_experience_score !== null || analysis.role_experience_specific_insights || analysis.role_experience_score_breakdown && analysis.role_experience_score_breakdown.length > 0) && <div className="w-full min-w-0 overflow-hidden">
              <PremiumSectionHeader number={4} title="Role Experience Analysis" icon={<Star className="w-4 h-4" />} gradient="from-purple-500 to-pink-500" description="Experience requirements and career fit" />
              <Card className="w-full bg-white shadow-lg border-0 rounded-lg overflow-hidden min-w-0">
                <CardContent className="p-2 w-full space-y-2 min-w-0 overflow-hidden">
                  {analysis.role_experience_score !== null && <EnhancedPercentageMeter score={analysis.role_experience_score} label="Experience Score" theme="purple" />}
                  
                  {analysis.role_experience_score_breakdown && analysis.role_experience_score_breakdown.length > 0 && <PremiumBulletPointList items={analysis.role_experience_score_breakdown} title="Score Breakdown" theme="purple" />}
                  
                  {analysis.role_experience_specific_insights && <div className="w-full bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-2 border-l-4 border-purple-500 min-w-0 overflow-hidden">
                      <h4 className="font-bold text-purple-800 text-xs mb-1">Specific Insights</h4>
                      <p className="text-gray-700 leading-relaxed text-xs break-words hyphens-auto overflow-wrap-anywhere">
                        {analysis.role_experience_specific_insights}
                      </p>
                    </div>}
                </CardContent>
              </Card>
            </div>}

          {/* JSON Sections with premium styling */}
          {analysis.role_compensation_analysis && <div className="w-full min-w-0 overflow-hidden">
              <PremiumSectionHeader number={5} title="Compensation Analysis" icon={<TrendingUp className="w-4 h-4" />} gradient="from-yellow-500 to-orange-500" description="Salary insights and benefits breakdown" />
              <div className="w-full min-w-0 overflow-hidden">
                <PremiumJSONDisplay data={analysis.role_compensation_analysis} theme="yellow" />
              </div>
            </div>}

          {analysis.role_workplace_environment && <div className="w-full min-w-0 overflow-hidden">
              <PremiumSectionHeader number={6} title="Workplace Environment" icon={<Building2 className="w-4 h-4" />} gradient="from-teal-500 to-cyan-500" description="Company culture and work environment" />
              <div className="w-full min-w-0 overflow-hidden">
                <PremiumJSONDisplay data={analysis.role_workplace_environment} theme="teal" />
              </div>
            </div>}

          {analysis.career_development && <div className="w-full min-w-0 overflow-hidden">
              <PremiumSectionHeader number={7} title="Career Development" icon={<TrendingUp className="w-4 h-4" />} gradient="from-indigo-500 to-purple-500" description="Growth opportunities and advancement paths" />
              <div className="w-full min-w-0 overflow-hidden">
                <PremiumJSONDisplay data={analysis.career_development} theme="indigo" />
              </div>
            </div>}

          {analysis.role_specific_considerations && <div className="w-full min-w-0 overflow-hidden">
              <PremiumSectionHeader number={8} title="Role-Specific Considerations" icon={<Award className="w-4 h-4" />} gradient="from-blue-400 to-indigo-400" description="Important factors and considerations" />
              <div className="w-full min-w-0 overflow-hidden">
                <PremiumJSONDisplay data={analysis.role_specific_considerations} theme="blue" />
              </div>
            </div>}

          {analysis.interview_and_hiring_insights && <div className="w-full min-w-0 overflow-hidden">
              <PremiumSectionHeader number={9} title="Interview & Hiring Insights" icon={<Star className="w-4 h-4" />} gradient="from-violet-500 to-purple-500" description="Interview preparation and hiring process" />
              <div className="w-full min-w-0 overflow-hidden">
                <PremiumJSONDisplay data={analysis.interview_and_hiring_insights} theme="violet" />
              </div>
            </div>}

          {/* Sources Section */}
          {analysis.sources && <div className="w-full min-w-0 overflow-hidden">
              <PremiumSectionHeader number={10} title="Research Sources" icon={<Building2 className="w-4 h-4" />} gradient="from-gray-500 to-slate-500" description="Trusted sources and references" />
              <div className="w-full min-w-0 overflow-hidden">
                <PremiumSourcesDisplay sources={analysis.sources} />
              </div>
            </div>}
        </div>
      </div>
    </div>;
};
