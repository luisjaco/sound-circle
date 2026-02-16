'use client';

import React, { useState } from 'react';
import { useMusicKit } from '@/components/providers/MusicKitProvider';
import AppleMusicAuthBtn from '@/components/AppleMusicAuthBtn';
import { ListMusic, Loader2, PlayCircle, Music, Clock, X, Disc } from 'lucide-react';

interface Playlist {
    id: string;
    attributes: {
        name: string;
        description?: { standard: string };
        artwork?: { url: string; width: number | null; height: number | null };
        playParams: { id: string; kind: string };
    };
}

interface Track {
    id: string;
    attributes: {
        name: string;
        artistName: string;
        albumName?: string;
        artwork?: { url: string; width: number | null; height: number | null };
        durationInMillis?: number;
    };
}

export default function AppleMusicTestPage() {
    const { musicKit, isAuthorized, initializationError } = useMusicKit();

    // Data States
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [recentTracks, setRecentTracks] = useState<Track[]>([]);
    const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
    const [playlistTracks, setPlaylistTracks] = useState<Track[]>([]);

    // Loading/Error States
    const [error, setError] = useState<string | null>(null);
    const [loadingPlaylists, setLoadingPlaylists] = useState(false);
    const [loadingRecent, setLoadingRecent] = useState(false);
    const [loadingPlaylistTracks, setLoadingPlaylistTracks] = useState(false);

    const fetchLibrary = async () => {
        if (!musicKit || !isAuthorized) return;

        setLoadingPlaylists(true);
        setError(null);
        setPlaylists([]);

        try {
            let res;
            if (musicKit.api && musicKit.api.library) {
                res = await musicKit.api.library.playlists({ limit: 20 });
            } else if (musicKit.api && musicKit.api.music) {
                res = await musicKit.api.music('v1/me/library/playlists', { limit: 20 });
            } else {
                throw new Error('MusicKit API unavailable');
            }

            let items: any[] = [];
            if (Array.isArray(res)) items = res;
            else if (res.data && Array.isArray(res.data)) items = res.data;
            else if (res.data && res.data.data && Array.isArray(res.data.data)) items = res.data.data;

            setPlaylists(items);

        } catch (err: any) {
            console.error("API Error:", err);
            setError(err.message || "Failed to fetch playlists");
        } finally {
            setLoadingPlaylists(false);
        }
    };

    const fetchRecentTracks = async () => {
        if (!musicKit || !isAuthorized) return;

        setLoadingRecent(true);
        setError(null);
        setRecentTracks([]);

        try {
            // v1/me/recent/played/tracks
            let res;
            if (musicKit.api && musicKit.api.music) {
                res = await musicKit.api.music('v1/me/recent/played/tracks', { limit: 5 });
            } else {
                throw new Error('MusicKit API unavailable');
            }

            let items: any[] = [];
            if (Array.isArray(res)) items = res;
            else if (res.data && Array.isArray(res.data)) items = res.data;
            else if (res.data && res.data.data && Array.isArray(res.data.data)) items = res.data.data;

            setRecentTracks(items);
        } catch (err: any) {
            console.error("Recent Tracks API Error:", err);
            setError(err.message || "Failed to fetch recent tracks");
        } finally {
            setLoadingRecent(false);
        }
    };

    const fetchPlaylistTracks = async (playlist: Playlist) => {
        if (!musicKit || !isAuthorized) return;

        setSelectedPlaylist(playlist);
        setLoadingPlaylistTracks(true);
        setPlaylistTracks([]);
        setError(null);

        try {
            // v1/me/library/playlists/{id}/tracks
            let res;
            if (musicKit.api && musicKit.api.music) {
                res = await musicKit.api.music(`v1/me/library/playlists/${playlist.id}/tracks`, { limit: 50 });
            } else {
                throw new Error('MusicKit API unavailable');
            }

            let items: any[] = [];
            if (Array.isArray(res)) items = res;
            else if (res.data && Array.isArray(res.data)) items = res.data;
            else if (res.data && res.data.data && Array.isArray(res.data.data)) items = res.data.data;

            setPlaylistTracks(items);
        } catch (err: any) {
            console.error("Playlist Tracks API Error:", err);
            setError(err.message || "Failed to fetch playlist tracks");
        } finally {
            setLoadingPlaylistTracks(false);
        }
    };

    // Helper to format artwork URL
    const getArtworkUrl = (url?: string, size = 120) => {
        if (!url) return null;
        return url.replace('{w}', size.toString()).replace('{h}', size.toString());
    };

    // Helper to format duration
    const formatDuration = (ms?: number) => {
        if (!ms) return '-:--';
        const minutes = Math.floor(ms / 60000);
        const seconds = ((ms % 60000) / 1000).toFixed(0);
        return `${minutes}:${Number(seconds) < 10 ? '0' : ''}${seconds}`;
    };

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-red-500/30 pb-20">

            {/* Background Gradient */}
            <div className="fixed inset-0 bg-gradient-to-b from-neutral-900/50 to-black pointer-events-none" />

            <div className="relative max-w-6xl mx-auto px-6 py-12 space-y-12">

                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-8">
                    <div className="space-y-2">
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-pink-500">
                            Apple Music
                        </h1>
                        <p className="text-neutral-400 text-lg">
                            Integration Status & Library Test
                        </p>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm">
                        {initializationError ? (
                            <>
                                <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_currentColor]" />
                                <span className="font-medium text-sm text-red-400">Error Init</span>
                            </>
                        ) : !musicKit ? (
                            <>
                                <Loader2 className="w-3 h-3 animate-spin text-yellow-500" />
                                <span className="font-medium text-sm text-neutral-200">Initializing...</span>
                            </>
                        ) : (
                            <>
                                <div className={`w-3 h-3 rounded-full shadow-[0_0_10px_currentColor] ${isAuthorized ? "bg-green-500 text-green-500" : "bg-red-500 text-red-500"}`} />
                                <span className="font-medium text-sm text-neutral-200">
                                    {isAuthorized ? "Connected" : "Disconnected"}
                                </span>
                            </>
                        )}
                    </div>
                </header>

                {/* Actions */}
                <section className="space-y-8">
                    <div className="flex flex-wrap items-center gap-4">
                        <AppleMusicAuthBtn />

                        {isAuthorized && (
                            <>
                                <button
                                    onClick={fetchLibrary}
                                    disabled={loadingPlaylists}
                                    className="group flex items-center gap-2 px-6 py-3 rounded-full font-medium bg-neutral-800 text-white hover:bg-neutral-700 transition-all duration-300 disabled:opacity-50"
                                >
                                    {loadingPlaylists ? <Loader2 className="w-5 h-5 animate-spin" /> : <ListMusic className="w-5 h-5" />}
                                    <span>My Playlists</span>
                                </button>
                                <button
                                    onClick={fetchRecentTracks}
                                    disabled={loadingRecent}
                                    className="group flex items-center gap-2 px-6 py-3 rounded-full font-medium bg-neutral-800 text-white hover:bg-neutral-700 transition-all duration-300 disabled:opacity-50"
                                >
                                    {loadingRecent ? <Loader2 className="w-5 h-5 animate-spin" /> : <Clock className="w-5 h-5" />}
                                    <span>Recent Songs</span>
                                </button>
                            </>
                        )}
                    </div>

                    {error && (
                        <div className="p-4 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20 flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                            {error}
                        </div>
                    )}
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                    {/* Main Content Area (Playlists or Recent) */}
                    <div className="lg:col-span-2 space-y-12">

                        {/* Recent Tracks Section */}
                        {recentTracks.length > 0 && (
                            <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <h2 className="text-2xl font-semibold flex items-center gap-2 text-white/90">
                                    <Clock className="w-6 h-6 text-pink-500" />
                                    Recently Played
                                </h2>
                                <div className="bg-neutral-900/40 rounded-3xl border border-white/5 overflow-hidden">
                                    {recentTracks.map((track, i) => {
                                        const artworkUrl = getArtworkUrl(track.attributes.artwork?.url, 120);
                                        return (
                                            <div key={track.id} className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 group">
                                                <div className="w-12 h-12 rounded-lg bg-neutral-800 overflow-hidden flex-shrink-0 relative">
                                                    {artworkUrl ? (
                                                        /* eslint-disable-next-line @next/next/no-img-element */
                                                        <img src={artworkUrl} alt={track.attributes.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Music className="w-6 h-6 text-neutral-600 m-auto" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-medium text-white truncate group-hover:text-pink-400 transition-colors">{track.attributes.name}</h4>
                                                    <p className="text-sm text-neutral-400 truncate">{track.attributes.artistName}</p>
                                                </div>
                                                <div className="text-xs text-neutral-500 font-mono">
                                                    {formatDuration(track.attributes.durationInMillis)}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                        {/* Playlists Grid */}
                        {playlists.length > 0 && (
                            <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <h2 className="text-2xl font-semibold flex items-center gap-2 text-white/90">
                                    <ListMusic className="w-6 h-6 text-red-500" />
                                    Your Playlists
                                </h2>

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                                    {playlists.map((playlist) => {
                                        const attrs = playlist.attributes || {};
                                        const artworkUrl = getArtworkUrl(attrs.artwork?.url, 600);
                                        return (
                                            <div
                                                key={playlist.id}
                                                onClick={() => fetchPlaylistTracks(playlist)}
                                                className="group relative bg-neutral-900/40 rounded-2xl overflow-hidden cursor-pointer hover:bg-neutral-900/80 transition-all duration-300 border border-white/5 hover:border-white/10 hover:shadow-2xl hover:shadow-red-900/10"
                                            >
                                                <div className="aspect-square w-full bg-neutral-800 relative overflow-hidden">
                                                    {artworkUrl ? (
                                                        /* eslint-disable-next-line @next/next/no-img-element */
                                                        <img
                                                            src={artworkUrl}
                                                            alt={attrs.name || 'Playlist'}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                            loading="lazy"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-neutral-600 bg-neutral-800">
                                                            <Music className="w-12 h-12" />
                                                        </div>
                                                    )}

                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                                        <Disc className="w-12 h-12 text-white drop-shadow-lg animate-spin-slow" />
                                                    </div>
                                                </div>

                                                <div className="p-4 space-y-1">
                                                    <h3 className="font-semibold text-white truncate group-hover:text-red-400 transition-colors">
                                                        {attrs.name || 'Untitled Playlist'}
                                                    </h3>
                                                    <p className="text-sm text-neutral-500 truncate">
                                                        {attrs.description?.standard || 'Playlist'}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                        {/* Empty State / Prompt */}
                        {isAuthorized && playlists.length === 0 && recentTracks.length === 0 && !loadingPlaylists && !loadingRecent && !error && (
                            <div className="text-center py-20 bg-neutral-900/20 rounded-3xl border border-white/5 dashed-border">
                                <p className="text-neutral-500">Click "My Playlists" or "Recent Songs" to see your Apple Music library.</p>
                            </div>
                        )}
                    </div>

                    {/* Playlist Detail Sidebar */}
                    {/* Using a Portal-like behavior with fixed positioning overlay for better z-index management */}
                    <div
                        className={`fixed inset-y-0 right-0 w-full md:w-[480px] bg-neutral-900/95 border-l border-white/10 backdrop-blur-xl shadow-2xl transform transition-transform duration-300 z-[100] flex flex-col h-[100dvh]
                ${selectedPlaylist ? 'translate-x-0' : 'translate-x-full'}`}
                    >
                        {selectedPlaylist && (
                            <>
                                {/* Sidebar Header */}
                                <div className="p-6 md:p-8 pb-4 flex-shrink-0 flex flex-col gap-6 border-b border-white/5 bg-neutral-900/50">
                                    <button
                                        onClick={() => setSelectedPlaylist(null)}
                                        className="self-end p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors text-white"
                                        aria-label="Close sidebar"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>

                                    <div className="flex gap-5 items-start">
                                        <div className="aspect-square w-32 md:w-40 rounded-xl overflow-hidden bg-neutral-800 shadow-2xl flex-shrink-0">
                                            {getArtworkUrl(selectedPlaylist.attributes.artwork?.url, 400) ? (
                                                /* eslint-disable-next-line @next/next/no-img-element */
                                                <img
                                                    src={getArtworkUrl(selectedPlaylist.attributes.artwork?.url, 400) as string}
                                                    alt={selectedPlaylist.attributes.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-neutral-600">
                                                    <Music className="w-12 h-12" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0 pt-2">
                                            <h2 className="text-xl md:text-2xl font-bold text-white leading-tight line-clamp-2">
                                                {selectedPlaylist.attributes.name}
                                            </h2>
                                            <p className="text-neutral-400 text-sm mt-1 line-clamp-2">
                                                {selectedPlaylist.attributes.description?.standard || 'No description'}
                                            </p>
                                            <div className="mt-3 inline-flex px-2 py-1 bg-white/5 rounded text-xs text-neutral-400 font-mono">
                                                {loadingPlaylistTracks ? 'Loading...' : `${playlistTracks.length} Songs`}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Tracks List (Scrollable Area) */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                                    {loadingPlaylistTracks ? (
                                        <div className="flex flex-col items-center justify-center py-20 text-neutral-500 gap-3">
                                            <Loader2 className="w-8 h-8 animate-spin text-red-500" />
                                            <span className="text-sm font-medium">Loading tracks...</span>
                                        </div>
                                    ) : playlistTracks.length > 0 ? (
                                        <div className="space-y-1">
                                            {playlistTracks.map((track, index) => (
                                                <div key={track.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group">
                                                    <span className="text-xs text-neutral-600 font-mono w-6 text-center group-hover:text-neutral-400 flex-shrink-0">
                                                        {index + 1}
                                                    </span>
                                                    <div className="w-10 h-10 rounded bg-neutral-800 overflow-hidden flex-shrink-0 relative">
                                                        {getArtworkUrl(track.attributes.artwork?.url, 100) ? (
                                                            /* eslint-disable-next-line @next/next/no-img-element */
                                                            <img src={getArtworkUrl(track.attributes.artwork?.url, 100) as string} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Music className="w-4 h-4 text-neutral-600 m-auto mt-3" />
                                                        )}
                                                        {/* Play Overlay */}
                                                        <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center">
                                                            <PlayCircle className="w-5 h-5 text-white" />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-medium text-sm text-white truncate group-hover:text-red-400 transition-colors">
                                                            {track.attributes.name}
                                                        </h4>
                                                        <p className="text-xs text-neutral-400 truncate">
                                                            {track.attributes.artistName}
                                                        </p>
                                                    </div>
                                                    <span className="text-xs text-neutral-600 font-mono pr-2">
                                                        {formatDuration(track.attributes.durationInMillis)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-20 text-neutral-500 text-sm">
                                            No tracks found.
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>

    );
}
