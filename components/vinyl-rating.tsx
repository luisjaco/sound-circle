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

  const getRatingData = (val: number) => {
    switch (Math.round(val)) {
      case 1: return { label: "Awful", color: "#EF4444" };
      case 2: return { label: "Weak", color: "#F97316" };
      case 3: return { label: "Solid", color: "#EAB308" };
      case 4: return { label: "Great", color: "#22C55E" };
      case 5: return { label: "Masterpiece", color: "#8B5CF6" };
      default: return { label: "", color: "#1DB954" };
    }
  };

  const { label, color } = getRatingData(rating);

  return (
    <div className="flex flex-col items-center justify-center gap-1">
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
                color={color}
              />
            </button>
          );
        })}
      </div>
      {label && (
        <span 
          className="text-[10px] font-bold uppercase tracking-widest mt-0.5"
          style={{ color: color }}
        >
          {label}
        </span>
      )}
    </div>
  );
}