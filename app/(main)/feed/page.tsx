"use client";

import React, { useState } from "react";
import { ReviewCard } from "@/components/review-card";
import { Home, Search, PlusCircle, User, TrendingUp } from "lucide-react";

interface HomeFeedProps {
  onNavigate: (page: string) => void;
}

export function HomeFeed({ onNavigate }: HomeFeedProps) {
  const [activeTab, setActiveTab] = useState<"feed" | "trending">("feed");

  const mockReviews = [
    {
      id: 1,
      albumArt:
        "https://images.unsplash.com/photo-1616663395403-2e0052b8e595?w=400",
      albumTitle: "Midnight Echoes",
      artistName: "The Velvet Underground",
      rating: 5,
      reviewText:
        "An absolute masterpiece. The production is flawless and every track tells a story. This album perfectly captures the essence of modern alternative rock while paying homage to the classics.",
      username: "musiclover_42",
      userAvatar:
        "https://images.unsplash.com/photo-1557511113-84fb922d34d5?w=200",
      likes: 127,
      comments: 23,
      isLiked: false,
    },
    {
      id: 2,
      albumArt:
        "https://images.unsplash.com/photo-1760996608164-f61b51c34c36?w=400",
      albumTitle: "Urban Dreams",
      artistName: "Nova Wave",
      rating: 4,
      reviewText:
        "Really solid sophomore effort. The beats are infectious and the lyrics show real growth. Could use a bit more variety in the production but overall a great listen.",
      username: "vinylcollector",
      userAvatar:
        "https://images.unsplash.com/photo-1557511113-84fb922d34d5?w=200",
      likes: 89,
      comments: 15,
      isLiked: true,
    },
    {
      id: 3,
      albumArt:
        "https://images.unsplash.com/photo-1703115015343-81b498a8c080?w=400",
      albumTitle: "Neon Nights",
      artistName: "Synthwave Society",
      rating: 5,
      reviewText:
        "Pure 80s nostalgia done right. The synth work is incredible and the atmosphere is perfect for late night drives. Best electronic album of the year hands down.",
      username: "retrobeat",
      userAvatar:
        "https://images.unsplash.com/photo-1557511113-84fb922d34d5?w=200",
      likes: 203,
      comments: 41,
      isLiked: false,
    },
    {
      id: 4,
      albumArt:
        "https://images.unsplash.com/photo-1761814684971-fa0e7fd606e2?w=400",
      albumTitle: "Summer Vibes",
      artistName: "Coastal Dreams",
      rating: 3,
      reviewText:
        "Pleasant but forgettable. Good background music for summer parties but nothing really stands out. A few catchy choruses save it from being completely generic.",
      username: "criticalears",
      userAvatar:
        "https://images.unsplash.com/photo-1557511113-84fb922d34d5?w=200",
      likes: 45,
      comments: 12,
      isLiked: false,
    },
    {
      id: 5,
      albumArt:
        "https://images.unsplash.com/photo-1681148773098-1460911e25a4?w=400",
      albumTitle: "Jazz After Dark",
      artistName: "Miles Ahead Quartet",
      rating: 5,
      reviewText:
        "Stunning jazz fusion that pushes boundaries while respecting tradition. The improvisations are breathtaking and the chemistry between the musicians is undeniable.",
      username: "jazzfanatic",
      userAvatar:
        "https://images.unsplash.com/photo-1557511113-84fb922d34d5?w=200",
      likes: 156,
      comments: 28,
      isLiked: true,
    },
  ];

  return (
    <div className="min-h-screen bg-black pb-20">
      {/* Tabs */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="flex gap-4 mb-6 border-b border-gray-800">
          <button
            onClick={() => setActiveTab("feed")}
            className={`pb-3 px-2 font-medium transition-colors relative ${
              activeTab === "feed"
                ? "text-[#1DB954]"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Following
            {activeTab === "feed" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1DB954]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("trending")}
            className={`pb-3 px-2 font-medium transition-colors relative flex items-center gap-2 ${
              activeTab === "trending"
                ? "text-[#1DB954]"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Trending
            {activeTab === "trending" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1DB954]" />
            )}
          </button>
        </div>

        {/* Feed */}
        <div className="space-y-4">
          {mockReviews.map((review) => (
            <ReviewCard
              key={review.id}
              {...review}
              onComment={() => onNavigate("comments")}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function TestReviewPage() {
  const noop = (page: string) => {
    // eslint-disable-next-line no-console
    console.log("navigate to", page);
  };

  return <HomeFeed onNavigate={noop} />;
}