import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Download, FileText, File } from 'lucide-react';

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

  // File type validation
  const ALLOWED_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx'];
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  const validateFile = (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Only PDF and Word documents (.pdf, .doc, .docx) are allowed.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 5MB.';
    }
    return null;
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.toLowerCase().split('.').pop();
    if (extension === 'pdf') {
      return <FileText className="w-4 h-4 text-red-500" />;
    } else if (extension === 'doc' || extension === 'docx') {
      return <FileText className="w-4 h-4 text-blue-500" />;
    }
    return <File className="w-4 h-4 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of Array.from(selectedFiles)) {
        // Validate file
        const validationError = validateFile(file);
        if (validationError) {
          toast({
            title: "Invalid file",
            description: validationError,
            variant: "destructive"
          });
          continue;
        }

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

      if (uploadedUrls.length === 0) {
        return;
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
        description: `${uploadedUrls.length} file(s) uploaded.`
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
      // Reset input
      event.target.value = '';
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
      <div className="space-y-2">
        <Button 
          variant="outline" 
          size="sm" 
          disabled={uploading}
          onClick={() => document.getElementById(`file-upload-${jobId}`)?.click()}
          className="w-full bg-purple-100 border-purple-300 text-purple-800 hover:bg-purple-200 hover:border-purple-400 font-medium"
        >
          <Upload className="w-4 h-4 mr-2" />
          {uploading ? 'Uploading...' : 'Upload Files'}
        </Button>
        <p className="text-xs text-purple-600 text-center">
          Supported: PDF, Word documents • Max size: 5MB
        </p>
        <Input
          id={`file-upload-${jobId}`}
          type="file"
          multiple
          onChange={handleFileUpload}
          className="hidden"
          accept=".pdf,.doc,.docx"
        />
      </div>

      {/* Display existing files */}
      {existingFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-purple-700">Uploaded Files:</h4>
          {existingFiles.map((fileUrl, index) => {
            const fileName = fileUrl.split('/').pop() || `File ${index + 1}`;
            const cleanFileName = fileName.includes('.') ? 
              fileName.substring(fileName.indexOf('.') + 1) : fileName;
            
            return (
              <div key={fileUrl} className="flex items-center justify-between p-3 bg-white rounded-lg border border-purple-200 shadow-sm">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {getFileIcon(fileName)}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-900 truncate block">
                      {cleanFileName}
                    </span>
                    <span className="text-xs text-gray-500">
                      {fileName.toLowerCase().includes('.pdf') ? 'PDF Document' :
                       fileName.toLowerCase().includes('.doc') ? 'Word Document' : 'Document'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFileDownload(fileUrl, cleanFileName)}
                    className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                    title="Download file"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFileDelete(fileUrl)}
                    className="h-8 w-8 p-0 text-gray-500 hover:text-red-600 hover:bg-red-50"
                    title="Delete file"
                  >
                    <X className="w-4 h-4" />
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