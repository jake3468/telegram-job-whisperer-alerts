import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useCachedUserProfile } from '@/hooks/useCachedUserProfile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Trash2 } from 'lucide-react';
const ResumeSection = () => {
  const {
    user
  } = useUser();
  const {
    toast
  } = useToast();
  const {
    resumeExists,
    updateResumeStatus
  } = useCachedUserProfile();
  const [uploading, setUploading] = useState(false);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  useEffect(() => {
    if (user && !resumeExists) {
      // Only check for resume if we don't have cached status
      checkExistingResume();
    } else if (resumeExists && user) {
      // If we know resume exists, set the URL immediately
      const fileName = `${user.id}/resume.pdf`;
      const {
        data: urlData
      } = supabase.storage.from('resumes').getPublicUrl(fileName);
      setResumeUrl(urlData.publicUrl);
    }
  }, [user, resumeExists]);
  const checkExistingResume = async () => {
    if (!user) return;
    try {
      const fileName = `${user.id}/resume.pdf`;
      const {
        data,
        error
      } = await supabase.storage.from('resumes').list(user.id, {
        limit: 1,
        search: 'resume.pdf'
      });
      if (error) {
        console.error('Error checking existing resume:', error);
        return;
      }
      if (data && data.length > 0) {
        const {
          data: urlData
        } = supabase.storage.from('resumes').getPublicUrl(fileName);
        setResumeUrl(urlData.publicUrl);
        updateResumeStatus(true); // Cache that resume exists
      } else {
        updateResumeStatus(false); // Cache that resume doesn't exist
      }
    } catch (error) {
      console.error('Error checking existing resume:', error);
    }
  };
  const callResumeWebhook = async (fileUrl: string, fileName: string, fileSize: number) => {
    try {
      console.log('Calling resume PDF webhook...');

      // Get user data for the webhook payload
      const {
        data: userData,
        error: userError
      } = await supabase.from('users').select('*').eq('clerk_id', user?.id).single();
      if (userError) {
        console.error('Error fetching user data for webhook:', userError);
        return;
      }
      const payload = {
        event_type: 'resume_uploaded',
        user: {
          id: userData.id,
          clerk_id: userData.clerk_id,
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name
        },
        resume: {
          file_url: fileUrl,
          file_name: fileName,
          file_size: fileSize,
          uploaded_at: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      };
      const {
        error: webhookError
      } = await supabase.functions.invoke('resume-pdf-webhook', {
        body: payload
      });
      if (webhookError) {
        console.error('Error calling resume webhook:', webhookError);
      }
    } catch (error) {
      console.error('Error in resume webhook call:', error);
    }
  };
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file only.",
        variant: "destructive"
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 5MB.",
        variant: "destructive"
      });
      return;
    }
    if (uploading) return;
    setUploading(true);
    try {
      const fileName = `${user.id}/resume.pdf`;
      const {
        error: uploadError
      } = await supabase.storage.from('resumes').upload(fileName, file, {
        upsert: true
      });
      if (uploadError) {
        toast({
          title: "Upload failed",
          description: `Error: ${uploadError.message}`,
          variant: "destructive"
        });
        throw uploadError;
      }
      const {
        data
      } = supabase.storage.from('resumes').getPublicUrl(fileName);
      setResumeUrl(data.publicUrl);
      updateResumeStatus(true); // Cache that resume now exists
      await callResumeWebhook(data.publicUrl, file.name, file.size);
      toast({
        title: "Resume uploaded successfully",
        description: "Your resume has been saved."
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "There was an error uploading your resume. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };
  const handleDeleteResume = async () => {
    if (!user) return;
    try {
      const fileName = `${user.id}/resume.pdf`;
      const {
        error
      } = await supabase.storage.from('resumes').remove([fileName]);
      if (error) throw error;
      setResumeUrl(null);
      updateResumeStatus(false); // Cache that resume no longer exists
      toast({
        title: "Resume deleted",
        description: "Your resume has been removed."
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "There was an error deleting your resume.",
        variant: "destructive"
      });
    }
  };
  const triggerFileInput = () => {
    if (!uploading) {
      const fileInput = document.getElementById('resume-upload') as HTMLInputElement;
      fileInput?.click();
    }
  };
  return <section className="p-0 rounded-none bg-transparent shadow-none">
      <Card className="
          rounded-3xl border border-amber-500/30 
          bg-gradient-to-br from-amber-900/20 via-orange-900/15 to-amber-900/20
          shadow-2xl shadow-amber-900/20 transition-all hover:shadow-amber-700/30
          backdrop-blur-sm hover:border-amber-400/50
        ">
        <CardHeader className="pb-4">
          <CardTitle className="text-amber-100 font-orbitron flex items-center gap-3 text-lg">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className="text-amber-100 font-bold">Resume</span>
          </CardTitle>
          <CardDescription className="text-amber-200 font-inter font-normal text-base leading-relaxed">Upload your resume (PDF, max 5MB) so our AI can better understand your background and personalize your experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          {resumeUrl ? <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-xl border border-amber-500/30 bg-amber-900/20 shadow-lg">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <span className="text-amber-100 font-inter font-semibold text-base truncate">resume.pdf</span>
              </div>
              <Button variant="destructive" size="sm" onClick={handleDeleteResume} className="font-inter bg-red-600 hover:bg-red-700 transition-all text-sm px-6 py-2 h-9 flex-shrink-0 rounded-lg shadow-lg border border-red-500/50">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div> : <div className="border-2 border-dashed border-amber-500/40 rounded-xl p-6 sm:p-8 text-center cursor-pointer hover:border-amber-400/70 hover:bg-amber-900/30 transition-all duration-300 bg-amber-900/10" onClick={triggerFileInput}>
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Upload className="w-8 h-8 text-white" />
              </div>
              <p className="text-amber-200 font-inter mb-5 font-medium text-base">
                Click to upload or drag and drop your resume
              </p>
              <Button disabled={uploading} className="font-inter bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold text-sm px-6 py-2 h-10 rounded-lg shadow-lg border border-amber-500/30">
                {uploading ? 'Uploading...' : 'Upload Resume'}
              </Button>
              <input id="resume-upload" type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" disabled={uploading} />
            </div>}
        </CardContent>
      </Card>
    </section>;
};
export default ResumeSection;