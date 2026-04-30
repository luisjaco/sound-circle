'use client'
import { useState, use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
import { Loader2, Music, Disc3, ArrowLeft, MessageCircle, Flag } from 'lucide-react';
import { VinylRating } from '@/components/vinyl-rating';
import { ImageWithFallback } from '@/components/img/ImageWithFallback';
import ReviewComments from '@/components/ReviewComments';
import { FlagModal } from '@/components/FlagModal';
import { useFlagReview } from '@/hooks/useFlagReview';

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

  const {
    showFlagModal,
    setShowFlagModal,
    submitting,
    submitError,
    submitSuccess,
    handleFlagClick,
    handleFlagSubmit,
  } = useFlagReview(review?.id ?? 0, review?.review_type ?? 'song');

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
    <>
      {showFlagModal && (
        <FlagModal
          onClose={() => setShowFlagModal(false)}
          onSubmit={handleFlagSubmit}
          submitting={submitting}
          submitError={submitError}
          submitSuccess={submitSuccess}
        />
      )}
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
          <div className="relative flex flex-col border border-white/5 bg-[#121212]/80 backdrop-blur-xl rounded-2xl p-6 overflow-hidden group shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            {/* Atmospheric Background Glow */}
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-[#1DB954]/5 rounded-full blur-[80px] pointer-events-none z-0" />
            <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-purple-500/5 rounded-full blur-[80px] pointer-events-none z-0" />

            <div className="relative z-10">
              {/* User header */}
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={() => router.push(`/user/${review.user.username}`)}
                  className="shrink-0"
                >
                  {review.user.profile_picture_url ? (
                    <ImageWithFallback
                      src={review.user.profile_picture_url}
                      alt={review.user.username}
                      className="w-11 h-11 rounded-full object-cover ring-2 ring-gray-700 hover:ring-[#1DB954] transition-all shadow-md"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#1DB954] to-emerald-700 flex items-center justify-center ring-2 ring-gray-700 hover:ring-[#1DB954] transition-all shadow-md">
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
                className="flex gap-5 mb-6 w-full text-left group/media cursor-pointer"
              >
                <div className="relative shrink-0">
                    <div className="absolute inset-0 bg-[#1DB954]/20 blur-xl rounded-full scale-90 group-hover/media:bg-[#1DB954]/30 group-hover/media:scale-100 transition-all duration-500"></div>
                    {coverArt ? (
                      <ImageWithFallback
                        src={coverArt}
                        alt={itemName}
                        className="relative w-28 h-28 rounded-xl object-cover border border-white/10 shadow-2xl"
                      />
                    ) : (
                      <div className="relative w-28 h-28 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center border border-white/5 shadow-inner">
                        {review.review_type === 'song' ? (
                          <Music className="w-10 h-10 text-gray-600" />
                        ) : (
                          <Disc3 className="w-10 h-10 text-gray-600" />
                        )}
                      </div>
                    )}
                </div>
                
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <h3 className="text-white font-bold text-xl md:text-2xl tracking-tight mb-0.5 group-hover/media:text-[#1DB954] transition-colors duration-300 truncate">
                        {itemName}
                      </h3>
                      <p className="text-gray-400 font-medium text-[15px] truncate">{artistName}</p>
                      
                    </div>

                    {/* Vinyl Rating Badge */}
                    {review.rating != null && (
                        <div className="flex flex-col items-end shrink-0 mt-2 md:mt-0">
                            <div className="flex items-center bg-black/40 px-3 py-2 rounded-lg border border-white/5 backdrop-blur-md shadow-inner">
                                <VinylRating rating={Number(review.rating)} size="lg" />
                            </div>
                        </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Full review text */}
              {review.review && (
                <p className="text-gray-200/90 text-[16px] leading-relaxed mb-4 whitespace-pre-wrap font-medium">
                  {review.review}
                </p>
              )}

              {/* Edited indicator */}
              <div className="flex items-center justify-between mb-4">
                {review.edited_at ? (
                  <p className="text-gray-500 text-[11px] italic tracking-wide">edited</p>
                ) : (
                  <div />
                )}
                <button
                  onClick={handleFlagClick}
                  className="flex items-center gap-1 text-gray-600 hover:text-red-400 transition-colors text-xs"
                >
                  <Flag className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Comments section — always expanded on the review page */}
              <div className="w-full mt-2">
                <ReviewComments reviewId={review.id} userId={userId} defaultExpanded={true} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
