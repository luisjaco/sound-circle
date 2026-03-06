"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Settings, Music, ArrowLeft, Loader2, Heart } from "lucide-react";
import { VinylRating } from "../../components/vinyl-rating";
import { Button } from "../../components/ui/button";
import { ImageWithFallback } from "../../components/img/ImageWithFallback";
import { useMusicKit } from "@/components/providers/MusicKitProvider";

// ---------- Types ----------

interface FavoriteArtist {
  id: string;
  catalogId: string | null;
  name: string;
  artwork: {
    url: string;
    width: number;
    height: number;
    bgColor?: string;
  } | null;
  genres: string[];
  url: string | null;
}

interface FavoriteAlbum {
  id: string;
  catalogId: string | null;
  name: string;
  artistName: string;
  artwork: {
    url: string;
    width: number;
    height: number;
    bgColor?: string;
  } | null;
  genres: string[];
  url: string | null;
  releaseDate: string | null;
  trackCount: number | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const { musicKit, isAuthorized } = useMusicKit();

  // ---------- Favorite Artists State ----------
  const [favoriteArtistsFromApple, setFavoriteArtistsFromApple] = useState<FavoriteArtist[]>([]);
  const [favoriteAlbumsFromApple, setFavoriteAlbumsFromApple] = useState<FavoriteAlbum[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(true);
  const [favoritesError, setFavoritesError] = useState<string | null>(null);
  const [favoritesSource, setFavoritesSource] = useState<string | null>(null);

  // ---------- Fetch Favorite Artists ----------
  // Fetch favorite artists on page load — blocks render until complete
  useEffect(() => {
    let cancelled = false;

    const fetchFavoriteArtists = async () => {
      if (!musicKit || !isAuthorized) {
        // Not authorized — stop loading and show static fallback
        setLoadingFavorites(false);
        return;
      }

      const userMusicToken = musicKit.musicUserToken;
      if (!userMusicToken) {
        setFavoritesError("No music user token available. Please re-authorize Apple Music.");
        setLoadingFavorites(false);
        return;
      }

      setFavoritesError(null);

      try {
        const res = await fetch("/api/apple/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userMusicToken, types: ['artists', 'albums'], limit: 3 }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Failed to fetch favorites (${res.status})`);
        }

        const data = await res.json();
        if (!cancelled) {
          setFavoriteArtistsFromApple(data.artists || []);
          setFavoriteAlbumsFromApple(data.albums || []);
          setFavoritesSource(data.source || "favorites");
        }
      } catch (err: any) {
        console.error("Error fetching favorite artists:", err);
        if (!cancelled) {
          setFavoritesError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoadingFavorites(false);
        }
      }
    };

    fetchFavoriteArtists();

    return () => { cancelled = true; };
  }, [musicKit, isAuthorized]);

  // ---------- Artwork Helper ----------
  const getArtworkUrl = (url?: string, size = 120) => {
    if (!url) return null;
    return url
      .replace("{w}", size.toString())
      .replace("{h}", size.toString());
  };

  // ---------- Static Data (unchanged) ----------
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

  // Use Apple Music favorite artists if available
  const favoriteArtists = favoriteArtistsFromApple.map((a, i) => ({
    id: i + 1,
    name: a.name,
    image: getArtworkUrl(a.artwork?.url, 200) || "",
    catalogId: a.catalogId,
    genres: a.genres,
  }));

  // Use Apple Music favorite albums if available
  const favoriteAlbums = favoriteAlbumsFromApple.map((a, i) => ({
    id: i + 1,
    title: a.name,
    artist: a.artistName,
    image: getArtworkUrl(a.artwork?.url, 200) || "",
    catalogId: a.catalogId,
  }));

  const stats = {
    reviews: userReviews.length,
    followers: 342,
    following: 189,
  };

  // Show a loading screen while waiting for favorites data
  if (loadingFavorites) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#FA2D48]" />
          <p className="text-gray-400 text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

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
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3" />
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
              <div className="flex items-center gap-2 mb-4 px-1">
                <h3 className="text-white font-bold text-sm">Favorite Artists</h3>
                {favoriteArtistsFromApple.length > 0 && (
                  <Heart className="w-3.5 h-3.5 text-[#FA2D48] fill-[#FA2D48]" />
                )}
                {favoritesSource === "library-fallback" && (
                  <span className="text-[10px] text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded-full">
                    Library
                  </span>
                )}
                {loadingFavorites && (
                  <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                )}
              </div>

              {favoritesError && (
                <p className="text-xs text-red-400 mb-2 px-1">{favoritesError}</p>
              )}

              <div className="flex flex-col gap-3">
                {favoriteArtists.length > 0 ? (
                  favoriteArtists.map((artist) => (
                    <div
                      key={artist.id}
                      className="flex items-center gap-3 cursor-pointer group"
                      onClick={() => router.push("/artist")}
                    >
                      <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-[#1DB954] p-0.5 group-hover:ring-[#1ed760] transition-all shrink-0">
                        {artist.image ? (
                          <ImageWithFallback
                            src={artist.image}
                            alt={artist.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center">
                            <Music className="w-5 h-5 text-gray-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs truncate">
                          {artist.name}
                        </p>
                        {artist.genres && artist.genres.length > 0 && (
                          <p className="text-gray-500 text-[10px] truncate">
                            {artist.genres.slice(0, 2).join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  /* Skeleton placeholders when no data */
                  [0, 1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-3" style={{ animationDelay: `${i * 150}ms` }}>
                      <div className="w-12 h-12 rounded-full bg-gray-800 animate-pulse shrink-0" style={{ animationDelay: `${i * 150}ms` }} />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-20 bg-gray-800 rounded-full animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
                        <div className="h-2 w-14 bg-gray-800/60 rounded-full animate-pulse" style={{ animationDelay: `${i * 150 + 75}ms` }} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Favorite Albums */}
            <div>
              <div className="flex items-center gap-2 mb-4 px-1">
                <h3 className="text-white font-bold text-sm">Favorite Albums</h3>
                {favoriteAlbumsFromApple.length > 0 && (
                  <Heart className="w-3.5 h-3.5 text-[#FA2D48] fill-[#FA2D48]" />
                )}
              </div>
              <div className="flex flex-col gap-3">
                {favoriteAlbums.length > 0 ? (
                  favoriteAlbums.map((album) => (
                    <div
                      key={album.id}
                      className="flex items-center gap-3 cursor-pointer group"
                      onClick={() => router.push("/album")}
                    >
                      <div className="w-12 h-12 rounded-md overflow-hidden ring-2 ring-gray-700 group-hover:ring-[#1DB954] transition-all shrink-0">
                        {album.image ? (
                          <ImageWithFallback
                            src={album.image}
                            alt={album.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                            <Music className="w-5 h-5 text-gray-600" />
                          </div>
                        )}
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
                  ))
                ) : (
                  /* Skeleton placeholders when no data */
                  [0, 1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-md bg-gray-800 animate-pulse shrink-0" style={{ animationDelay: `${i * 150}ms` }} />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-20 bg-gray-800 rounded-full animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
                        <div className="h-2 w-14 bg-gray-800/60 rounded-full animate-pulse" style={{ animationDelay: `${i * 150 + 75}ms` }} />
                      </div>
                    </div>
                  ))
                )}
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