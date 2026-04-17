"use client";

import React, { useState, useEffect } from "react";
import { TrendingUp, Music, Disc3, Loader2 } from "lucide-react";
import { UnifiedReview } from "@/lib/types/review";
import Review from "@/components/Review";

type FeedFilter = "all" | "songs" | "albums";

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
              { key: "all", label: "All Reviews", icon: undefined },
              { key: "songs", label: "Songs", icon: Music },
              { key: "albums", label: "Albums", icon: Disc3 },
            ] as const
          ).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer ${filter === key
                  ? "bg-[#1DB954] text-black"
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
              <Review
                key={`${review.review_type}-${review.id}`}
                review={review}
                showUser={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}