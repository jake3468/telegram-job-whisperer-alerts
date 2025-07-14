import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, File, Download } from 'lucide-react';

interface FileItem {
  name: string;
  url: string;
  size?: number;
}

interface FileUploadProps {
  jobId: string;
  userProfileId: string;
  existingFiles?: string[];
  onFilesUpdate?: (files: string[]) => void;
}

export const FileUpload = ({ jobId, userProfileId, existingFiles = [], onFilesUpdate }: FileUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<FileItem[]>([]);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of Array.from(selectedFiles)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userProfileId}/${jobId}/${Math.random()}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('job-tracker-files')
          .upload(fileName, file);

        if (error) {
          throw error;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('job-tracker-files')
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
        setFiles(prev => [...prev, { name: file.name, url: publicUrl, size: file.size }]);
      }

      const updatedFiles = [...existingFiles, ...uploadedUrls];
      
      // Update job tracker record
      const { error: updateError } = await supabase
        .from('job_tracker')
        .update({ file_urls: updatedFiles })
        .eq('id', jobId);

      if (updateError) {
        throw updateError;
      }

      onFilesUpdate?.(updatedFiles);
      
      toast({
        title: "Files uploaded successfully",
        description: `${selectedFiles.length} file(s) uploaded.`
      });
    } catch (error) {
      console.error('File upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload files. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileDelete = async (fileUrl: string) => {
    try {
      // Extract file path from URL for deletion
      const urlParts = fileUrl.split('/');
      const filePath = urlParts.slice(-3).join('/'); // userProfileId/jobId/filename

      const { error: deleteError } = await supabase.storage
        .from('job-tracker-files')
        .remove([filePath]);

      if (deleteError) {
        console.warn('File deletion warning:', deleteError);
      }

      const updatedFiles = existingFiles.filter(url => url !== fileUrl);
      
      // Update job tracker record
      const { error: updateError } = await supabase
        .from('job_tracker')
        .update({ file_urls: updatedFiles })
        .eq('id', jobId);

      if (updateError) {
        throw updateError;
      }

      onFilesUpdate?.(updatedFiles);
      setFiles(prev => prev.filter(file => file.url !== fileUrl));
      
      toast({
        title: "File deleted",
        description: "File has been removed successfully."
      });
    } catch (error) {
      console.error('File deletion error:', error);
      toast({
        title: "Deletion failed",
        description: "Failed to delete file. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleFileDownload = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          disabled={uploading}
          onClick={() => document.getElementById(`file-upload-${jobId}`)?.click()}
          className="bg-blue-900/30 border-blue-600/50 text-blue-300 hover:bg-blue-800/50"
        >
          <Upload className="w-4 h-4 mr-2" />
          {uploading ? 'Uploading...' : 'Upload Files'}
        </Button>
        <Input
          id={`file-upload-${jobId}`}
          type="file"
          multiple
          onChange={handleFileUpload}
          className="hidden"
          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
        />
      </div>

      {/* Display existing files */}
      {existingFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-300">Uploaded Files:</h4>
          {existingFiles.map((fileUrl, index) => {
            const fileName = fileUrl.split('/').pop() || `File ${index + 1}`;
            return (
              <div key={fileUrl} className="flex items-center justify-between p-2 bg-gray-800 rounded border border-gray-700">
                <div className="flex items-center gap-2">
                  <File className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-300 truncate max-w-[200px]">
                    {fileName}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFileDownload(fileUrl, fileName)}
                    className="h-6 w-6 p-0 text-gray-400 hover:text-blue-400"
                  >
                    <Download className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFileDelete(fileUrl)}
                    className="h-6 w-6 p-0 text-gray-400 hover:text-red-400"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};