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
      
      const { data, error } = await supabase.storage
        .from('resumes')
        .list(user.id, {
          limit: 1,
          search: 'resume.pdf'
        });

      if (error) {
        console.error('Error checking existing resume:', error);
        return;
      }

      if (data && data.length > 0) {
        const { data: urlData } = supabase.storage
          .from('resumes')
          .getPublicUrl(fileName);
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
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('clerk_id', user?.id)
        .single();

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
          last_name: userData.last_name,
        },
        resume: {
          file_url: fileUrl,
          file_name: fileName,
          file_size: fileSize,
          uploaded_at: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };

      const { error: webhookError } = await supabase.functions.invoke('resume-pdf-webhook', {
        body: payload,
      });

      if (webhookError) {
        console.error('Error calling resume webhook:', webhookError);
      } else {
        console.log('Resume webhook called successfully');
      }
    } catch (error) {
      console.error('Error in resume webhook call:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    console.log('File selected:', file.name, 'Type:', file.type, 'Size:', file.size);
    console.log('User Clerk ID:', user.id);

    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file only.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    if (uploading) return;

    setUploading(true);
    try {
      const fileName = `${user.id}/resume.pdf`;
      console.log('Uploading to:', fileName);
      
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast({
          title: "Upload failed",
          description: `Error: ${uploadError.message}`,
          variant: "destructive",
        });
        throw uploadError;
      }

      console.log('Upload successful');

      const { data } = supabase.storage
        .from('resumes')
        .getPublicUrl(fileName);

      setResumeUrl(data.publicUrl);
      
      // Call the resume PDF webhook
      await callResumeWebhook(data.publicUrl, file.name, file.size);
      
      toast({
        title: "Resume uploaded successfully",
        description: "Your resume has been saved.",
      });
    } catch (error) {
      console.error('Error uploading resume:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your resume. Please try again.",
        variant: "destructive",
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
      
      const { error } = await supabase.storage
        .from('resumes')
        .remove([fileName]);

      if (error) throw error;

      setResumeUrl(null);
      
      toast({
        title: "Resume deleted",
        description: "Your resume has been removed.",
      });
    } catch (error) {
      console.error('Error deleting resume:', error);
      toast({
        title: "Delete failed",
        description: "There was an error deleting your resume.",
        variant: "destructive",
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
    <section className="rounded-3xl bg-gradient-to-br from-pastel-blue/90 via-pastel-lavender/80 to-pastel-peach/90 shadow-xl shadow-pastel-lavender/30 p-6 md:p-8">
      <Card className="bg-gradient-to-br from-blue-600 via-purple-600 to-blue-700 border-2 border-blue-400 shadow-2xl shadow-blue-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-white font-inter flex items-center gap-2 text-base">
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
              <FileText className="w-3 h-3 text-white" />
            </div>
            Resume
          </CardTitle>
          <CardDescription className="text-blue-100 font-inter text-sm">
            Upload your resume (PDF only, max 5MB) for better job matching
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {resumeUrl ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-white/10 rounded-lg border border-white/20 backdrop-blur-sm gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <span className="text-white font-inter font-medium text-sm truncate">resume.pdf</span>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteResume}
                className="font-inter hover:bg-red-600 transition-colors text-xs px-3 py-1 h-8 flex-shrink-0"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Delete
              </Button>
            </div>
          ) : (
            <div 
              className="border-2 border-dashed border-white/40 rounded-lg p-4 sm:p-6 text-center cursor-pointer hover:border-white/60 hover:bg-white/5 transition-all duration-300 backdrop-blur-sm"
              onClick={triggerFileInput}
            >
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Upload className="w-6 h-6 text-white" />
              </div>
              <p className="text-white font-inter mb-3 font-medium text-sm">
                Click to upload or drag and drop your resume
              </p>
              <Button disabled={uploading} className="font-inter bg-white text-blue-600 hover:bg-gray-100 font-medium text-xs px-3 py-1 h-8">
                {uploading ? 'Uploading...' : 'Upload Resume'}
              </Button>
              <input
                id="resume-upload"
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
};

export default ResumeSection;
