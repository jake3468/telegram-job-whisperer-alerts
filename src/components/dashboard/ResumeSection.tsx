
import { useState } from 'react';
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

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

    setUploading(true);
    try {
      const fileName = `${user.id}/resume.pdf`;
      
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

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
        description: "There was an error uploading your resume.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
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

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white font-inter flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Resume
        </CardTitle>
        <CardDescription className="text-gray-400 font-inter">
          Upload your resume (PDF only, max 5MB) for better job matching
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {resumeUrl ? (
          <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-pastel-blue" />
              <span className="text-white font-inter">resume.pdf</span>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteResume}
              className="font-inter"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400 font-inter mb-4">
              Click to upload or drag and drop your resume
            </p>
            <label htmlFor="resume-upload">
              <Button disabled={uploading} className="font-inter">
                {uploading ? 'Uploading...' : 'Upload Resume'}
              </Button>
              <input
                id="resume-upload"
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ResumeSection;
