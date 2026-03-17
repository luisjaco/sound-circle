"use client"

import { useState, useEffect } from 'react';
import { useMusicKit } from '@/components/providers/MusicKitProvider';
import { Heart, Loader2, Music} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ImageWithFallback } from '@/components/img/ImageWithFallback';
import Artist from '@/components/Artist';

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

export default function ProfileBody() {
    const router = useRouter();
    const { musicKit, isAuthorized } = useMusicKit();

    const [favoriteArtistsFromApple, setFavoriteArtistsFromApple] = useState<FavoriteArtist[]>([]);
    const [favoriteAlbumsFromApple, setFavoriteAlbumsFromApple] = useState<FavoriteAlbum[]>([]);
    const [loadingFavorites, setLoadingFavorites] = useState(true);
    const [favoritesError, setFavoritesError] = useState<string | null>(null);
    const [favoritesSource, setFavoritesSource] = useState<string | null>(null);

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

    // Artwork Helper
    const getArtworkUrl = (url?: string, size = 120) => {
        if (!url) return null;
        return url
            .replace("{w}", size.toString())
            .replace("{h}", size.toString());
    };

    // Use Apple Music favorite artists if available
    const favoriteArtists = [
        {
            id: 5, 
            name: 'drake',
            image: 'https://imageio.forbes.com/specials-images/imageserve/5ed578988b3c370006234c35/0x0.jpg?format=jpg&crop=1031,1031,x43,y49,safe&height=416&width=416&fit=bounds',
            catalogId: 5,
            genres: ['hiu', 'hey']
        },
                {
            id: 6, 
            name: 'carti',
            image: 'https://imageio.forbes.com/specials-images/imageserve/5ed578988b3c370006234c35/0x0.jpg?format=jpg&crop=1031,1031,x43,y49,safe&height=416&width=416&fit=bounds',
            catalogId: 5,
            genres: ['hiu', 'hey']
        },
                {
            id: 7, 
            name: 'fuckj',
            image: 'https://imageio.forbes.com/specials-images/imageserve/5ed578988b3c370006234c35/0x0.jpg?format=jpg&crop=1031,1031,x43,y49,safe&height=416&width=416&fit=bounds',
            catalogId: 5,
            genres: ['hiu', 'hey']
        }
    ]
    
    
    // favoriteArtistsFromApple.map((a, i) => ({
    //     id: i + 1,
    //     name: a.name,
    //     image: getArtworkUrl(a.artwork?.url, 200) || "",
    //     catalogId: a.catalogId,
    //     genres: a.genres,
    // }));

    // Use Apple Music favorite albums if available
    const favoriteAlbums = favoriteAlbumsFromApple.map((a, i) => ({
        id: i + 1,
        title: a.name,
        artist: a.artistName,
        image: getArtworkUrl(a.artwork?.url, 200) || "",
        catalogId: a.catalogId,
    }));


    return (
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
                                <Artist 
                                    key={artist.id}
                                    artistId={0} 
                                    spotifyId='' 
                                    musicBrainzId='' 
                                    manualOverride={{
                                        artistId: artist.id,
                                        name: artist.name,
                                        image: artist.image,
                                        genres: artist.genres
                                    }}
                                />
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
    )
}