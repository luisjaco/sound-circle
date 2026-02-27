"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Settings, Music, ArrowLeft } from "lucide-react";
import { VinylRating } from "../../components/vinyl-rating";
import { Button } from "../../components/ui/button";
import { ImageWithFallback } from "../../components/img/ImageWithFallback";

export default function ProfilePage() {
  const router = useRouter();

  const userReviews = [
    {
      id: 1,
      albumArt:
        "https://images.unsplash.com/photo-1616663395403-2e0052b8e595?w=400",
      albumTitle: "Midnight Echoes",
      artistName: "The Velvet Underground",
      rating: 5,
      reviewText:
        "An absolute masterpiece. The production is flawless and every track tells a story.",
      likes: 127,
      comments: 23,
    },
    {
      id: 2,
      albumArt:
        "https://images.unsplash.com/photo-1703115015343-81b498a8c080?w=400",
      albumTitle: "Neon Nights",
      artistName: "Synthwave Society",
      rating: 5,
      reviewText: "Pure 80s nostalgia done right. The synth work is incredible.",
      likes: 203,
      comments: 41,
    },
    {
      id: 3,
      albumArt:
        "https://images.unsplash.com/photo-1681148773098-1460911e25a4?w=400",
      albumTitle: "Jazz After Dark",
      artistName: "Miles Ahead Quartet",
      rating: 4,
      reviewText:
        "Stunning jazz fusion that pushes boundaries while respecting tradition.",
      likes: 156,
      comments: 28,
    },
    {
      id: 4,
      albumArt:
        "https://images.unsplash.com/photo-1761814684971-fa0e7fd606e2?w=400",
      albumTitle: "Summer Vibes",
      artistName: "Coastal Dreams",
      rating: 3,
      reviewText:
        "Pleasant but forgettable. Good background music for summer parties.",
      likes: 45,
      comments: 12,
    },
  ];

  const favoriteArtists = [
    {
      id: 1,
      name: "MFDOOM",
      image:
        "https://images.unsplash.com/photo-1614247912229-26a7e2114c0a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    },
    {
      id: 2,
      name: "Joji",
      image:
        "https://images.unsplash.com/photo-1729156574338-d39065184b0c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    },
    {
      id: 3,
      name: "Steely Dan",
      image:
        "https://images.unsplash.com/photo-1602026084040-78e6134b2661?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    },
  ];

  const favoriteAlbums = [
    {
      id: 1,
      title: "The Royal Scam",
      artist: "Steely Dan",
      image:
        "https://images.unsplash.com/photo-1632491785983-57fe3ebf0395?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    },
    {
      id: 2,
      title: "Born like This",
      artist: "MFDOOM",
      image:
        "https://images.unsplash.com/photo-1616663395403-2e0052b8e595?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    },
    {
      id: 3,
      title: "Ballads 1",
      artist: "Joji",
      image:
        "https://images.unsplash.com/photo-1506628150-ab62050f199c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    },
  ];

  const stats = {
    reviews: userReviews.length,
    followers: 342,
    following: 189,
  };

  return (
    <div className="min-h-screen bg-black pb-20">
      {/* Header */}
      <header className="bg-[#0a0a0a] border-b border-gray-800 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/")}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-white">Profile</h1>
          </div>
          <button
            onClick={() => router.push("/settings")}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4">
        {/* Profile Header */}
        <div className="py-6 border-b border-gray-800">
          <div className="flex items-start gap-6 mb-6">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1557511113-84fb922d34d5?w=400"
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover"
            />
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-2">
                musiclover_42
              </h2>
              <p className="text-gray-400 text-sm mb-4">
                Music enthusiast | Vinyl collector | Always discovering new
                sounds 🎵
              </p>

              {/* Connected Services */}
              <div className="flex gap-3 mb-4">
                <div className="flex items-center gap-2 bg-[#181818] px-3 py-1.5 rounded-full">
                  <svg
                    className="w-4 h-4 text-[#1DB954]"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3"/>
                  </svg>
                  <span className="text-xs text-gray-300">Spotify</span>
                </div>
                <div className="flex items-center gap-2 bg-[#181818] px-3 py-1.5 rounded-full">
                  <Music className="w-4 h-4 text-[#FA2D48]" />
                  <span className="text-xs text-gray-300">Apple Music</span>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-white font-bold text-lg">{stats.reviews}</p>
                  <p className="text-gray-400 text-sm">Reviews</p>
                </div>
                <div className="text-center">
                  <p className="text-white font-bold text-lg">{stats.followers}</p>
                  <p className="text-gray-400 text-sm">Followers</p>
                </div>
                <div className="text-center">
                  <p className="text-white font-bold text-lg">{stats.following}</p>
                  <p className="text-gray-400 text-sm">Following</p>
                </div>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full border-gray-700 bg-transparent hover:bg-[#181818] text-white rounded-full"
            onClick={() => router.push("/edit-profile")}
          >
            Edit Profile
          </Button>
        </div>

        {/* Favorites Section */}
        <div className="py-6 border-b border-gray-800">
          <div className="grid grid-cols-2 gap-6">
            {/* Favorite Artists */}
            <div>
              <h3 className="text-white font-bold mb-4 px-1 text-sm">Favorite Artists</h3>
              <div className="flex flex-col gap-3">
                {favoriteArtists.map((artist) => (
                  <div
                    key={artist.id}
                    className="flex items-center gap-3 cursor-pointer group"
                    onClick={() => router.push("/artist")}
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-[#1DB954] p-0.5 group-hover:ring-[#1ed760] transition-all shrink-0">
                      <ImageWithFallback
                        src={artist.image}
                        alt={artist.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    </div>
                    <p className="text-white text-xs truncate flex-1">
                      {artist.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Favorite Albums */}
            <div>
              <h3 className="text-white font-bold mb-4 px-1 text-sm">Favorite Albums</h3>
              <div className="flex flex-col gap-3">
                {favoriteAlbums.map((album) => (
                  <div
                    key={album.id}
                    className="flex items-center gap-3 cursor-pointer group"
                    onClick={() => router.push("/album")}
                  >
                    <div className="w-12 h-12 rounded-md overflow-hidden ring-2 ring-gray-700 group-hover:ring-[#1DB954] transition-all shrink-0">
                      <ImageWithFallback
                        src={album.image}
                        alt={album.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs truncate">
                        {album.title}
                      </p>
                      <p className="text-gray-500 text-xs truncate">
                        {album.artist}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="py-6">
          <h3 className="text-white font-bold mb-4">My Reviews</h3>
          <div className="grid gap-3">
            {userReviews.map((review) => (
              <div
                key={review.id}
                className="bg-[#181818] rounded-lg p-4 hover:bg-[#282828] transition-colors cursor-pointer"
                onClick={() => router.push("/comments")}
              >
                <div className="flex gap-4">
                  <ImageWithFallback
                    src={review.albumArt}
                    alt={review.albumTitle}
                    className="w-16 h-16 rounded-md object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-medium truncate mb-1">{review.albumTitle}</h4>
                    <p className="text-gray-400 text-sm mb-2">{review.artistName}</p>
                    <VinylRating rating={review.rating} size="sm" />
                    <p className="text-gray-300 text-sm mt-2 line-clamp-2">{review.reviewText}</p>
                    <div className="flex gap-4 mt-2 text-gray-500 text-xs">
                      <span>{review.likes} likes</span>
                      <span>{review.comments} comments</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}