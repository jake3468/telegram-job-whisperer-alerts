
import { Button } from '@/components/ui/button';
import { Copy, ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';

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
  generatedImages: { [key: number]: string[] };
  loadingImage: { [key: number]: boolean };
  imageGenerationFailed: { [key: number]: boolean };
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
  const [localLoadingState, setLocalLoadingState] = useState(false);
  
  const heading = item[`post_heading_${postNumber}` as keyof LinkedInPostItem] as string;
  const content = item[`post_content_${postNumber}` as keyof LinkedInPostItem] as string;
  const variationImages = generatedImages[postNumber] || [];
  const isLoadingFromManager = loadingImage[postNumber] || false;
  const hasFailedThisVariation = imageGenerationFailed[postNumber] || false;

  // Sync local loading state with manager loading state
  useEffect(() => {
    setLocalLoadingState(isLoadingFromManager);
  }, [isLoadingFromManager]);

  // Reset local loading state when images arrive
  useEffect(() => {
    if (variationImages.length > 0 && localLoadingState) {
      console.log(`🎯 Images detected for variation ${postNumber}, resetting local loading state`);
      setLocalLoadingState(false);
    }
  }, [variationImages.length, localLoadingState, postNumber]);

  // Reset local loading state when generation fails
  useEffect(() => {
    if (hasFailedThisVariation && localLoadingState) {
      console.log(`❌ Generation failed for variation ${postNumber}, resetting local loading state`);
      setLocalLoadingState(false);
    }
  }, [hasFailedThisVariation, localLoadingState, postNumber]);

  const handleGetImage = () => {
    console.log(`🚀 User clicked Get Image for variation ${postNumber}`);
    setLocalLoadingState(true);
    onGetImage(item, postNumber);
  };

  // Determine the actual loading state (either from manager or local)
  const isActuallyLoading = isLoadingFromManager || localLoadingState;
  
  // Show loading only if we're actually loading AND don't have images yet
  const shouldShowLoading = isActuallyLoading && variationImages.length === 0;
  
  // Show failed only if we failed AND don't have images AND not currently loading
  const shouldShowFailed = hasFailedThisVariation && variationImages.length === 0 && !isActuallyLoading;

  if (!content) return null;

  console.log(`🎯 LinkedInPostResult render - Variation ${postNumber}:`, {
    isLoadingFromManager,
    localLoadingState,
    isActuallyLoading,
    shouldShowLoading,
    shouldShowFailed,
    hasImages: variationImages.length > 0,
    hasFailedThisVariation
  });

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
            onClick={handleGetImage}
            size="sm"
            disabled={isActuallyLoading}
            className="bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50 h-6 text-xs px-2 flex items-center gap-1"
          >
            <ImageIcon className="w-3 h-3" />
            <span className="hidden xs:inline">
              {isActuallyLoading ? 'Gen...' : 'Get Image'}
            </span>
            <span className="xs:hidden">
              {isActuallyLoading ? '...' : 'Img'}
            </span>
          </Button>
        </div>
      </div>

      {/* Loading indicator - only show when actually loading and no images */}
      {shouldShowLoading && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg text-center border border-blue-200">
          <div className="text-sm text-blue-600 font-medium">LinkedIn post image loading for variation {postNumber}...</div>
          <div className="text-xs text-blue-500 mt-1">This may take up to 2 minutes</div>
        </div>
      )}

      {/* Failed generation indicator - only show when failed and no images */}
      {shouldShowFailed && (
        <div className="mb-4 p-3 bg-red-50 rounded-lg text-center border border-red-200">
          <div className="text-sm text-red-600 font-medium">Image generation failed for variation {postNumber}</div>
          <div className="text-xs text-red-500 mt-1">Please try again</div>
        </div>
      )}

      {/* Generated Images for this specific variation */}
      {variationImages.length > 0 && (
        <div className="mb-4 space-y-3">
          <h5 className="text-cyan-300 font-medium text-sm">Generated Images for Variation {postNumber} ({variationImages.length}):</h5>
          <div className="space-y-3">
            {variationImages.map((imageData, index) => (
              <div key={index} className="relative">
                <img 
                  src={imageData} 
                  alt={`Generated LinkedIn post image ${index + 1} for variation ${postNumber}`}
                  className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl mx-auto rounded-lg shadow-sm object-contain max-h-96"
                  onLoad={() => {
                    console.log(`🖼️ Image ${index + 1} loaded for variation ${postNumber}`);
                    // Ensure loading state is reset when image actually loads
                    setLocalLoadingState(false);
                  }}
                  onError={(e) => {
                    console.error(`❌ Failed to load image ${index + 1} for variation ${postNumber}`, e);
                    setLocalLoadingState(false);
                  }}
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
