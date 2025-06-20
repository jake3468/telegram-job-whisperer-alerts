
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, MapPin, Briefcase, Loader2, RotateCcw, Calendar, TrendingUp, Shield, Lightbulb, DollarSign, Users, GraduationCap, AlertTriangle } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { useCreditCheck } from '@/hooks/useCreditCheck';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { CompanyRoleAnalysisHistory } from '@/components/CompanyRoleAnalysisHistory';
import LoadingMessages from '@/components/LoadingMessages';
import { PercentageMeter } from '@/components/PercentageMeter';
import { BulletPointList } from '@/components/BulletPointList';
import { JSONSectionDisplay } from '@/components/JSONSectionDisplay';
import { SourcesDisplay } from '@/components/SourcesDisplay';

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

const CompanyRoleAnalysis = () => {
  const [companyName, setCompanyName] = useState('');
  const [location, setLocation] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const { toast } = useToast();
  const { userProfile } = useUserProfile();
  const { hasCredits, showInsufficientCreditsPopup } = useCreditCheck(1.5);

  // Fetch company-role analysis history
  const { data: analysisHistory, refetch: refetchHistory } = useQuery({
    queryKey: ['company_role_analyses', userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id) return [];
      const { data, error } = await supabase
        .from('company_role_analyses')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching company-role analysis history:', error);
        return [];
      }
      return data as CompanyRoleAnalysisData[];
    },
    enabled: !!userProfile?.id
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.id) {
      toast({
        title: "Profile Required",
        description: "Please complete your profile before generating company-role analysis.",
        variant: "destructive"
      });
      return;
    }
    if (!hasCredits) {
      showInsufficientCreditsPopup();
      return;
    }
    if (!companyName.trim() || !location.trim() || !jobTitle.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('company_role_analyses')
        .insert({
          user_id: userProfile.id,
          company_name: companyName.trim(),
          location: location.trim(),
          job_title: jobTitle.trim()
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating company-role analysis:', error);
        toast({
          title: "Error",
          description: "Failed to create company-role analysis. Please try again.",
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "Analysis Started",
        description: "Your company-role analysis is being generated. You'll see results shortly!"
      });

      // Reset form
      setCompanyName('');
      setLocation('');
      setJobTitle('');

      // Refetch history to show the new analysis
      refetchHistory();
    } catch (error) {
      console.error('Error submitting company-role analysis:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setCompanyName('');
    setLocation('');
    setJobTitle('');
  };

  return (
    <Layout>
      <div className="min-h-screen bg-black px-2 py-4 sm:px-4 sm:py-6 lg:px-8 lg:py-8">
        <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
          {/* Header Section */}
          <div className="text-center space-y-3 sm:space-y-4 px-2">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <Building2 className="w-10 h-10 sm:w-12 sm:h-12 text-green-400" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-orbitron font-extrabold text-transparent bg-gradient-to-r from-green-400 via-green-500 to-green-600 bg-clip-text">
                Company Decoder
              </h1>
            </div>
            <p className="text-base sm:text-lg text-white max-w-3xl mx-auto leading-relaxed font-light px-2">
              Smart candidates don't just apply—they investigate. Get the career intelligence that puts you ahead of 99% of applicants.
            </p>
          </div>

          {/* Analysis Form */}
          <div className="w-full px-2">
            <Card className="bg-gradient-to-br from-green-500 via-green-600 to-green-700 border-green-400/30 shadow-2xl w-full max-w-full">
              <CardHeader className="bg-gradient-to-r from-green-600/90 via-green-700/90 to-green-800/90 border-b border-green-400/30 p-4 sm:p-6">
                <CardTitle className="text-xl sm:text-2xl font-orbitron text-left font-normal text-gray-50">
                  Company & Role Intelligence
                </CardTitle>
                <p className="text-green-100 font-medium mt-2 text-left text-sm sm:text-base">
                  Provide company details to uncover hidden red flags and green lights
                </p>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                  {/* Company Name and Location Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName" className="text-white font-medium flex items-center gap-2 text-sm sm:text-base">
                        <Building2 className="w-4 h-4" />
                        Company Name *
                      </Label>
                      <Input
                        id="companyName"
                        type="text"
                        placeholder="e.g., Google, Microsoft, Amazon"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        required
                        className="border-green-300 text-white placeholder:text-gray-500 focus:border-green-500 focus:ring-green-500/20 h-10 sm:h-12 w-full text-sm sm:text-base bg-zinc-950"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location" className="text-white font-medium flex items-center gap-2 text-sm sm:text-base">
                        <MapPin className="w-4 h-4" />
                        Location *
                      </Label>
                      <Input
                        id="location"
                        type="text"
                        placeholder="e.g., San Francisco, New York, Remote"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        required
                        className="border-green-300 text-white placeholder:text-gray-500 focus:border-green-500 focus:ring-green-500/20 h-10 sm:h-12 w-full text-sm sm:text-base bg-zinc-950"
                      />
                    </div>
                  </div>

                  {/* Job Title */}
                  <div className="space-y-2">
                    <Label htmlFor="jobTitle" className="text-white font-medium flex items-center gap-2 text-sm sm:text-base">
                      <Briefcase className="w-4 h-4" />
                      Job Title *
                    </Label>
                    <Input
                      id="jobTitle"
                      type="text"
                      placeholder="e.g., Senior Software Engineer, Product Manager, Data Scientist"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      required
                      className="border-green-300 text-white placeholder:text-gray-500 focus:border-green-500 focus:ring-green-500/20 h-10 sm:h-12 w-full text-sm sm:text-base bg-zinc-950"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-3 sm:gap-4 pt-2 sm:pt-4">
                    <Button
                      type="submit"
                      disabled={isSubmitting || !hasCredits}
                      className="w-full bg-gradient-to-r from-green-700 via-green-800 to-green-900 hover:from-green-800 hover:via-green-900 hover:to-green-950 text-white font-orbitron font-bold py-4 sm:py-6 text-sm sm:text-lg shadow-2xl shadow-green-600/25 border-0"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                          Analyzing Company & Role...
                        </>
                      ) : (
                        <>
                          <Building2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                          Generate Analysis (1.5 Credits)
                        </>
                      )}
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleReset}
                      className="w-full sm:w-auto border-white/50 text-white hover:bg-white/20 hover:text-white font-orbitron bg-transparent py-3 sm:py-4 text-sm sm:text-base"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reset
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Loading Messages */}
          {isSubmitting && <LoadingMessages type="company_analysis" />}

          {/* Results Section */}
          {analysisHistory && analysisHistory.length > 0 && (
            <div className="space-y-4 px-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h2 className="text-xl sm:text-2xl font-orbitron font-bold text-white">
                  Recent Company-Role Analyses
                </h2>
                <Button
                  onClick={() => setIsHistoryOpen(true)}
                  variant="outline"
                  className="w-full sm:w-auto border-white/50 text-white hover:bg-white/20 hover:text-white font-orbitron bg-transparent text-sm sm:text-base"
                >
                  View All History
                </Button>
              </div>
              
              <div className="grid gap-3 sm:gap-4">
                {analysisHistory.slice(0, 3).map((analysis) => (
                  <Card key={analysis.id} className="bg-gray-900/60 border-gray-700/40 backdrop-blur-sm">
                    <CardContent className="p-3 sm:p-4 space-y-4">
                      {/* Header */}
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div className="space-y-1 min-w-0 flex-1">
                          <h3 className="font-orbitron font-bold text-white text-sm sm:text-base break-words">
                            {analysis.job_title} at {analysis.company_name}
                          </h3>
                          <p className="text-gray-400 text-xs sm:text-sm flex items-center gap-1 break-words">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            {analysis.location}
                          </p>
                          {analysis.research_date && (
                            <p className="text-gray-400 text-xs sm:text-sm flex items-center gap-1">
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
                          <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
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

                      {/* New JSON Sections */}
                      {analysis.role_compensation_analysis && (
                        <JSONSectionDisplay
                          title="Compensation Details"
                          data={analysis.role_compensation_analysis}
                          icon={<DollarSign className="w-4 h-4" />}
                        />
                      )}

                      {analysis.role_workplace_environment && (
                        <JSONSectionDisplay
                          title="Workplace Environment"
                          data={analysis.role_workplace_environment}
                          icon={<Users className="w-4 h-4" />}
                        />
                      )}

                      {analysis.career_development && (
                        <JSONSectionDisplay
                          title="Career Development"
                          data={analysis.career_development}
                          icon={<GraduationCap className="w-4 h-4" />}
                        />
                      )}

                      {analysis.role_specific_considerations && (
                        <JSONSectionDisplay
                          title="Specific Considerations"
                          data={analysis.role_specific_considerations}
                          icon={<AlertTriangle className="w-4 h-4" />}
                        />
                      )}

                      {analysis.interview_and_hiring_insights && (
                        <JSONSectionDisplay
                          title="Interview & Hiring Insights"
                          data={analysis.interview_and_hiring_insights}
                          icon={<Briefcase className="w-4 h-4" />}
                        />
                      )}

                      {analysis.sources && (
                        <SourcesDisplay sources={analysis.sources} />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* History Modal */}
      <CompanyRoleAnalysisHistory
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        analyses={analysisHistory || []}
      />
    </Layout>
  );
};

export default CompanyRoleAnalysis;
