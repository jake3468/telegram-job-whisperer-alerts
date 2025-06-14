import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Trash2 } from 'lucide-react';

const ResumeSection = () => {
  const { user } = useUser();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      checkExistingResume();
    }
  }, [user]);

  const checkExistingResume = async () => {
    if (!user) return;
    try {
      const fileName = `${user.id}/resume.pdf`;
      const { data, error } = await supabase.storage.from('resumes').list(user.id, {
        limit: 1,
        search: 'resume.pdf'
      });
      if (error) {
        console.error('Error checking existing resume:', error);
        return;
      }
      if (data && data.length > 0) {
        const { data: urlData } = supabase.storage.from('resumes').getPublicUrl(fileName);
        setResumeUrl(urlData.publicUrl);
      }
    } catch (error) {
      console.error('Error checking existing resume:', error);
    }
  };

  const callResumeWebhook = async (fileUrl: string, fileName: string, fileSize: number) => {
    try {
      console.log('Calling resume PDF webhook...');

      // Get user data for the webhook payload
      const { data: userData, error: userError } = await supabase.from('users').select('*').eq('clerk_id', user?.id).single();
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
      const { error: webhookError } = await supabase.functions.invoke('resume-pdf-webhook', {
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
      const { error: uploadError } = await supabase.storage.from('resumes').upload(fileName, file, {
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
      const { data } = supabase.storage.from('resumes').getPublicUrl(fileName);
      setResumeUrl(data.publicUrl);
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
      const { error } = await supabase.storage.from('resumes').remove([fileName]);
      if (error) throw error;
      setResumeUrl(null);
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

  return (
    <section className="p-0 rounded-none bg-transparent shadow-none">
      <Card
        className="
          rounded-3xl border-2 border-fuchsia-400 
          bg-gradient-to-b from-[#7438e6]/95 via-[#44377a]/92 to-[#29184d]/95
          shadow-md transition-all
        "
      >
        <CardHeader className="pb-3">
          <CardTitle className="text-white font-orbitron flex items-center gap-2 text-lg drop-shadow-[0_2px_6px_rgba(100,74,200,0.4)]">
            <div className="w-7 h-7 bg-fuchsia-500/40 rounded-full flex items-center justify-center">
              <FileText className="w-4 h-4 text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.6)]" />
            </div>
            <span className="text-white font-bold">Resume</span>
          </CardTitle>
          <CardDescription className="text-white/90 text-base font-inter font-normal drop-shadow-[0_2px_10px_rgba(80,70,140,0.5)]">
            Upload your resume (PDF only, max 5MB) for better job matching
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {resumeUrl ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-xl border border-white/20 bg-black/70 shadow-inner">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 bg-fuchsia-600/45 rounded-full flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <span className="text-white font-inter font-semibold text-base truncate">resume.pdf</span>
              </div>
              <Button variant="destructive" size="sm" onClick={handleDeleteResume} className="font-inter bg-red-500 hover:bg-red-600 transition-all text-xs px-4 py-1 h-8 flex-shrink-0 rounded-lg">
                <Trash2 className="w-3 h-3 mr-1" />
                Delete
              </Button>
            </div>
          ) : (
            <div
              className="border-2 border-dashed border-white/65 rounded-xl p-5 sm:p-8 text-center cursor-pointer hover:border-fuchsia-300 hover:bg-fuchsia-400/10 transition-all duration-300 bg-black/50 shadow-inner"
              onClick={triggerFileInput}
            >
              <div className="w-14 h-14 bg-fuchsia-600/35 rounded-full flex items-center justify-center mx-auto mb-3">
                <Upload className="w-7 h-7 text-fuchsia-100" />
              </div>
              <p className="text-white font-inter mb-4 font-semibold text-base">
                Click to upload or drag and drop your resume
              </p>
              <Button disabled={uploading} className="font-inter bg-white text-fuchsia-700 hover:bg-gray-100 font-bold text-xs px-4 py-2 h-9 rounded-lg shadow-md">
                {uploading ? 'Uploading...' : 'Upload Resume'}
              </Button>
              <input id="resume-upload" type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" disabled={uploading} />
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
};

export default ResumeSection;
