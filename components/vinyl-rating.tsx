import { VinylIcon } from './vinyl-icon';

interface VinylRatingProps {
  rating: number;
  interactive?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onRatingChange?: (rating: number) => void;
}

export function VinylRating({ 
  rating, 
  interactive = false, 
  size = 'md',
  onRatingChange 
}: VinylRatingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-8 h-8'
  };

  const handleClick = (index: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(index + 1);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, index) => {
        const isFilled = index < rating;
        return (
          <button
            key={index}
            onClick={() => handleClick(index)}
            disabled={!interactive}
            className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
            aria-label={`${index + 1} out of 5 records`}
          >
            <VinylIcon 
              filled={isFilled}
              className={sizeClasses[size]}
            />
          </button>
        );
      })}
    </div>
  );
}