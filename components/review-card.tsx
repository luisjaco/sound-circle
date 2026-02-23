import { Heart, MessageCircle, MoreVertical } from 'lucide-react';
import { VinylRating } from './vinyl-rating';
import { ImageWithFallback } from './img/ImageWithFallback';

interface ReviewCardProps {
  albumArt: string;
  albumTitle: string;
  artistName: string;
  rating: number;
  reviewText: string;
  username: string;
  userAvatar: string;
  likes: number;
  comments: number;
  isLiked?: boolean;
  onLike?: () => void;
  onComment?: () => void;
}

export function ReviewCard({
  albumArt,
  albumTitle,
  artistName,
  rating,
  reviewText,
  username,
  userAvatar,
  likes,
  comments,
  isLiked = false,
  onLike,
  onComment
}: ReviewCardProps) {
  return (
    <div className="bg-[#181818] rounded-lg p-4 hover:bg-[#282828] transition-colors">
      <div className="flex gap-3 mb-3">
        <ImageWithFallback
          src={userAvatar}
          alt={username}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="text-white font-medium">{username}</p>
            <button className="text-gray-400 hover:text-white transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-3">
        <ImageWithFallback
          src={albumArt}
          alt={albumTitle}
          className="w-20 h-20 rounded-md object-cover shrink-0"
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-medium truncate mb-1">{albumTitle}</h3>
          <p className="text-gray-400 text-sm mb-2">{artistName}</p>
          <VinylRating rating={rating} size="sm" />
        </div>
      </div>

      <p className="text-gray-300 text-sm mb-3 line-clamp-3">{reviewText}</p>

      <div className="flex items-center gap-4 pt-2 border-t border-gray-700">
        <button 
          onClick={onLike}
          className="flex items-center gap-2 text-gray-400 hover:text-[#1DB954] transition-colors group"
        >
          <Heart className={`w-5 h-5 ${isLiked ? 'fill-[#1DB954] text-[#1DB954]' : 'group-hover:scale-110'} transition-transform`} />
          <span className="text-sm">{likes}</span>
        </button>
        <button 
          onClick={onComment}
          className="flex items-center gap-2 text-gray-400 hover:text-[#1DB954] transition-colors group"
        >
          <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="text-sm">{comments}</span>
        </button>
      </div>
    </div>
  );
}