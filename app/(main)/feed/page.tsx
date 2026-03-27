"use client";

import React, { useState, useEffect } from "react";
import { TrendingUp, Music, Disc3, Loader2 } from "lucide-react";
import { ImageWithFallback } from "@/components/img/ImageWithFallback";
import { VinylRating } from "@/components/vinyl-rating";
import { UnifiedReview } from "@/lib/types/review";
import Link from "next/link";

type FeedFilter = "all" | "songs" | "albums";

function FeedReviewCard({ review }: { review: UnifiedReview }) {
  const itemName =
    review.review_type === "song"
      ? review.song?.name ?? "Unknown Song"
      : review.album?.name ?? "Unknown Album";

  const artistName =
    review.review_type === "song"
      ? review.song?.artists?.name ?? "Unknown Artist"
      : review.album?.artists?.name ?? "Unknown Artist";

  const effectiveDate = review.edited_at || review.created_at;
  const timeAgo = getTimeAgo(effectiveDate);

  return (
    <div className="bg-[#181818] rounded-xl p-5 hover:bg-[#1f1f1f] transition-all duration-200 border border-gray-800/50">
      {/* User header */}
      <div className="flex items-center gap-3 mb-4">
        <Link href={`/user/${review.user.username}`}>
          {review.user.profile_picture_url ? (
            <ImageWithFallback
              src={review.user.profile_picture_url}
              alt={review.user.username}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-700 hover:ring-[#1DB954] transition-all"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1DB954] to-emerald-700 flex items-center justify-center ring-2 ring-gray-700 hover:ring-[#1DB954] transition-all">
              <span className="text-white font-bold text-sm">
                {review.user.username.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={`/user/${review.user.username}`}
              className="text-white font-medium hover:text-[#1DB954] transition-colors truncate"
            >
              {review.user.name || review.user.username}
            </Link>
            <span className="text-gray-500 text-xs shrink-0">•</span>
            <span className="text-gray-500 text-xs shrink-0">{timeAgo}</span>
          </div>
          <p className="text-gray-500 text-xs">
            @{review.user.username}
          </p>
        </div>
        {/* Review type badge */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
            review.review_type === "song"
              ? "bg-purple-500/15 text-purple-400 border border-purple-500/20"
              : "bg-blue-500/15 text-blue-400 border border-blue-500/20"
          }`}
        >
          {review.review_type === "song" ? (
            <Music className="w-3 h-3" />
          ) : (
            <Disc3 className="w-3 h-3" />
          )}
          {review.review_type === "song" ? "Song" : "Album"}
        </div>
      </div>

      {/* Song/Album info */}
      <div className="flex gap-4 mb-3">
        {review.review_type === "song" && review.song?.cover_art_url ? (
          <ImageWithFallback
            src={review.song.cover_art_url}
            alt={itemName}
            className="w-16 h-16 rounded-lg object-cover shrink-0 border border-gray-700/50"
          />
        ) : review.review_type === "album" && review.album?.cover_art_url ? (
          <ImageWithFallback
            src={review.album.cover_art_url}
            alt={itemName}
            className="w-16 h-16 rounded-lg object-cover shrink-0 border border-gray-700/50"
          />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center shrink-0 border border-gray-700/50">
            {review.review_type === "song" ? (
              <Music className="w-7 h-7 text-gray-500" />
            ) : (
              <Disc3 className="w-7 h-7 text-gray-500" />
            )}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold truncate text-[15px]">
            {itemName}
          </h3>
          <p className="text-gray-400 text-sm">{artistName}</p>
          {review.rating != null && (
            <div className="mt-1.5">
              <VinylRating rating={review.rating} size="sm" />
            </div>
          )}
        </div>
      </div>

      {/* Review text */}
      {review.review && (
        <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">
          {review.review}
        </p>
      )}

      {/* Edited indicator */}
      {review.edited_at && (
        <p className="text-gray-600 text-xs mt-2 italic">edited</p>
      )}
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  if (diffWeeks < 52) return `${diffWeeks}w`;
  return then.toLocaleDateString();
}

export default function FeedPage() {
  const [reviews, setReviews] = useState<UnifiedReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FeedFilter>("all");

  useEffect(() => {
    async function fetchReviews() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (filter === "songs") params.set("type", "songs");
        if (filter === "albums") params.set("type", "albums");

        const res = await fetch(`/api/supabase/reviews?${params.toString()}`);
        if (!res.ok) {
          throw new Error("Failed to fetch reviews");
        }
        const data: UnifiedReview[] = await res.json();

        // For global feed, only show public reviews
        const publicReviews = data.filter((r) => r.is_public);
        setReviews(publicReviews);
      } catch (err: any) {
        console.error("Feed fetch error:", err);
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    fetchReviews();
  }, [filter]);

  return (
    <div className="min-h-screen bg-black pb-20">
      <div className="max-w-2xl mx-auto px-4 pt-4">
        {/* Filter Tabs */}
        <div className="flex gap-1 mb-6 bg-[#111] rounded-lg p-1 border border-gray-800/50">
          {(
            [
              { key: "all" as FeedFilter, label: "All Reviews", icon: undefined },
              { key: "songs" as FeedFilter, label: "Songs", icon: Music },
              { key: "albums" as FeedFilter, label: "Albums", icon: Disc3 },
            ]
          ).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-md text-sm font-medium transition-all duration-200 ${
                filter === key
                  ? "bg-[#1DB954] text-black shadow-lg shadow-[#1DB954]/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {Icon && <Icon className="w-4 h-4" />}
              {label}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-[#1DB954] animate-spin" />
            <p className="text-gray-500 text-sm">Loading reviews...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-20">
            <p className="text-red-400 text-sm mb-4">{error}</p>
            <button
              onClick={() => setFilter(filter)}
              className="text-[#1DB954] text-sm hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && reviews.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-gray-600" />
            </div>
            <p className="text-gray-400 font-medium">No reviews yet</p>
            <p className="text-gray-600 text-sm">
              Be the first to share a review!
            </p>
          </div>
        )}

        {/* Reviews Feed */}
        {!loading && !error && reviews.length > 0 && (
          <div className="space-y-4">
            {reviews.map((review) => (
              <FeedReviewCard
                key={`${review.review_type}-${review.id}`}
                review={review}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}