import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Building2, MapPin, Briefcase, Loader2, RotateCcw } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { useCreditCheck } from '@/hooks/useCreditCheck';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { CompanyRoleAnalysisHistory } from '@/components/CompanyRoleAnalysisHistory';
import LoadingMessages from '@/components/LoadingMessages';

interface CompanyRoleAnalysisData {
  id: string;
  company_name: string;
  location: string;
  job_title: string;
  analysis_result: string | null;
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
    enabled: !!userProfile?.id,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userProfile?.id) {
      toast({
        title: "Profile Required",
        description: "Please complete your profile before generating company-role analysis.",
        variant: "destructive",
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
        variant: "destructive",
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
          job_title: jobTitle.trim(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating company-role analysis:', error);
        toast({
          title: "Error",
          description: "Failed to create company-role analysis. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Analysis Started",
        description: "Your company-role analysis is being generated. You'll see results shortly!",
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
        variant: "destructive",
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
      <div className="min-h-screen bg-gradient-to-br from-violet-950 via-purple-900 to-indigo-950 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header Section */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Building2 className="w-12 h-12 text-violet-400" />
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-orbitron font-extrabold text-transparent bg-gradient-to-r from-violet-400 via-purple-500 to-indigo-400 bg-clip-text">
                Company - Role Analysis
              </h1>
            </div>
            <p className="text-lg sm:text-xl text-violet-200 max-w-3xl mx-auto leading-relaxed">
              Smart candidates don't just apply—they investigate. Get the career intelligence that puts you ahead of 99% of applicants.
            </p>
          </div>

          {/* Analysis Form */}
          <Card className="bg-black/40 border-violet-500/20 backdrop-blur-sm shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-violet-800/30 via-purple-700/30 to-indigo-800/30 border-b border-violet-500/20">
              <CardTitle className="text-2xl font-orbitron text-violet-200">
                Company & Role Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Company Name */}
                  <div className="space-y-2">
                    <Label htmlFor="companyName" className="text-violet-200 font-medium flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Company Name *
                    </Label>
                    <Input
                      id="companyName"
                      type="text"
                      placeholder="e.g., Google, Microsoft, Amazon"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="bg-violet-950/50 border-violet-500/30 text-violet-100 placeholder:text-violet-400 focus:border-violet-400 focus:ring-violet-400/20"
                      required
                    />
                  </div>

                  {/* Location */}
                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-violet-200 font-medium flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Location *
                    </Label>
                    <Input
                      id="location"
                      type="text"
                      placeholder="e.g., San Francisco, New York, Remote"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="bg-violet-950/50 border-violet-500/30 text-violet-100 placeholder:text-violet-400 focus:border-violet-400 focus:ring-violet-400/20"
                      required
                    />
                  </div>
                </div>

                {/* Job Title */}
                <div className="space-y-2">
                  <Label htmlFor="jobTitle" className="text-violet-200 font-medium flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Job Title *
                  </Label>
                  <Input
                    id="jobTitle"
                    type="text"
                    placeholder="e.g., Senior Software Engineer, Product Manager, Data Scientist"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="bg-violet-950/50 border-violet-500/30 text-violet-100 placeholder:text-violet-400 focus:border-violet-400 focus:ring-violet-400/20"
                    required
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting || !hasCredits}
                    className="flex-1 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:via-purple-700 hover:to-indigo-700 text-white font-orbitron font-bold py-6 text-lg shadow-2xl shadow-violet-600/25 border-0"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Analyzing Company & Role...
                      </>
                    ) : (
                      <>
                        <Building2 className="w-5 h-5 mr-2" />
                        Generate Analysis (1.5 Credits)
                      </>
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    className="border-violet-500/50 text-violet-300 hover:bg-violet-800/20 hover:text-violet-200 font-orbitron"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Loading Messages */}
          {isSubmitting && (
            <LoadingMessages 
              messages={[
                "🔍 Researching company culture and values...",
                "📊 Analyzing role requirements and expectations...",
                "💡 Identifying key success factors...",
                "🎯 Preparing strategic insights...",
                "✨ Finalizing your competitive advantage report..."
              ]}
            />
          )}

          {/* History Section */}
          {analysisHistory && analysisHistory.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-orbitron font-bold text-violet-200">
                  Recent Company-Role Analyses
                </h2>
                <Button
                  onClick={() => setIsHistoryOpen(true)}
                  variant="outline"
                  className="border-violet-500/50 text-violet-300 hover:bg-violet-800/20 hover:text-violet-200 font-orbitron"
                >
                  View All History
                </Button>
              </div>
              
              <div className="grid gap-4">
                {analysisHistory.slice(0, 3).map((analysis) => (
                  <Card key={analysis.id} className="bg-black/40 border-violet-500/20 backdrop-blur-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="font-orbitron font-bold text-violet-200">
                            {analysis.job_title} at {analysis.company_name}
                          </h3>
                          <p className="text-violet-400 text-sm flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {analysis.location}
                          </p>
                        </div>
                        <span className="text-xs text-violet-400">
                          {new Date(analysis.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {analysis.analysis_result && (
                        <div className="mt-3 p-3 bg-violet-950/30 rounded-lg border border-violet-500/20">
                          <p className="text-violet-200 text-sm line-clamp-3">
                            {analysis.analysis_result}
                          </p>
                        </div>
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
