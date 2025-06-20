import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  const {
    toast
  } = useToast();
  const {
    userProfile
  } = useUserProfile();
  const {
    hasCredits,
    showInsufficientCreditsPopup
  } = useCreditCheck(1.5);

  // Fetch company-role analysis history
  const {
    data: analysisHistory,
    refetch: refetchHistory
  } = useQuery({
    queryKey: ['company_role_analyses', userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id) return [];
      const {
        data,
        error
      } = await supabase.from('company_role_analyses').select('*').eq('user_id', userProfile.id).order('created_at', {
        ascending: false
      });
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
      const {
        data,
        error
      } = await supabase.from('company_role_analyses').insert({
        user_id: userProfile.id,
        company_name: companyName.trim(),
        location: location.trim(),
        job_title: jobTitle.trim()
      }).select().single();
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
  return <Layout>
      <div className="min-h-screen bg-black p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header Section */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Building2 className="w-12 h-12 text-green-400" />
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-orbitron font-extrabold text-transparent bg-gradient-to-r from-green-400 via-green-500 to-green-600 bg-clip-text">
                Company Decoder
              </h1>
            </div>
            <p className="text-lg text-white max-w-3xl mx-auto leading-relaxed sm:text-lg font-light">
              Smart candidates don't just apply—they investigate. Get the career intelligence that puts you ahead of 99% of applicants.
            </p>
          </div>

          {/* Analysis Form */}
          <Card className="bg-gradient-to-br from-green-500 via-green-600 to-green-700 border-green-400/30 shadow-2xl mx-auto max-w-3xl">
            <CardHeader className="bg-gradient-to-r from-green-600/90 via-green-700/90 to-green-800/90 border-b border-green-400/30">
              <CardTitle className="text-2xl font-orbitron text-left text-black">
                Company & Role Intelligence
              </CardTitle>
              <p className="text-green-100 font-medium mt-2 text-left">
                Provide company details to uncover hidden red flags and green lights
              </p>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Company Name and Location Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName" className="text-white font-medium flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Company Name *
                    </Label>
                    <Input id="companyName" type="text" placeholder="e.g., Google, Microsoft, Amazon" value={companyName} onChange={e => setCompanyName(e.target.value)} className="bg-white border-green-300 text-black placeholder:text-gray-500 focus:border-green-500 focus:ring-green-500/20 h-12" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-white font-medium flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Location *
                    </Label>
                    <Input id="location" type="text" placeholder="e.g., San Francisco, New York, Remote" value={location} onChange={e => setLocation(e.target.value)} className="bg-white border-green-300 text-black placeholder:text-gray-500 focus:border-green-500 focus:ring-green-500/20 h-12" required />
                  </div>
                </div>

                {/* Job Title */}
                <div className="space-y-2">
                  <Label htmlFor="jobTitle" className="text-white font-medium flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Job Title *
                  </Label>
                  <Input id="jobTitle" type="text" placeholder="e.g., Senior Software Engineer, Product Manager, Data Scientist" value={jobTitle} onChange={e => setJobTitle(e.target.value)} className="bg-white border-green-300 text-black placeholder:text-gray-500 focus:border-green-500 focus:ring-green-500/20 h-12" required />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button type="submit" disabled={isSubmitting || !hasCredits} className="flex-1 bg-gradient-to-r from-green-700 via-green-800 to-green-900 hover:from-green-800 hover:via-green-900 hover:to-green-950 text-white font-orbitron font-bold py-6 text-lg shadow-2xl shadow-green-600/25 border-0">
                    {isSubmitting ? <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Analyzing Company & Role...
                      </> : <>
                        <Building2 className="w-5 h-5 mr-2" />
                        Generate Analysis (1.5 Credits)
                      </>}
                  </Button>
                  
                  <Button type="button" variant="outline" onClick={handleReset} className="border-white/50 text-white hover:bg-white/20 hover:text-white font-orbitron bg-transparent">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Loading Messages */}
          {isSubmitting && <LoadingMessages type="company_analysis" />}

          {/* History Section */}
          {analysisHistory && analysisHistory.length > 0 && <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-orbitron font-bold text-white">
                  Recent Company-Role Analyses
                </h2>
                <Button onClick={() => setIsHistoryOpen(true)} variant="outline" className="border-white/50 text-white hover:bg-white/20 hover:text-white font-orbitron bg-transparent">
                  View All History
                </Button>
              </div>
              
              <div className="grid gap-4">
                {analysisHistory.slice(0, 3).map(analysis => <Card key={analysis.id} className="bg-gray-900/60 border-gray-700/40 backdrop-blur-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="font-orbitron font-bold text-white">
                            {analysis.job_title} at {analysis.company_name}
                          </h3>
                          <p className="text-gray-400 text-sm flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {analysis.location}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(analysis.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {analysis.analysis_result && <div className="mt-3 p-3 bg-gray-800/30 rounded-lg border border-gray-700/20">
                          <p className="text-gray-300 text-sm line-clamp-3">
                            {analysis.analysis_result}
                          </p>
                        </div>}
                    </CardContent>
                  </Card>)}
              </div>
            </div>}
        </div>
      </div>

      {/* History Modal */}
      <CompanyRoleAnalysisHistory isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} analyses={analysisHistory || []} />
    </Layout>;
};
export default CompanyRoleAnalysis;