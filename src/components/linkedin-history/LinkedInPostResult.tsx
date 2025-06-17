
import { Button } from '@/components/ui/button';
import { Copy, ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LinkedInPostItem {
  id: string;
  post_heading_1?: string;
  post_content_1?: string;
  post_heading_2?: string;
  post_content_2?: string;
  post_heading_3?: string;
  post_content_3?: string;
}

interface LinkedInPostResultProps {
  item: LinkedInPostItem;
  postNumber: number;
  generatedImages: string[];
  loadingImage: boolean;
  imageGenerationFailed: boolean;
  hasImages: boolean;
  onCopyResult: (item: LinkedInPostItem, postNumber: number) => void;
  onGetImage: (item: LinkedInPostItem, postNumber: number) => void;
  onCopyImage: (imageData: string) => void;
}

const LinkedInPostResult = ({
  item,
  postNumber,
  generatedImages,
  loadingImage,
  imageGenerationFailed,
  hasImages,
  onCopyResult,
  onGetImage,
  onCopyImage
}: LinkedInPostResultProps) => {
  const { toast } = useToast();
  
  const heading = item[`post_heading_${postNumber}` as keyof LinkedInPostItem] as string;
  const content = item[`post_content_${postNumber}` as keyof LinkedInPostItem] as string;

  if (!content) return null;

  return (
    <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
      <div className="flex flex-col gap-2 mb-3">
        <h4 className="text-lime-400 font-semibold text-sm">{heading}</h4>
        <div className="flex flex-wrap gap-1">
          <Button
            onClick={() => onCopyResult(item, postNumber)}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white h-6 text-xs px-2 flex items-center gap-1"
          >
            <Copy className="w-3 h-3" />
            <span className="hidden xs:inline">Copy</span>
          </Button>
          <Button
            onClick={() => onGetImage(item, postNumber)}
            size="sm"
            disabled={loadingImage}
            className="bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50 h-6 text-xs px-2 flex items-center gap-1"
          >
            <ImageIcon className="w-3 h-3" />
            <span className="hidden xs:inline">
              {loadingImage ? 'Gen...' : 'Get Image'}
            </span>
            <span className="xs:hidden">
              {loadingImage ? '...' : 'Img'}
            </span>
          </Button>
        </div>
      </div>

      {/* Loading indicator */}
      {loadingImage && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg text-center border border-blue-200">
          <div className="text-sm text-blue-600 font-medium">LinkedIn post image loading...</div>
          <div className="text-xs text-blue-500 mt-1">This may take up to 2 minutes</div>
        </div>
      )}

      {/* Failed generation indicator */}
      {imageGenerationFailed && (
        <div className="mb-4 p-3 bg-red-50 rounded-lg text-center border border-red-200">
          <div className="text-sm text-red-600 font-medium">Image generation failed</div>
          <div className="text-xs text-red-500 mt-1">Please try again</div>
        </div>
      )}

      {/* Generated Images */}
      {generatedImages.length > 0 && (
        <div className="mb-4 space-y-3">
          <h5 className="text-cyan-300 font-medium text-sm">Generated Images ({generatedImages.length}):</h5>
          <div className="space-y-3">
            {generatedImages.map((imageData, index) => (
              <div key={index} className="relative">
                <img 
                  src={imageData} 
                  alt={`Generated LinkedIn post image ${index + 1}`}
                  className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl mx-auto rounded-lg shadow-sm object-contain max-h-96"
                />
                <Button
                  onClick={() => onCopyImage(imageData)}
                  size="sm"
                  className="absolute top-2 right-2 bg-black/70 hover:bg-black/80 text-white p-1 h-auto min-h-0"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-black bg-white rounded p-4 font-inter text-sm leading-relaxed whitespace-pre-wrap break-words">
        {content}
      </div>
    </div>
  );
};

export default LinkedInPostResult;
