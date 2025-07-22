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
    userProfile,
    resumeExists,
    updateResumeStatus,
    updateUserProfile
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
      console.log('Calling resume webhook with:', { fileUrl, fileName, fileSize, userId: user?.id });
      
      const { data, error } = await supabase.functions.invoke('resume-pdf-webhook', {
        body: {
          fileUrl,
          fileName,
          fileSize,
          userId: user?.id,
          timestamp: new Date().toISOString()
        }
      });

      if (error) {
        console.error('Webhook call failed:', error);
        toast({
          title: "Processing Warning",
          description: "Resume uploaded but processing may be delayed.",
          variant: "destructive"
        });
      } else {
        console.log('Webhook called successfully:', data);
        toast({
          title: "Processing Started",
          description: "Your resume is being processed.",
          duration: 2000
        });
      }
    } catch (error) {
      console.error('Webhook error:', error);
      toast({
        title: "Processing Error",
        description: "Failed to start resume processing.",
        variant: "destructive"
      });
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
      // Check for existing resume and delete if exists
      const existingResumePath = `${user.id}/resume.pdf`;
      await supabase.storage.from('resumes').remove([existingResumePath]);

      // Upload new file
      const filePath = `${user.id}/resume.pdf`;
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, file, { 
          upsert: true,
          contentType: 'application/pdf'
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('resumes')
        .getPublicUrl(filePath);

      // Update user profile with filename and upload timestamp
      await updateUserProfile({
        resume_filename: file.name,
        resume_uploaded_at: new Date().toISOString()
      });

      setResumeUrl(publicUrl);

      // Update resume status in cache
      updateResumeStatus(true);

      // Call the webhook to process the resume
      await callResumeWebhook(publicUrl, file.name, file.size);

      toast({
        title: "Resume uploaded successfully",
        description: "Your resume has been uploaded and is being processed.",
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload resume",
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
      setUploading(true);
      
      // Delete from Supabase storage
      const filePath = `${user.id}/resume.pdf`;
      const { error } = await supabase.storage
        .from('resumes')
        .remove([filePath]);

      if (error) {
        throw error;
      }

      // Clear filename and upload timestamp from user profile
      await updateUserProfile({
        resume_filename: null,
        resume_uploaded_at: null
      });

      setResumeUrl(null);
      // Update resume status
      updateResumeStatus(false);

      toast({
        title: "Resume deleted",
        description: "Your resume has been deleted successfully.",
      });

    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete resume",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
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
          rounded-3xl border-2 border-purple-400/80 
          bg-gradient-to-br from-purple-600/90 via-purple-700/85 to-purple-900/90
          shadow-2xl shadow-purple-500/20 transition-all hover:shadow-purple-500/30
          backdrop-blur-sm
        ">
        <CardHeader className="pb-3">
          <CardTitle className="text-white font-orbitron flex items-center gap-2 text-lg drop-shadow-[0_2px_8px_rgba(147,51,234,0.6)]">
            <div className="w-7 h-7 bg-purple-400/60 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/30">
              <FileText className="w-4 h-4 text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.8)]" />
            </div>
            <span className="text-white font-bold">Resume</span>
          </CardTitle>
          <CardDescription className="text-white/95 font-inter font-normal drop-shadow-[0_2px_10px_rgba(147,51,234,0.4)] text-sm">Upload your resume (PDF, max 5MB) so our AI can better understand your background and personalize your experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {(resumeUrl && userProfile?.resume_filename) ? <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-xl border border-white/20 bg-black/70 shadow-inner">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 bg-purple-500/60 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/40">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-white font-inter font-medium text-sm break-words block leading-tight">
                    {userProfile?.resume_filename || 'resume.pdf'}
                  </span>
                  {userProfile?.resume_uploaded_at && (
                    <span className="text-white/70 text-xs">
                      Uploaded {new Date(userProfile.resume_uploaded_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleDeleteResume} 
                disabled={uploading}
                className="font-inter bg-red-500 hover:bg-red-600 transition-all text-xs px-4 py-1 h-8 flex-shrink-0 rounded-lg"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Delete
              </Button>
            </div> : <div className="border-2 border-dashed border-white/70 rounded-xl p-5 sm:p-8 text-center cursor-pointer hover:border-purple-300 hover:bg-purple-400/15 transition-all duration-300 bg-black/60 shadow-inner" onClick={triggerFileInput}>
              <div className="w-14 h-14 bg-purple-500/50 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-purple-500/30">
                <Upload className="w-7 h-7 text-purple-100" />
              </div>
              <p className="text-white font-inter mb-4 font-semibold text-base">
                Click to upload or drag and drop your resume
              </p>
              <Button disabled={uploading} className="font-inter bg-white text-purple-700 hover:bg-purple-50 font-bold text-xs px-4 py-2 h-9 rounded-lg shadow-lg shadow-purple-500/20">
                {uploading ? 'Uploading...' : 'Upload Resume'}
              </Button>
              <input id="resume-upload" type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" disabled={uploading} />
            </div>}
        </CardContent>
      </Card>
    </section>;
};
export default ResumeSection;