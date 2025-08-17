import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useCachedUserProfile } from '@/hooks/useCachedUserProfile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Trash2 } from 'lucide-react';
import { useEnhancedTokenManagerIntegration } from '@/hooks/useEnhancedTokenManagerIntegration';
import { makeAuthenticatedRequest } from '@/integrations/supabase/client';
interface ResumeSectionProps {
  updateActivity?: () => void;
}
const ResumeSection = ({
  updateActivity
}: ResumeSectionProps) => {
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

  // Enhanced token management
  const sessionManager = useEnhancedTokenManagerIntegration();
  useEffect(() => {
    if (user && !resumeExists) {
      checkExistingResume();
    } else if (resumeExists && user) {
      const fileName = `user_${user.id}/resume.pdf`;
      // This is a public URL generation, no auth needed
      const publicUrl = `https://fnzloyyhzhrqsvslhhri.supabase.co/storage/v1/object/public/resumes/${fileName}`;
      setResumeUrl(publicUrl);
    }
  }, [user, resumeExists]);
  const checkExistingResume = async () => {
    if (!user || !sessionManager) return;
    try {
      updateActivity?.();
      await makeAuthenticatedRequest(async () => {
        const {
          supabase
        } = await import('@/integrations/supabase/client');
        const {
          data,
          error
        } = await supabase.storage.from('resumes').list(`user_${user.id}`, {
          limit: 1,
          search: 'resume.pdf'
        });
        if (error) {
          console.error('Error checking existing resume:', error);
          return;
        }
        if (data && data.length > 0) {
          const fileName = `user_${user.id}/resume.pdf`;
          const publicUrl = `https://fnzloyyhzhrqsvslhhri.supabase.co/storage/v1/object/public/resumes/${fileName}`;
          setResumeUrl(publicUrl);
          updateResumeStatus(true);
        } else {
          updateResumeStatus(false);
        }
      });
    } catch (error) {
      console.error('Error checking existing resume:', error);
    }
  };
  const callResumeWebhook = async (fileUrl: string, fileName: string, fileSize: number) => {
    if (!sessionManager) return;
    try {
      console.log('Calling resume webhook with:', {
        fileUrl,
        fileName,
        fileSize,
        userId: user?.id
      });
      await makeAuthenticatedRequest(async () => {
        const {
          supabase
        } = await import('@/integrations/supabase/client');
        const {
          data,
          error
        } = await supabase.functions.invoke('resume-pdf-webhook', {
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
          toast({
            title: "Processing Started",
            description: "Your resume is being processed.",
            duration: 2000
          });
        }
      });
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
    if (!file || !user || !sessionManager) return;
    updateActivity?.();
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
      console.log('Upload starting for user:', { userId: user.id, email: user.emailAddresses?.[0]?.emailAddress });
      await makeAuthenticatedRequest(async () => {
        const {
          supabase
        } = await import('@/integrations/supabase/client');

        // Check if user exists in database
        const { data: existingUser, error: userCheckError } = await supabase
          .from('users')
          .select('id, clerk_id')
          .eq('clerk_id', user.id)
          .single();
        
        console.log('User check result:', { existingUser, userCheckError });

        // Check for existing resume and delete if exists
        const existingResumePath = `user_${user.id}/resume.pdf`;
        console.log('Removing existing resume at path:', existingResumePath);
        await supabase.storage.from('resumes').remove([existingResumePath]);

        // Ensure we have a valid token before storage operations
        const currentToken = await sessionManager.ensureTokenForOperation();
        if (!currentToken) {
          throw new Error('Authentication token not available');
        }
        console.log('JWT token available for upload:', { hasToken: !!currentToken, userId: user.id });

        const filePath = `user_${user.id}/resume.pdf`;
        console.log('Uploading to path:', filePath, 'clerk_id:', user.id);
        const {
          error: uploadError
        } = await supabase.storage.from('resumes').upload(filePath, file, {
          upsert: true,
          contentType: 'application/pdf'
        });
        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          throw uploadError;
        }

        // Get public URL for the uploaded file
        const publicUrl = `https://fnzloyyhzhrqsvslhhri.supabase.co/storage/v1/object/public/resumes/${filePath}`;
        setResumeUrl(publicUrl);

        // Update resume status in cache
        updateResumeStatus(true);
        return publicUrl;
      });

      // Update user profile with filename and upload timestamp
      await updateUserProfile({
        resume_filename: file.name,
        resume_uploaded_at: new Date().toISOString()
      });

      // Call the webhook to process the resume
      const publicUrl = `https://fnzloyyhzhrqsvslhhri.supabase.co/storage/v1/object/public/resumes/user_${user.id}/resume.pdf`;
      await callResumeWebhook(publicUrl, file.name, file.size);
      toast({
        title: "Resume uploaded successfully",
        description: "Your resume has been uploaded and is being processed."
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload resume",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };
  const handleDeleteResume = async () => {
    if (!user || !sessionManager) return;
    updateActivity?.();
    try {
      setUploading(true);
      await makeAuthenticatedRequest(async () => {
        const {
          supabase
        } = await import('@/integrations/supabase/client');

        // Ensure we have a valid token before storage operations
        const currentToken = await sessionManager.ensureTokenForOperation();
        if (!currentToken) {
          throw new Error('Authentication token not available');
        }

        // Delete from Supabase storage
        const filePath = `user_${user.id}/resume.pdf`;
        console.log('Deleting resume at path:', filePath);
        const {
          error
        } = await supabase.storage.from('resumes').remove([filePath]);
        if (error) {
          throw error;
        }
      });

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
        description: "Your resume has been deleted successfully."
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete resume",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };
  const triggerFileInput = () => {
    if (!uploading && sessionManager) {
      updateActivity?.();
      const fileInput = document.getElementById('resume-upload') as HTMLInputElement;
      fileInput?.click();
    }
  };

  // Helper function to format upload date
  const formatUploadDate = (dateString: string | null) => {
    if (!dateString) return 'Uploaded recently';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      if (diffInHours < 1) {
        return 'Uploaded recently';
      } else if (diffInHours < 24) {
        return `Uploaded ${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
      } else {
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) {
          return `Uploaded ${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
        } else {
          return `Uploaded on ${date.toLocaleDateString()}`;
        }
      }
    } catch {
      return 'Uploaded recently';
    }
  };

  // Get display filename - use actual filename if available, otherwise default
  const getDisplayFilename = () => {
    if (userProfile?.resume_filename) {
      return userProfile.resume_filename;
    }
    return 'resume.pdf';
  };

  // Get display upload date
  const getDisplayUploadDate = () => {
    if (userProfile?.resume_uploaded_at) {
      const date = new Date(userProfile.resume_uploaded_at);
      return date.toLocaleDateString('en-GB'); // dd/mm/yyyy format
    }
    return 'Uploaded recently';
  };
  return (
    <section className="p-0 rounded-none bg-transparent shadow-none">
      <Card className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <CardContent className="space-y-3 p-4">
          {resumeUrl ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg border border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <FileText className="w-3 h-3 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-gray-900 font-medium text-xs break-words block leading-tight">
                    {getDisplayFilename()}
                  </span>
                  <span className="text-gray-600 text-xs">
                    {getDisplayUploadDate()}
                  </span>
                </div>
              </div>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleDeleteResume} 
                disabled={uploading || !sessionManager} 
                className="text-xs px-3 py-1 h-7 flex-shrink-0 rounded-lg mt-2 sm:mt-0"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Delete
              </Button>
            </div>
          ) : (
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-3 sm:p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all duration-300" 
              onClick={triggerFileInput}
            >
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Upload className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-gray-900 mb-3 font-semibold text-xs">
                Click to upload or drag and drop your resume
              </p>
              <Button 
                disabled={uploading || !sessionManager} 
                className="bg-blue-600 text-white hover:bg-blue-700 font-bold px-3 py-1.5 h-7 rounded-lg text-xs"
              >
                {uploading ? 'Uploading...' : 'Upload Resume'}
              </Button>
              <input 
                id="resume-upload" 
                type="file" 
                accept=".pdf" 
                onChange={handleFileUpload} 
                className="hidden" 
                disabled={uploading || !sessionManager} 
              />
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
};
export default ResumeSection;