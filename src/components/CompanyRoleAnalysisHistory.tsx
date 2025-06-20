
import React from 'react';
import { Building2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PremiumAnalysisResults } from '@/components/PremiumAnalysisResults';

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
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto bg-white border-gray-200">
        <DialogHeader className="pb-4 border-b border-gray-200">
          <DialogTitle className="text-2xl font-orbitron text-gray-800 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            Company Analysis History
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-8 pt-6">
          {analyses.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-8 bg-gradient-to-r from-gray-50 to-slate-50 rounded-3xl border border-gray-200">
                <p className="text-gray-500 text-lg">No analyses found yet.</p>
                <p className="text-gray-400 text-sm mt-2">Start by creating your first company analysis!</p>
              </div>
            </div>
          ) : (
            analyses.map((analysis) => (
              <div key={analysis.id} className="border-b border-gray-100 last:border-b-0 pb-8 last:pb-0">
                <PremiumAnalysisResults analysis={analysis} />
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
