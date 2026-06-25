import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

function StarRating({ rating = 0, max = 5, size = 'sm', showValue = false }) {
  const sizeClass = size === 'sm' ? 'size-3' : size === 'md' ? 'size-4' : 'size-5';
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;

  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {Array.from({ length: max }, (_, i) => {
          const filled = i < fullStars;
          const half = i === fullStars && hasHalf;
          return (
            <Star
              key={i}
              className={cn(
                sizeClass,
                filled || half ? 'fill-yellow-400 text-yellow-400' : 'fill-muted text-muted-foreground/30'
              )}
            />
          );
        })}
      </div>
      {showValue && <span className="text-xs text-muted-foreground">({rating})</span>}
    </div>
  );
}

export default StarRating;
