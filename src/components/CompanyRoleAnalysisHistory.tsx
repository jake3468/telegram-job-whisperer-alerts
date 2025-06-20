
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, MapPin, Calendar, TrendingUp, Shield, Lightbulb } from 'lucide-react';
import { PercentageMeter } from '@/components/PercentageMeter';
import { BulletPointList } from '@/components/BulletPointList';

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
  created_at: string;
  updated_at: string;
}

interface CompanyRoleAnalysisHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  analyses: CompanyRoleAnalysisData[];
}

export const CompanyRoleAnalysisHistory: React.FC<CompanyRoleAnalysisHistoryProps> = ({
  isOpen,
  onClose,
  analyses,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-orbitron text-white">
            Company-Role Analysis History
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {analyses.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No analyses found.</p>
          ) : (
            analyses.map((analysis) => (
              <Card key={analysis.id} className="bg-gray-800/60 border-gray-700/40">
                <CardContent className="p-4 space-y-4">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="space-y-1 min-w-0 flex-1">
                      <h3 className="font-orbitron font-bold text-white text-base break-words">
                        {analysis.job_title} at {analysis.company_name}
                      </h3>
                      <p className="text-gray-400 text-sm flex items-center gap-1 break-words">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        {analysis.location}
                      </p>
                      {analysis.research_date && (
                        <p className="text-gray-400 text-sm flex items-center gap-1">
                          <Calendar className="w-3 h-3 flex-shrink-0" />
                          Research Date: {new Date(analysis.research_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {new Date(analysis.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* General Information */}
                  {analysis.local_role_market_context && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Market Context
                      </h4>
                      <p className="text-gray-300 text-sm leading-relaxed">
                        {analysis.local_role_market_context}
                      </p>
                    </div>
                  )}

                  {/* Company News Updates */}
                  {analysis.company_news_updates && analysis.company_news_updates.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Company News Updates
                      </h4>
                      <BulletPointList items={analysis.company_news_updates} />
                    </div>
                  )}

                  {/* Role Security Section */}
                  {(analysis.role_security_score !== null || analysis.role_security_outlook || analysis.role_security_automation_risks || analysis.role_security_departmental_trends || (analysis.role_security_score_breakdown && analysis.role_security_score_breakdown.length > 0)) && (
                    <div className="space-y-3 p-3 bg-gray-800/30 rounded-lg border border-gray-700/20">
                      <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Role Security Analysis
                      </h4>
                      
                      {analysis.role_security_score !== null && (
                        <PercentageMeter 
                          score={analysis.role_security_score} 
                          label="Security Score" 
                        />
                      )}
                      
                      {analysis.role_security_score_breakdown && analysis.role_security_score_breakdown.length > 0 && (
                        <BulletPointList 
                          items={analysis.role_security_score_breakdown} 
                          title="Score Breakdown"
                        />
                      )}
                      
                      {analysis.role_security_outlook && (
                        <div className="space-y-1">
                          <h5 className="text-xs font-medium text-gray-400">Outlook</h5>
                          <p className="text-gray-300 text-xs leading-relaxed">{analysis.role_security_outlook}</p>
                        </div>
                      )}
                      
                      {analysis.role_security_automation_risks && (
                        <div className="space-y-1">
                          <h5 className="text-xs font-medium text-gray-400">Automation Risks</h5>
                          <p className="text-gray-300 text-xs leading-relaxed">{analysis.role_security_automation_risks}</p>
                        </div>
                      )}
                      
                      {analysis.role_security_departmental_trends && (
                        <div className="space-y-1">
                          <h5 className="text-xs font-medium text-gray-400">Departmental Trends</h5>
                          <p className="text-gray-300 text-xs leading-relaxed">{analysis.role_security_departmental_trends}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Role Experience Section */}
                  {(analysis.role_experience_score !== null || analysis.role_experience_specific_insights || (analysis.role_experience_score_breakdown && analysis.role_experience_score_breakdown.length > 0)) && (
                    <div className="space-y-3 p-3 bg-gray-800/30 rounded-lg border border-gray-700/20">
                      <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4" />
                        Role Experience Analysis
                      </h4>
                      
                      {analysis.role_experience_score !== null && (
                        <PercentageMeter 
                          score={analysis.role_experience_score} 
                          label="Experience Score" 
                        />
                      )}
                      
                      {analysis.role_experience_score_breakdown && analysis.role_experience_score_breakdown.length > 0 && (
                        <BulletPointList 
                          items={analysis.role_experience_score_breakdown} 
                          title="Score Breakdown"
                        />
                      )}
                      
                      {analysis.role_experience_specific_insights && (
                        <div className="space-y-1">
                          <h5 className="text-xs font-medium text-gray-400">Specific Insights</h5>
                          <p className="text-gray-300 text-xs leading-relaxed">{analysis.role_experience_specific_insights}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
