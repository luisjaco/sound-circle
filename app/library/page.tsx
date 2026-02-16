'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useMusicKit } from '@/components/providers/MusicKitProvider';
import AppleMusicAuthBtn from '@/components/AppleMusicAuthBtn';
import {
    ListMusic, Loader2, PlayCircle, Music, Clock, X,
    Plus, CheckCircle2, XCircle, ExternalLink, PlusCircle, Trash2,
    ArrowLeft
} from 'lucide-react';

// ---------- Types ----------

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

interface ResolvedTrack {
    appleMusicId: string;
    name: string;
    artistName: string;
    musicBrainzId: string | null;
    musicBrainzTitle: string | null;
    musicBrainzArtist: string | null;
    status: 'resolving' | 'matched' | 'not_found' | 'error';
    artworkUrl?: string | null;
    error?: string;
}

type ViewMode = 'home' | 'playlists' | 'recent' | 'playlist-detail';

// ---------- localStorage ----------

const STORAGE_KEY = 'soundcircle_added_songs';

function loadAddedSongs(): ResolvedTrack[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

function saveAddedSongs(songs: ResolvedTrack[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(songs));
}

// ---------- Component ----------

export default function AppleMusicLibraryPage() {
    const { musicKit, isAuthorized, initializationError } = useMusicKit();

    const [view, setView] = useState<ViewMode>('home');
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [recentTracks, setRecentTracks] = useState<Track[]>([]);
    const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
    const [playlistTracks, setPlaylistTracks] = useState<Track[]>([]);

    const [error, setError] = useState<string | null>(null);
    const [loadingPlaylists, setLoadingPlaylists] = useState(false);
    const [loadingRecent, setLoadingRecent] = useState(false);
    const [loadingPlaylistTracks, setLoadingPlaylistTracks] = useState(false);

    const [addedSongs, setAddedSongs] = useState<ResolvedTrack[]>([]);
    const [resolvingIds, setResolvingIds] = useState<Set<string>>(new Set());
    const [batchResolving, setBatchResolving] = useState(false);
    const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });

    useEffect(() => { setAddedSongs(loadAddedSongs()); }, []);
    useEffect(() => { if (addedSongs.length > 0) saveAddedSongs(addedSongs); }, [addedSongs]);

    const isTrackAdded = useCallback((id: string) => addedSongs.some(s => s.appleMusicId === id), [addedSongs]);
    const isTrackResolving = useCallback((id: string) => resolvingIds.has(id), [resolvingIds]);

    // ---------- Helpers ----------

    const getArtworkUrl = (url?: string, size = 120) => {
        if (!url) return null;
        return url.replace('{w}', size.toString()).replace('{h}', size.toString());
    };

    const formatDuration = (ms?: number) => {
        if (!ms) return '-:--';
        const m = Math.floor(ms / 60000);
        const s = ((ms % 60000) / 1000).toFixed(0);
        return `${m}:${Number(s) < 10 ? '0' : ''}${s}`;
    };

    // ---------- Navigation ----------

    const goHome = () => { setView('home'); setSelectedPlaylist(null); setPlaylistTracks([]); };

    const goToPlaylists = async () => {
        setView('playlists');
        await fetchLibrary();
    };

    const goToRecent = async () => {
        setView('recent');
        await fetchRecentTracks();
    };

    const goToPlaylistDetail = (pl: Playlist) => {
        setSelectedPlaylist(pl);
        setView('playlist-detail');
        fetchPlaylistTracks(pl);
    };

    // ---------- Fetchers ----------

    const fetchLibrary = async () => {
        if (!musicKit || !isAuthorized) return;
        setLoadingPlaylists(true); setError(null); setPlaylists([]);
        try {
            let res;
            if (musicKit.api?.library) res = await musicKit.api.library.playlists({ limit: 20 });
            else if (musicKit.api?.music) res = await musicKit.api.music('v1/me/library/playlists', { limit: 20 });
            else throw new Error('MusicKit API unavailable');
            let items: any[] = [];
            if (Array.isArray(res)) items = res;
            else if (res.data?.data) items = res.data.data;
            else if (res.data) items = res.data;
            setPlaylists(items);
        } catch (e: any) { setError(e.message); }
        finally { setLoadingPlaylists(false); }
    };

    const fetchRecentTracks = async () => {
        if (!musicKit || !isAuthorized) return;
        setLoadingRecent(true); setError(null); setRecentTracks([]);
        try {
            let res;
            if (musicKit.api?.music) res = await musicKit.api.music('v1/me/recent/played/tracks', { limit: 10 });
            else throw new Error('MusicKit API unavailable');
            let items: any[] = [];
            if (Array.isArray(res)) items = res;
            else if (res.data?.data) items = res.data.data;
            else if (res.data) items = res.data;
            setRecentTracks(items);
        } catch (e: any) { setError(e.message); }
        finally { setLoadingRecent(false); }
    };

    const fetchPlaylistTracks = async (pl: Playlist) => {
        if (!musicKit || !isAuthorized) return;
        setLoadingPlaylistTracks(true); setPlaylistTracks([]); setError(null);
        try {
            let res;
            if (musicKit.api?.music) res = await musicKit.api.music(`v1/me/library/playlists/${pl.id}/tracks`, { limit: 100 });
            else throw new Error('MusicKit API unavailable');
            let items: any[] = [];
            if (Array.isArray(res)) items = res;
            else if (res.data?.data) items = res.data.data;
            else if (res.data) items = res.data;
            setPlaylistTracks(items);
        } catch (e: any) { setError(e.message); }
        finally { setLoadingPlaylistTracks(false); }
    };

    // ---------- MusicBrainz ----------

    const resolveAndAddTrack = async (track: Track) => {
        if (isTrackAdded(track.id) || isTrackResolving(track.id)) return;
        const artworkUrl = getArtworkUrl(track.attributes.artwork?.url, 120);
        const placeholder: ResolvedTrack = {
            appleMusicId: track.id, name: track.attributes.name, artistName: track.attributes.artistName,
            musicBrainzId: null, musicBrainzTitle: null, musicBrainzArtist: null, status: 'resolving', artworkUrl,
        };
        setAddedSongs(prev => [...prev, placeholder]);
        setResolvingIds(prev => new Set(prev).add(track.id));
        try {
            let isrc: string | undefined;
            try {
                const tok = musicKit?.musicUserToken;
                if (tok) {
                    const r = await fetch('/api/apple/catalog', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ trackIds: [track.id], userMusicToken: tok }) });
                    if (r.ok) { const d = await r.json(); isrc = d.tracks?.[0]?.isrc || undefined; }
                }
            } catch { /* continue */ }
            const mbRes = await fetch('/api/musicbrainz/lookup', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tracks: [{ appleMusicId: track.id, name: track.attributes.name, artistName: track.attributes.artistName, isrc }] }),
            });
            if (!mbRes.ok) throw new Error('MusicBrainz lookup failed');
            const result = (await mbRes.json()).results?.[0];
            if (result) setAddedSongs(prev => prev.map(s => s.appleMusicId === track.id ? { ...s, ...result, artworkUrl } : s));
        } catch (err: any) {
            setAddedSongs(prev => prev.map(s => s.appleMusicId === track.id ? { ...s, status: 'error' as const, error: err.message } : s));
        } finally {
            setResolvingIds(prev => { const n = new Set(prev); n.delete(track.id); return n; });
        }
    };

    const resolveAndAddBatch = async (tracks: Track[]) => {
        const fresh = tracks.filter(t => !isTrackAdded(t.id) && !isTrackResolving(t.id));
        if (!fresh.length) return;
        setBatchResolving(true); setBatchProgress({ current: 0, total: fresh.length });
        for (let i = 0; i < fresh.length; i++) { await resolveAndAddTrack(fresh[i]); setBatchProgress({ current: i + 1, total: fresh.length }); }
        setBatchResolving(false);
    };

    const removeAddedSong = (id: string) => { setAddedSongs(prev => { const n = prev.filter(s => s.appleMusicId !== id); saveAddedSongs(n); return n; }); };
    const clearAllSongs = () => { setAddedSongs([]); localStorage.removeItem(STORAGE_KEY); };

    // ---------- Shared UI Pieces ----------

    const StatusBadge = ({ track }: { track: ResolvedTrack }) => {
        if (track.status === 'resolving') return <span className="inline-flex items-center gap-1 text-xs text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full"><Loader2 className="w-3 h-3 animate-spin" /> Resolving</span>;
        if (track.status === 'matched') return <a href={`https://musicbrainz.org/recording/${track.musicBrainzId}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full hover:bg-green-400/20 transition-colors" onClick={e => e.stopPropagation()}><CheckCircle2 className="w-3 h-3" /> Matched <ExternalLink className="w-2.5 h-2.5" /></a>;
        if (track.status === 'not_found') return <span className="inline-flex items-center gap-1 text-xs text-neutral-400 bg-neutral-400/10 px-2 py-0.5 rounded-full"><XCircle className="w-3 h-3" /> Not Found</span>;
        return <span className="inline-flex items-center gap-1 text-xs text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full"><XCircle className="w-3 h-3" /> Error</span>;
    };

    const AddBtn = ({ track }: { track: Track }) => {
        if (isTrackAdded(track.id)) { const r = addedSongs.find(s => s.appleMusicId === track.id); return r ? <StatusBadge track={r} /> : <CheckCircle2 className="w-4 h-4 text-green-400" />; }
        if (isTrackResolving(track.id)) return <Loader2 className="w-4 h-4 animate-spin text-yellow-400" />;
        return (
            <button onClick={e => { e.stopPropagation(); resolveAndAddTrack(track); }} className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all hover:scale-105 active:scale-95" title="Add to SoundCircle">
                <Plus className="w-3.5 h-3.5" />
            </button>
        );
    };

    const TrackRow = ({ track, index }: { track: Track; index: number }) => (
        <div className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0">
            <span className="text-xs text-neutral-600 font-mono w-6 text-right flex-shrink-0">{index + 1}</span>
            <div className="w-10 h-10 rounded bg-neutral-800 overflow-hidden flex-shrink-0">
                {getArtworkUrl(track.attributes.artwork?.url, 80) ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={getArtworkUrl(track.attributes.artwork?.url, 80)!} alt="" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center"><Music className="w-4 h-4 text-neutral-600" /></div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{track.attributes.name}</p>
                <p className="text-xs text-neutral-400 truncate">{track.attributes.artistName}</p>
            </div>
            <span className="text-xs text-neutral-500 font-mono flex-shrink-0">{formatDuration(track.attributes.durationInMillis)}</span>
            <div className="flex-shrink-0"><AddBtn track={track} /></div>
        </div>
    );

    const ProgressBar = () => batchResolving ? (
        <div className="flex items-center gap-3 p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20 mb-4">
            <Loader2 className="w-4 h-4 animate-spin text-yellow-400 flex-shrink-0" />
            <span className="text-yellow-300 text-xs font-medium whitespace-nowrap">{batchProgress.current}/{batchProgress.total}</span>
            <div className="flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full transition-all duration-300" style={{ width: `${batchProgress.total > 0 ? (batchProgress.current / batchProgress.total) * 100 : 0}%` }} />
            </div>
        </div>
    ) : null;

    // ---------- Added Songs Grid (always visible) ----------

    const AddedSongsGrid = () => {
        if (addedSongs.length === 0) return null;
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
                        <PlusCircle className="w-5 h-5 text-green-500" />
                        Added Songs
                        <span className="text-xs font-normal text-neutral-500 ml-1">
                            {addedSongs.filter(s => s.status === 'matched').length}/{addedSongs.length}
                        </span>
                    </h2>
                    <button onClick={clearAllSongs} className="text-xs text-neutral-500 hover:text-red-400 flex items-center gap-1 transition-colors">
                        <Trash2 className="w-3 h-3" /> Clear
                    </button>
                </div>
                <div className="bg-neutral-900/50 rounded-2xl border border-white/5 overflow-hidden">
                    {addedSongs.map(t => (
                        <div key={t.appleMusicId} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0 group">
                            <div className="w-10 h-10 rounded bg-neutral-800 overflow-hidden flex-shrink-0">
                                {t.artworkUrl ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img src={t.artworkUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center"><Music className="w-4 h-4 text-neutral-600" /></div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{t.name}</p>
                                <p className="text-xs text-neutral-400 truncate">{t.artistName}</p>
                            </div>
                            <StatusBadge track={t} />
                            <button onClick={() => removeAddedSong(t.appleMusicId)} className="p-1 text-neutral-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100" title="Remove">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // ==================== VIEW RENDERS ====================

    // ----- HOME -----
    if (view === 'home') {
        return (
            <div className="min-h-screen bg-black text-white pb-20">
                <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">

                    {/* Header */}
                    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-pink-500">Apple Music</h1>
                            <p className="text-neutral-400 text-sm mt-1">Your Music Library</p>
                        </div>
                        <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-full border border-white/5">
                            {initializationError ? (
                                <><div className="w-2.5 h-2.5 rounded-full bg-red-500" /><span className="text-xs text-red-400">Error</span></>
                            ) : !musicKit ? (
                                <><Loader2 className="w-3 h-3 animate-spin text-yellow-500" /><span className="text-xs text-neutral-300">Initializing</span></>
                            ) : (
                                <><div className={`w-2.5 h-2.5 rounded-full ${isAuthorized ? 'bg-green-500' : 'bg-red-500'}`} /><span className="text-xs text-neutral-300">{isAuthorized ? 'Connected' : 'Disconnected'}</span></>
                            )}
                        </div>
                    </header>

                    {/* Buttons */}
                    <div className="flex flex-wrap items-center gap-3">
                        <AppleMusicAuthBtn />
                        {isAuthorized && (
                            <>
                                <button onClick={goToPlaylists} disabled={loadingPlaylists} className="flex items-center gap-2 px-5 py-2.5 rounded-full font-medium bg-neutral-800 text-white hover:bg-neutral-700 transition-all disabled:opacity-50 text-sm">
                                    {loadingPlaylists ? <Loader2 className="w-4 h-4 animate-spin" /> : <ListMusic className="w-4 h-4" />} My Playlists
                                </button>
                                <button onClick={goToRecent} disabled={loadingRecent} className="flex items-center gap-2 px-5 py-2.5 rounded-full font-medium bg-neutral-800 text-white hover:bg-neutral-700 transition-all disabled:opacity-50 text-sm">
                                    {loadingRecent ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />} Recent Songs
                                </button>
                            </>
                        )}
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 text-red-400 rounded-lg border border-red-500/20 text-sm flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" /> {error}
                        </div>
                    )}

                    {/* Added Songs */}
                    <AddedSongsGrid />

                    {/* Empty state */}
                    {isAuthorized && addedSongs.length === 0 && !error && (
                        <div className="text-center py-16 text-neutral-500 text-sm">
                            Click &quot;My Playlists&quot; or &quot;Recent Songs&quot; to get started.
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ----- PLAYLISTS -----
    if (view === 'playlists') {
        return (
            <div className="min-h-screen bg-black text-white pb-20">
                <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">

                    {/* Top bar */}
                    <div className="flex items-center justify-between">
                        <button onClick={goHome} className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors">
                            <ArrowLeft className="w-4 h-4" /> Back
                        </button>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <ListMusic className="w-5 h-5 text-red-500" /> My Playlists
                        </h2>
                        <div className="w-16" />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 text-red-400 rounded-lg border border-red-500/20 text-sm">{error}</div>
                    )}

                    {/* Grid */}
                    {loadingPlaylists ? (
                        <div className="flex flex-col items-center py-20 gap-3">
                            <Loader2 className="w-7 h-7 animate-spin text-red-500" />
                            <span className="text-sm text-neutral-500">Loading playlists...</span>
                        </div>
                    ) : playlists.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {playlists.map(pl => {
                                const a = pl.attributes || ({} as any);
                                const art = getArtworkUrl(a.artwork?.url, 300);
                                return (
                                    <div key={pl.id} onClick={() => goToPlaylistDetail(pl)} className="group bg-neutral-900/60 rounded-xl overflow-hidden cursor-pointer hover:bg-neutral-800 transition-all border border-white/5 hover:border-white/10">
                                        <div className="w-full aspect-square bg-neutral-800 overflow-hidden">
                                            {art ? (
                                                /* eslint-disable-next-line @next/next/no-img-element */
                                                <img src={art} alt={a.name || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-neutral-600"><Music className="w-10 h-10" /></div>
                                            )}
                                        </div>
                                        <div className="p-3">
                                            <p className="text-sm font-semibold text-white truncate group-hover:text-red-400 transition-colors">{a.name || 'Untitled'}</p>
                                            <p className="text-xs text-neutral-500 truncate mt-0.5">{a.description?.standard || 'Playlist'}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-20 text-neutral-500 text-sm">No playlists found.</div>
                    )}
                </div>
            </div>
        );
    }

    // ----- RECENT SONGS -----
    if (view === 'recent') {
        return (
            <div className="min-h-screen bg-black text-white pb-20">
                <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">

                    {/* Top bar */}
                    <div className="flex items-center justify-between">
                        <button onClick={goHome} className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors">
                            <ArrowLeft className="w-4 h-4" /> Back
                        </button>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <Clock className="w-5 h-5 text-pink-500" /> Recently Played
                        </h2>
                        <button onClick={() => resolveAndAddBatch(recentTracks)} disabled={batchResolving || recentTracks.length === 0} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-red-500 to-pink-500 text-white disabled:opacity-50">
                            <PlusCircle className="w-3.5 h-3.5" /> Add All
                        </button>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 text-red-400 rounded-lg border border-red-500/20 text-sm">{error}</div>
                    )}

                    <ProgressBar />

                    {/* Track list */}
                    {loadingRecent ? (
                        <div className="flex flex-col items-center py-20 gap-3">
                            <Loader2 className="w-7 h-7 animate-spin text-pink-500" />
                            <span className="text-sm text-neutral-500">Fetching recent songs...</span>
                        </div>
                    ) : recentTracks.length > 0 ? (
                        <div className="bg-neutral-900/50 rounded-2xl border border-white/5 overflow-hidden">
                            {recentTracks.map((t, i) => <TrackRow key={t.id} track={t} index={i} />)}
                        </div>
                    ) : (
                        <div className="text-center py-20 text-neutral-500 text-sm">No recent songs found.</div>
                    )}

                    {/* Also show added songs below */}
                    <AddedSongsGrid />
                </div>
            </div>
        );
    }

    // ----- PLAYLIST DETAIL -----
    if (view === 'playlist-detail' && selectedPlaylist) {
        const art = getArtworkUrl(selectedPlaylist.attributes.artwork?.url, 300);
        return (
            <div className="min-h-screen bg-black text-white pb-20">
                <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">

                    {/* Top bar */}
                    <div className="flex items-center justify-between">
                        <button onClick={() => { setView('playlists'); setSelectedPlaylist(null); }} className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors">
                            <ArrowLeft className="w-4 h-4" /> Playlists
                        </button>
                        <button onClick={() => resolveAndAddBatch(playlistTracks)} disabled={batchResolving || loadingPlaylistTracks || playlistTracks.length === 0} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-red-500 to-pink-500 text-white disabled:opacity-50">
                            <PlusCircle className="w-3.5 h-3.5" /> Add All
                        </button>
                    </div>

                    {/* Playlist info */}
                    <div className="flex gap-5 items-center">
                        <div className="w-24 h-24 md:w-28 md:h-28 rounded-xl bg-neutral-800 overflow-hidden flex-shrink-0">
                            {art ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img src={art} alt={selectedPlaylist.attributes.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-neutral-600"><Music className="w-8 h-8" /></div>
                            )}
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-xl font-bold text-white leading-tight line-clamp-2">{selectedPlaylist.attributes.name}</h2>
                            <p className="text-neutral-400 text-sm mt-1 line-clamp-1">{selectedPlaylist.attributes.description?.standard || 'No description'}</p>
                            <p className="text-xs text-neutral-500 font-mono mt-2">{loadingPlaylistTracks ? 'Loading...' : `${playlistTracks.length} songs`}</p>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 text-red-400 rounded-lg border border-red-500/20 text-sm">{error}</div>
                    )}

                    <ProgressBar />

                    {/* Tracks */}
                    {loadingPlaylistTracks ? (
                        <div className="flex flex-col items-center py-20 gap-3">
                            <Loader2 className="w-7 h-7 animate-spin text-red-500" />
                            <span className="text-sm text-neutral-500">Loading tracks...</span>
                        </div>
                    ) : playlistTracks.length > 0 ? (
                        <div className="bg-neutral-900/50 rounded-2xl border border-white/5 overflow-hidden">
                            {playlistTracks.map((t, i) => <TrackRow key={t.id} track={t} index={i} />)}
                        </div>
                    ) : (
                        <div className="text-center py-20 text-neutral-500 text-sm">No tracks found.</div>
                    )}

                    {/* Also show added songs below */}
                    <AddedSongsGrid />
                </div>
            </div>
        );
    }

    // Fallback
    return null;
}
