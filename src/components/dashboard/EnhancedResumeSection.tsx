import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useCachedUserProfile } from '@/hooks/useCachedUserProfile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { useOptimizedFormTokenKeepAlive } from '@/hooks/useOptimizedFormTokenKeepAlive';

const EnhancedResumeSection = () => {
  const { user } = useUser();
  const { toast } = useToast();
  const { resumeExists, updateResumeStatus } = useCachedUserProfile();
  const [uploading, setUploading] = useState(false);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [webhookStatus, setWebhookStatus] = useState<'pending' | 'success' | 'failed' | null>(null);
  const [uploadAttempts, setUploadAttempts] = useState(0);

  // Optimized token keep-alive
  const { updateActivity, smartTokenRefresh, isReady } = useOptimizedFormTokenKeepAlive(true);

  useEffect(() => {
    if (user && !resumeExists) {
      checkExistingResume();
    } else if (resumeExists && user) {
      const fileName = `${user.id}/resume.pdf`;
      const { data: urlData } = supabase.storage.from('resumes').getPublicUrl(fileName);
      setResumeUrl(urlData.publicUrl);
    }
  }, [user, resumeExists]);

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
        updateResumeStatus(true);
      } else {
        updateResumeStatus(false);
      }
    } catch (error) {
      console.error('Error checking existing resume:', error);
    }
  };

  const callResumeWebhook = async (fileUrl: string, fileName: string, fileSize: number, retryCount = 0): Promise<boolean> => {
    try {
      setWebhookStatus('pending');

      // Get user data for the webhook payload
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('clerk_id', user?.id)
        .single();
      
      if (userError) {
        console.error('Error fetching user data for webhook:', userError);
        setWebhookStatus('failed');
        return false;
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
        timestamp: new Date().toISOString(),
        retry_count: retryCount,
        max_retries: 3
      };

      // Call webhook with timeout
      const { data, error: webhookError } = await Promise.race([
        supabase.functions.invoke('resume-pdf-webhook', { body: payload }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Webhook timeout')), 15000)
        )
      ]) as any;

      if (webhookError) {
        console.error(`Error calling resume webhook (attempt ${retryCount + 1}):`, webhookError);
        
        // Retry logic for webhook failures
        if (retryCount < 2) {
          await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 2000));
          return callResumeWebhook(fileUrl, fileName, fileSize, retryCount + 1);
        }
        
        setWebhookStatus('failed');
        return false;
      }

      
      setWebhookStatus('success');
      return true;
    } catch (error) {
      console.error(`Error in resume webhook call (attempt ${retryCount + 1}):`, error);
      
      // Retry on timeout or network errors
      if (retryCount < 2 && (error instanceof Error && (error.message.includes('timeout') || error.message.includes('network')))) {
        
        await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 2000));
        return callResumeWebhook(fileUrl, fileName, fileSize, retryCount + 1);
      }
      
      setWebhookStatus('failed');
      return false;
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
    setWebhookStatus(null);
    const currentAttempt = uploadAttempts + 1;
    setUploadAttempts(currentAttempt);

    try {
      // Ensure fresh token before upload
      await smartTokenRefresh();
      
      const fileName = `${user.id}/resume.pdf`;
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('resumes').getPublicUrl(fileName);
      setResumeUrl(data.publicUrl);
      updateResumeStatus(true);

      // Call webhook with retry logic
      const webhookSuccess = await callResumeWebhook(data.publicUrl, file.name, file.size);

      toast({
        title: "Resume uploaded successfully",
        description: webhookSuccess 
          ? "Your resume has been saved and processed." 
          : "Your resume has been saved (processing may be delayed)."
      });

      setUploadAttempts(0); // Reset on success
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Retry logic for JWT-related errors
      if ((errorMessage.includes('JWT') || errorMessage.includes('unauthorized') || errorMessage.includes('expired')) && currentAttempt < 3) {
        
        setTimeout(async () => {
          await smartTokenRefresh();
          setTimeout(() => handleFileUpload(event), 500);
        }, 1000 * currentAttempt);
        
        return;
      }

      toast({
        title: "Upload failed",
        description: `Error: ${errorMessage}`,
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
      await smartTokenRefresh();
      
      const fileName = `${user.id}/resume.pdf`;
      const { error } = await supabase.storage.from('resumes').remove([fileName]);
      
      if (error) throw error;

      setResumeUrl(null);
      setWebhookStatus(null);
      updateResumeStatus(false);
      
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
    if (!uploading && isReady) {
      const fileInput = document.getElementById('resume-upload') as HTMLInputElement;
      fileInput?.click();
    }
  };

  return (
    <section className="p-0 rounded-none bg-transparent shadow-none">
      <Card className="rounded-3xl border-2 border-purple-400/80 bg-gradient-to-br from-purple-600/90 via-purple-700/85 to-purple-900/90 shadow-2xl shadow-purple-500/20 transition-all hover:shadow-purple-500/30 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-white font-orbitron flex items-center gap-2 text-lg drop-shadow-[0_2px_8px_rgba(147,51,234,0.6)]">
            <div className="w-7 h-7 bg-purple-400/60 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/30">
              <FileText className="w-4 h-4 text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.8)]" />
            </div>
            <span className="text-white font-bold">Resume</span>
            {!isReady && (
              <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            )}
          </CardTitle>
          <CardDescription className="text-white/95 font-inter font-normal drop-shadow-[0_2px_10px_rgba(147,51,234,0.4)] text-sm">
            Upload your resume (PDF, max 5MB) so our AI can better understand your background and personalize your experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {resumeUrl ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-xl border border-white/20 bg-black/70 shadow-inner">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 bg-purple-500/60 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/40">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-white font-inter font-semibold text-base truncate">resume.pdf</span>
                  {webhookStatus && (
                    <div className="flex items-center gap-1 text-xs">
                      {webhookStatus === 'pending' ? (
                        <>
                          <div className="w-3 h-3 animate-spin rounded-full border-2 border-yellow-400 border-t-transparent"></div>
                          <span className="text-yellow-400">Processing...</span>
                        </>
                      ) : webhookStatus === 'success' ? (
                        <>
                          <CheckCircle className="w-3 h-3 text-green-400" />
                          <span className="text-green-400">Processed</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3 text-orange-400" />
                          <span className="text-orange-400">Processing delayed</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteResume}
                disabled={!isReady}
                className="font-inter bg-red-500 hover:bg-red-600 transition-all text-xs px-4 py-1 h-8 flex-shrink-0 rounded-lg"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Delete
              </Button>
            </div>
          ) : (
            <div
              className={`border-2 border-dashed border-white/70 rounded-xl p-5 sm:p-8 text-center transition-all duration-300 bg-black/60 shadow-inner
                ${isReady ? 'cursor-pointer hover:border-purple-300 hover:bg-purple-400/15' : 'cursor-not-allowed opacity-50'}`}
              onClick={triggerFileInput}
            >
              <div className="w-14 h-14 bg-purple-500/50 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-purple-500/30">
                <Upload className="w-7 h-7 text-purple-100" />
              </div>
              <p className="text-white font-inter mb-4 font-semibold text-base">
                {isReady ? 'Click to upload or drag and drop your resume' : 'Preparing upload...'}
              </p>
              <Button
                disabled={uploading || !isReady}
                className="font-inter bg-white text-purple-700 hover:bg-purple-50 font-bold text-xs px-4 py-2 h-9 rounded-lg shadow-lg shadow-purple-500/20 disabled:opacity-50"
              >
                {uploading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 animate-spin rounded-full border-2 border-purple-700 border-t-transparent"></div>
                    Uploading...
                  </div>
                ) : (
                  'Upload Resume'
                )}
              </Button>
              <input
                id="resume-upload"
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading || !isReady}
              />
            </div>
          )}
          
          {uploadAttempts > 0 && uploadAttempts < 3 && (
            <div className="flex items-center gap-2 text-yellow-400 text-xs">
              <AlertCircle className="w-3 h-3" />
              <span>Upload attempt {uploadAttempts}/3</span>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
};

export default EnhancedResumeSection;
