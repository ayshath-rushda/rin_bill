import { useState } from 'react';
import { ImageOff, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

function ImageGallery({ images = [] }) {
  const [selected, setSelected] = useState(0);
  const allImages = images.length > 0 ? images : null;

  if (!allImages) {
    return (
      <div className="aspect-square rounded-lg bg-muted flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <ImageOff className="size-16 mx-auto mb-2" />
          <span className="text-sm">No images</span>
        </div>
      </div>
    );
  }

  const prev = () => setSelected((s) => (s === 0 ? allImages.length - 1 : s - 1));
  const next = () => setSelected((s) => (s === allImages.length - 1 ? 0 : s + 1));

  return (
    <div className="space-y-3">
      <div className="relative aspect-square rounded-lg bg-muted overflow-hidden group">
        <img
          src={allImages[selected]}
          alt={`Product image ${selected + 1}`}
          className="size-full object-cover transition-opacity duration-300"
        />
        {allImages.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
            >
              <ChevronRight className="size-4" />
            </button>
          </>
        )}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {allImages.map((_, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={cn(
                'size-2 rounded-full transition-colors',
                i === selected ? 'bg-primary' : 'bg-background/60 hover:bg-background/80'
              )}
            />
          ))}
        </div>
      </div>
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {allImages.map((img, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={cn(
                'flex-shrink-0 size-16 rounded-md overflow-hidden border-2 transition-colors',
                i === selected ? 'border-primary' : 'border-transparent hover:border-muted-foreground/30'
              )}
            >
              <img src={img} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ImageGallery;
