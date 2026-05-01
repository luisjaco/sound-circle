'use client'
import { Music, Send, X } from 'lucide-react';
import { VinylRating } from '@/components/vinyl-rating';
import { ImageWithFallback } from '@/components/img/ImageWithFallback';
import ReviewComments from '@/components/ReviewComments';
import { useState, use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
import ProfilePicture from '@/components/img/ProfilePicture';

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

export default function SongPage({ params }: { params: Promise<{ songId: string }> }) {
  const { songId } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [songData, setSongData] = useState<any>(null);

  // everything related to the review form + fetched reviews
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // grab the logged-in user so we can attach their id to reviews
  useEffect(() => {
    async function getUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    }
    getUser();
  }, []);

  // pull song info on mount
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/song/${songId}`);
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        setSongData(data.song);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [songId]);

  // load all reviews for this song (newest first)
  const fetchReviews = async () => {
    setReviewsLoading(true);
    try {
      const res = await fetch(`/api/search-reviews?type=song&song_id=${songId}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [songId]);

  // send the review to the backend and refresh the list
  const handleSubmitReview = async () => {
    if (!userId) {
      alert('You must be logged in to write a review.');
      return;
    }
    if (!reviewText.trim() && reviewRating === 0) {
      alert('Please write a review or select a rating.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/add-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'song',
          song_id: Number(songId),
          user_id: userId,
          rating: reviewRating > 0 ? reviewRating : null,
          review: reviewText.trim() || null,
          is_public: true,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to submit review');
      }

      // clear the form and reload reviews so the new one shows up
      setReviewText('');
      setReviewRating(0);
      setShowReviewForm(false);
      await fetchReviews();
    } catch (err: any) {
      console.error('Submit review error:', err);
      alert(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black pt-15 pb-20 animate-pulse">

        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex gap-6 mb-6">
            <div className="w-40 h-40 rounded-lg bg-[#181818] shrink-0" />
            <div className="flex-1 flex flex-col justify-center">
              <div className="h-8 bg-[#181818] rounded w-3/4 mb-4" />
              <div className="h-5 bg-[#181818] rounded w-1/2 mb-2" />
              <div className="h-4 bg-[#181818] rounded w-1/4 mb-6" />
              <div className="h-10 bg-[#181818] rounded w-20" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!songData) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-white">Song not found</div>;
  }

  return (
    <div className="min-h-screen bg-black pb-20 pt-15">
      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* song header */}
        <div className="flex gap-6 mb-6">
          {songData.imageUrl ? (
            <ImageWithFallback
              src={songData.imageUrl}
              alt={songData.name}
              className="w-40 h-40 rounded-lg object-cover shadow-2xl shrink-0"
            />
          ) : (
            <div className="w-40 h-40 rounded-lg bg-linear-to-br from-gray-800 to-gray-900 flex items-center justify-center shrink-0 shadow-2xl">
              <Music className="w-12 h-12 text-gray-500" />
            </div>
          )}
          <div className="flex-1 flex flex-col justify-center">
            <h2 className="text-3xl font-bold text-white mb-2">{songData.name}</h2>
            {songData.artists && (
              <button
                onClick={() => router.push(`/artist/${songData.artist_id}`)}
                className="text-gray-300 hover:text-white text-lg mb-2 text-left transition-colors"
              >
                {songData.artists.name}
              </button>
            )}

            {/* rating based on spotify popularity, scaled to /10 */}
            {songData.popularity !== undefined && (
              <>
                <div className="flex items-baseline gap-2 mb-3 mt-2">
                  <span className="text-4xl font-bold text-[#1DB954]">
                    {(songData.popularity / 10).toFixed(1)}
                  </span>
                  <span className="text-gray-400 text-sm">/ 10</span>
                </div>
                <p className="text-gray-500 text-xs">Simulated from Global Streams</p>
              </>
            )}
          </div>
        </div>

        {/* streaming links */}
        <div className="flex gap-3 mb-8">
          {songData.spotify_id && (
            <a
              href={`https://open.spotify.com/track/${songData.spotify_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 bg-[#1DB954] hover:bg-[#1ed760] text-white px-4 py-3 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
              </svg>
              <span className="font-medium">Spotify</span>
            </a>
          )}
          {songData.apple_music_id && (
            <a
              href={`https://music.apple.com/song/${songData.apple_music_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 bg-[#FA2D48] hover:bg-[#ff3d58] text-white px-4 py-3 rounded-full transition-colors"
            >
              <Music className="w-5 h-5" />
              <span className="font-medium">Apple Music</span>
            </a>
          )}
        </div>

        {/* user reviews */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold">User Reviews</h3>
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="text-[#1DB954] hover:text-[#1ed760] text-sm font-medium transition-colors"
            >
              {showReviewForm ? 'Cancel' : 'Write a Review'}
            </button>
          </div>

          {/* write a review form — shows when the user clicks the button */}
          {showReviewForm && (
            <div className="bg-[#181818] rounded-xl p-5 mb-6 border border-gray-800/50">
              <div className="mb-4">
                <label className="text-gray-400 text-sm mb-2 block">Your Rating</label>
                <VinylRating
                  rating={reviewRating}
                  interactive={true}
                  size="lg"
                  onRatingChange={(r) => setReviewRating(r)}
                />
              </div>
              <div className="mb-4">
                <label className="text-gray-400 text-sm mb-2 block">Your Review</label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="What did you think of this song?"
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg p-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#1DB954] transition-colors resize-none min-h-30"
                />
              </div>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setShowReviewForm(false);
                    setReviewText('');
                    setReviewRating(0);
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white text-sm transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReview}
                  disabled={submitting}
                  className="flex items-center gap-2 bg-[#1DB954] hover:bg-[#1ed760] disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-full text-sm font-medium transition-colors"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </div>
          )}

          {/* all reviews for this song */}
          <div className="space-y-4">
            {reviewsLoading ? (
              <div className="space-y-3 animate-pulse">
                {[1, 2].map(i => (
                  <div key={i} className="bg-[#181818] rounded-xl p-5 h-28" />
                ))}
              </div>
            ) : reviews.length > 0 ? (
              reviews.map((r: any) => (
                <div key={r.id} className="relative flex flex-col border border-white/5 bg-[#121212]/80 backdrop-blur-xl rounded-2xl p-5 hover:bg-[#151515] transition-all duration-300 overflow-hidden group shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] cursor-pointer">
                  {/* Atmospheric Background Glow */}
                  <div className="absolute -top-32 -right-32 w-64 h-64 bg-[#1DB954]/5 rounded-full blur-[80px] group-hover:bg-[#1DB954]/10 transition-colors duration-700 pointer-events-none z-0" />
                  <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-purple-500/5 rounded-full blur-[80px] group-hover:bg-purple-500/10 transition-colors duration-700 pointer-events-none z-0" />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <ProfilePicture size={14} src={r.users.profile_picture_url} />
                        <div className="flex-1 min-w-0 ml-2">
                          <div className="flex items-center gap-2">
                            <div
                              onClick={() => router.push(`/user/${r.users.username}`)}
                              className="text-white font-medium hover:text-[#1DB954] transition-colors truncate cursor-pointer"
                            >
                              {r.users.name || r.users.username}
                            </div>
                            <span className="text-gray-500 text-xs shrink-0">•</span>
                            <span className="text-gray-400 text-xs font-medium">{getTimeAgo(r.created_at)}</span>
                          </div>
                          <p className="text-gray-500 text-xs">
                            @{r.users.username}
                          </p>
                        </div>
                      </div>

                      {/* Vinyl Rating Badge */}
                      {r.rating != null && (
                        <div className="flex items-center bg-black/40 px-2.5 py-1.5 rounded-lg border border-white/5 backdrop-blur-md shadow-inner">
                          <VinylRating rating={Number(r.rating)} size="md" />
                        </div>
                      )}
                    </div>
                    {r.review && (
                      <div className="mt-2 mb-2">
                        <p className="text-gray-200/90 text-[15px] leading-relaxed line-clamp-3 font-medium">
                          {r.review}
                        </p>
                      </div>
                    )}
                    {r.edited_at && (
                      <p className="text-gray-500 text-[11px] mt-1 italic tracking-wide">edited</p>
                    )}
                    <div className="w-full mt-2">
                      <ReviewComments reviewId={r.id} userId={userId} />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No reviews yet. Be the first!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}