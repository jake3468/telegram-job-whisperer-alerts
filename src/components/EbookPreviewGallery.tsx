import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const previewImages = [
  '/lovable-uploads/ebook-preview-1.png',
  '/lovable-uploads/ebook-preview-2.png',
  '/lovable-uploads/ebook-preview-3.png',
  '/lovable-uploads/ebook-preview-4.png',
  '/lovable-uploads/ebook-preview-5.png',
];

const EbookPreviewGallery = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setIsOpen(true);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? previewImages.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === previewImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <>
      {/* Thumbnails */}
      <div className="flex justify-center gap-2 mt-4">
        {previewImages.map((src, index) => (
          <button
            key={index}
            onClick={() => openLightbox(index)}
            className="w-12 h-16 rounded border border-border/50 overflow-hidden hover:border-primary transition-colors cursor-pointer"
          >
            <img
              src={src}
              alt={`Ebook preview ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground text-center mt-2">Click to preview pages</p>

      {/* Lightbox Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl p-0 bg-background/95 backdrop-blur-sm border-none">
          <div className="relative">
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 bg-background/80 hover:bg-background"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>

            {/* Navigation buttons */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background"
              onClick={goToNext}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>

            {/* Image */}
            <img
              src={previewImages[currentIndex]}
              alt={`Ebook preview ${currentIndex + 1}`}
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />

            {/* Page indicator */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/80 px-3 py-1 rounded-full text-sm">
              {currentIndex + 1} / {previewImages.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EbookPreviewGallery;
