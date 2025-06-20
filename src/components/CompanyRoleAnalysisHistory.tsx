
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building2, MapPin, Briefcase, Calendar, Search, X } from 'lucide-react';

interface CompanyRoleAnalysisData {
  id: string;
  company_name: string;
  location: string;
  job_title: string;
  analysis_result: string | null;
  created_at: string;
  updated_at: string;
}

interface CompanyRoleAnalysisHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  analyses: CompanyRoleAnalysisData[];
}

export function CompanyRoleAnalysisHistory({ isOpen, onClose, analyses }: CompanyRoleAnalysisHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAnalysis, setSelectedAnalysis] = useState<CompanyRoleAnalysisData | null>(null);

  const filteredAnalyses = analyses.filter(analysis =>
    analysis.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    analysis.job_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    analysis.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleClose = () => {
    setSelectedAnalysis(null);
    setSearchTerm('');
    onClose();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] bg-gradient-to-br from-violet-950 via-purple-900 to-indigo-950 border-violet-500/20">
        <DialogHeader className="border-b border-violet-500/20 pb-4">
          <DialogTitle className="text-2xl font-orbitron font-bold text-transparent bg-gradient-to-r from-violet-400 via-purple-500 to-indigo-400 bg-clip-text">
            Company-Role Analysis History
          </DialogTitle>
        </DialogHeader>

        {!selectedAnalysis ? (
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-violet-400" />
              <Input
                type="text"
                placeholder="Search by company, role, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-violet-950/50 border-violet-500/30 text-violet-100 placeholder:text-violet-400 focus:border-violet-400 focus:ring-violet-400/20"
              />
            </div>

            {/* Analysis List */}
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {filteredAnalyses.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="w-16 h-16 text-violet-400 mx-auto mb-4 opacity-50" />
                  <p className="text-violet-300">
                    {searchTerm ? 'No analyses match your search.' : 'No company-role analyses found.'}
                  </p>
                </div>
              ) : (
                filteredAnalyses.map((analysis) => (
                  <Card 
                    key={analysis.id} 
                    className="bg-black/40 border-violet-500/20 hover:border-violet-400/40 transition-colors cursor-pointer"
                    onClick={() => setSelectedAnalysis(analysis)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="space-y-1 flex-1">
                          <h3 className="font-orbitron font-bold text-violet-200 flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-violet-400" />
                            {analysis.job_title}
                          </h3>
                          <p className="text-violet-300 flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-violet-400" />
                            {analysis.company_name}
                          </p>
                          <p className="text-violet-400 text-sm flex items-center gap-2">
                            <MapPin className="w-3 h-3" />
                            {analysis.location}
                          </p>
                        </div>
                        <div className="text-right text-xs text-violet-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(analysis.created_at)}
                        </div>
                      </div>
                      
                      {analysis.analysis_result && (
                        <div className="mt-3 p-3 bg-violet-950/30 rounded-lg border border-violet-500/20">
                          <p className="text-violet-200 text-sm line-clamp-2">
                            {analysis.analysis_result}
                          </p>
                        </div>
                      )}
                      
                      {!analysis.analysis_result && (
                        <div className="mt-3 p-3 bg-orange-950/30 rounded-lg border border-orange-500/20">
                          <p className="text-orange-200 text-sm">
                            Analysis in progress...
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Back Button */}
            <Button
              onClick={() => setSelectedAnalysis(null)}
              variant="outline"
              className="border-violet-500/50 text-violet-300 hover:bg-violet-800/20 hover:text-violet-200"
            >
              <X className="w-4 h-4 mr-2" />
              Back to List
            </Button>

            {/* Selected Analysis Details */}
            <Card className="bg-black/40 border-violet-500/20">
              <CardContent className="p-6 space-y-4">
                <div className="border-b border-violet-500/20 pb-4">
                  <h3 className="text-2xl font-orbitron font-bold text-violet-200 mb-2">
                    {selectedAnalysis.job_title}
                  </h3>
                  <div className="space-y-2 text-violet-300">
                    <p className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-violet-400" />
                      <strong>Company:</strong> {selectedAnalysis.company_name}
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-violet-400" />
                      <strong>Location:</strong> {selectedAnalysis.location}
                    </p>
                    <p className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-violet-400" />
                      <strong>Generated:</strong> {formatDate(selectedAnalysis.created_at)}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-orbitron font-bold text-violet-200 mb-3">
                    Analysis Results
                  </h4>
                  {selectedAnalysis.analysis_result ? (
                    <div className="bg-violet-950/30 rounded-lg border border-violet-500/20 p-4">
                      <div className="prose prose-invert max-w-none">
                        <pre className="whitespace-pre-wrap text-violet-200 text-sm leading-relaxed">
                          {selectedAnalysis.analysis_result}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-orange-950/30 rounded-lg border border-orange-500/20 p-4">
                      <p className="text-orange-200">
                        Analysis is still being generated. Please check back in a few moments.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
