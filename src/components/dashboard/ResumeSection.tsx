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
    <Card className="bg-gradient-to-br from-blue-600 via-purple-600 to-blue-700 border-2 border-blue-400 shadow-2xl shadow-blue-500/20">
      <CardHeader>
        <CardTitle className="text-white font-inter flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <FileText className="w-4 h-4 text-white" />
          </div>
          Resume
        </CardTitle>
        <CardDescription className="text-blue-100 font-inter">
          Upload your resume (PDF only, max 5MB) for better job matching
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {resumeUrl ? (
          <div className="flex items-center justify-between p-4 bg-white/10 rounded-xl border border-white/20 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-inter font-medium">resume.pdf</span>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteResume}
              className="font-inter hover:bg-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        ) : (
          <div 
            className="border-2 border-dashed border-white/40 rounded-xl p-8 text-center cursor-pointer hover:border-white/60 hover:bg-white/5 transition-all duration-300 backdrop-blur-sm"
            onClick={triggerFileInput}
          >
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-white" />
            </div>
            <p className="text-white font-inter mb-4 font-medium">
              Click to upload or drag and drop your resume
            </p>
            <Button disabled={uploading} className="font-inter bg-white text-blue-600 hover:bg-gray-100 font-medium">
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
  );
};

export default ResumeSection;
