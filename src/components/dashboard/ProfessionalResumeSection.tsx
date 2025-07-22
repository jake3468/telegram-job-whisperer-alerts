import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { FileText, Upload, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { useCachedUserProfile } from '@/hooks/useCachedUserProfile';
import { AuthenticatedComponent, useAuthenticatedOperation } from '@/components/auth/AuthenticatedComponent';
import { AuthenticationRecovery } from '@/components/auth/AuthenticationRecovery';
import { analyzeAuthError } from '@/utils/authErrorHandler';
const ProfessionalResumeSection = () => {
  const {
    toast
  } = useToast();
  const {
    userProfile,
    loading,
    updateUserProfile
  } = useCachedUserProfile();
  const {
    executeWithAuth,
    isReady
  } = useAuthenticatedOperation();
  const [uploading, setUploading] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !isReady) return;

    // Validate file
    if (!file.type.includes('pdf')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file.",
        variant: "destructive"
      });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB.",
        variant: "destructive"
      });
      return;
    }
    setUploading(true);
    setUploadStatus('uploading');
    setShowRecovery(false);
    try {
      await executeWithAuth(async () => {
        // Convert file to base64 for now (simplified approach)
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const base64Data = await base64Promise;
        const {
          error
        } = await updateUserProfile({
          resume: base64Data
        });
        if (error) {
          throw new Error(error);
        }
      }, authError => {
        if (authError.isAuthError) {
          setShowRecovery(true);
        }
      });
      setUploadStatus('success');
      toast({
        title: "Resume uploaded",
        description: "Your resume has been uploaded successfully.",
        duration: 3000
      });

      // Clear success status after 3 seconds
      setTimeout(() => setUploadStatus('idle'), 3000);
    } catch (error) {
      const authError = analyzeAuthError(error);
      setUploadStatus('error');
      toast({
        title: "Upload failed",
        description: authError.userMessage,
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = '';
    }
  }, [updateUserProfile, executeWithAuth, isReady, toast]);
  const handleRecoverySuccess = () => {
    setShowRecovery(false);
    // Optionally retry the upload if we can access the last file
  };
  if (loading) {
    return <Card className="border-2 border-blue-400 shadow-none">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-white text-xs">
            <Loader2 className="w-3 h-3 animate-spin" />
            Loading resume...
          </div>
        </CardContent>
      </Card>;
  }
  return <AuthenticatedComponent className="p-0 rounded-none bg-transparent shadow-none">
      <Card className="rounded-3xl border-2 border-blue-400/80 bg-gradient-to-br from-blue-600/90 via-blue-700/85 to-blue-900/90 shadow-2xl shadow-blue-500/20 transition-all hover:shadow-blue-500/30 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-white font-orbitron flex items-center gap-2 text-lg drop-shadow-[0_2px_8px_rgba(59,130,246,0.6)]">
            <div className="w-7 h-7 bg-blue-400/60 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30">
              <FileText className="w-4 h-4 text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.8)]" />
            </div>
            <span className="text-white font-bold">Resume</span>
            {!isReady && <Loader2 className="w-4 h-4 animate-spin text-white" />}
          </CardTitle>
          <CardDescription className="text-blue-50 font-inter font-normal drop-shadow-[0_2px_10px_rgba(59,130,246,0.4)] text-sm">
            Upload your resume so our AI can provide personalized career advice and job matching.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {/* Current resume status */}
          {userProfile?.resume && <div className="flex items-center gap-2 p-2 border border-green-400/30 rounded-lg bg-neutral-950">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-green-300 text-sm">Resume uploaded</span>
            </div>}

          {/* Show recovery component when needed */}
          {showRecovery && <AuthenticationRecovery onRecoverySuccess={handleRecoverySuccess} />}

          {/* Upload section */}
          <div className="space-y-2">
            <input type="file" accept=".pdf" onChange={handleFileUpload} disabled={uploading || !isReady} className="hidden" id="resume-upload" />
            <label htmlFor="resume-upload">
              <Button type="button" disabled={uploading || !isReady} className="w-full font-inter font-bold text-xs px-4 py-2 h-9 rounded-lg shadow-lg shadow-blue-500/20 focus-visible:ring-2 focus-visible:ring-blue-300 transition-colors text-white bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 cursor-pointer" asChild>
                <div className="flex items-center justify-center gap-2">
                  {uploading ? <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      {uploadStatus === 'uploading' ? 'Uploading...' : 'Reconnecting...'}
                    </> : <>
                      <Upload className="w-3 h-3" />
                      {userProfile?.resume ? 'Update Resume' : 'Upload Resume'}
                    </>}
                </div>
              </Button>
            </label>
            
            {/* File format info */}
            <p className="text-blue-200/70 text-xs text-center">
              PDF files only, max 10MB
            </p>
          </div>

          {/* Success indicator */}
          {uploadStatus === 'success' && <div className="flex items-center justify-center gap-1 text-emerald-300 text-xs">
              <CheckCircle className="w-3 h-3" />
              <span>Upload successful</span>
            </div>}
        </CardContent>
      </Card>
    </AuthenticatedComponent>;
};
export default ProfessionalResumeSection;