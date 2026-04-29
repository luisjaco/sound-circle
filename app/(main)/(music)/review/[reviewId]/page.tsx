'use client'
import { useState, use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
import { Loader2, Music, Disc3, ArrowLeft, MessageCircle } from 'lucide-react';
import { VinylRating } from '@/components/vinyl-rating';
import { ImageWithFallback } from '@/components/img/ImageWithFallback';
import ReviewComments from '@/components/ReviewComments';

// turns a timestamp into a friendly "2h ago" style string
function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffWeeks < 52) return `${diffWeeks}w ago`;
  return then.toLocaleDateString();
}

interface ReviewData {
  id: number;
  review_type: 'song' | 'album';
  is_public: boolean;
  rating: number | null;
  review: string | null;
  edited_at: string | null;
  created_at: string;
  is_flagged: boolean;
  user: {
    id: string;
    username: string;
    name: string | null;
    profile_picture_url: string | null;
  };
  song: {
    id: number;
    name: string;
    spotify_id: string | null;
    artists: { id: number; name: string };
    cover_art_url?: string | null;
  } | null;
  album: {
    id: number;
    name: string;
    spotify_id: string | null;
    artists: { id: number; name: string };
    cover_art_url?: string | null;
  } | null;
}

export default function ReviewPage({ params }: { params: Promise<{ reviewId: string }> }) {
  const { reviewId } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [review, setReview] = useState<ReviewData | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // grab the logged-in user
  useEffect(() => {
    async function getUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    }
    getUser();
  }, []);

  // fetch this specific review from the unified reviews endpoint
  useEffect(() => {
    async function loadReview() {
      try {
        // fetch all reviews (we'll filter client-side for now — the unified endpoint
        // doesn't support single-review lookup, but the data is small enough)
        const res = await fetch('/api/supabase/reviews');
        if (!res.ok) throw new Error('Failed to load reviews');
        const data: ReviewData[] = await res.json();

        const found = data.find((r) => String(r.id) === reviewId);
        if (found) {
          setReview(found);
        }
      } catch (err) {
        console.error('Failed to load review:', err);
      } finally {
        setLoading(false);
      }
    }
    loadReview();
  }, [reviewId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black pb-20 pt-15">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#1DB954] animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="min-h-screen bg-black pb-20 pt-15">
        <div className="max-w-2xl mx-auto px-4 py-6 text-center">
          <p className="text-gray-400 text-lg py-20">Review not found</p>
          <button
            onClick={() => router.back()}
            className="text-[#1DB954] hover:text-[#1ed760] text-sm transition-colors"
          >
            ← Go back
          </button>
        </div>
      </div>
    );
  }

  const itemName = review.review_type === 'song'
    ? review.song?.name ?? 'Unknown Song'
    : review.album?.name ?? 'Unknown Album';

  const artistName = review.review_type === 'song'
    ? review.song?.artists?.name ?? 'Unknown Artist'
    : review.album?.artists?.name ?? 'Unknown Artist';

  const coverArt = review.review_type === 'song'
    ? review.song?.cover_art_url
    : review.album?.cover_art_url;

  const effectiveDate = review.edited_at || review.created_at;
  const timeAgo = getTimeAgo(effectiveDate);

  const entityLink = review.review_type === 'song'
    ? `/song/${review.song?.id}`
    : `/album/${review.album?.id}`;

  return (
    <div className="min-h-screen bg-black pb-20 pt-15">
      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Review Card */}
        <div className="bg-[#181818] border border-gray-800/50 rounded-xl p-6">

          {/* User header */}
          <div className="flex items-center gap-3 mb-5">
            <button
              onClick={() => router.push(`/user/${review.user.username}`)}
              className="shrink-0"
            >
              {review.user.profile_picture_url ? (
                <ImageWithFallback
                  src={review.user.profile_picture_url}
                  alt={review.user.username}
                  className="w-11 h-11 rounded-full object-cover ring-2 ring-gray-700 hover:ring-[#1DB954] transition-all"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#1DB954] to-emerald-700 flex items-center justify-center ring-2 ring-gray-700 hover:ring-[#1DB954] transition-all">
                  <span className="text-white font-bold text-sm">
                    {review.user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push(`/user/${review.user.username}`)}
                  className="text-white font-medium hover:text-[#1DB954] transition-colors truncate"
                >
                  {review.user.name || review.user.username}
                </button>
                <span className="text-gray-500 text-xs shrink-0">•</span>
                <span className="text-gray-500 text-xs shrink-0">{timeAgo}</span>
              </div>
              <p className="text-gray-500 text-xs">@{review.user.username}</p>
            </div>
            {/* Review type badge */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                review.review_type === 'song'
                  ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20'
                  : 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
              }`}
            >
              {review.review_type === 'song' ? (
                <Music className="w-3 h-3" />
              ) : (
                <Disc3 className="w-3 h-3" />
              )}
              {review.review_type === 'song' ? 'Song' : 'Album'}
            </div>
          </div>

          {/* Media info */}
          <div
            onClick={() => router.push(entityLink)}
            className="flex gap-4 mb-5 w-full text-left group cursor-pointer"
          >
            {coverArt ? (
              <ImageWithFallback
                src={coverArt}
                alt={itemName}
                className="w-20 h-20 rounded-lg object-cover shrink-0 border border-gray-700/50 group-hover:border-[#1DB954]/50 transition-colors"
              />
            ) : (
              <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center shrink-0 border border-gray-700/50">
                {review.review_type === 'song' ? (
                  <Music className="w-8 h-8 text-gray-500" />
                ) : (
                  <Disc3 className="w-8 h-8 text-gray-500" />
                )}
              </div>
            )}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <h3 className="text-white font-semibold text-lg group-hover:text-[#1DB954] transition-colors truncate">
                {itemName}
              </h3>
              <p className="text-gray-400 text-sm">{artistName}</p>
              {review.rating != null && (
                <div className="mt-2">
                  <VinylRating rating={review.rating} size="md" />
                </div>
              )}
            </div>
          </div>

          {/* Full review text */}
          {review.review && (
            <p className="text-gray-200 text-[15px] leading-relaxed mb-4 whitespace-pre-wrap">
              {review.review}
            </p>
          )}

          {/* Edited indicator */}
          {review.edited_at && (
            <p className="text-gray-600 text-xs mb-4 italic">edited</p>
          )}

          {/* Comments section — always expanded on the review page */}
          <ReviewComments reviewId={review.id} userId={userId} defaultExpanded={true} />
        </div>
      </div>
    </div>
  );
}
