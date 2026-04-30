import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MB_BASE, USER_AGENT } from '@/lib/musicbrainz';
import { searchSpotifyImages } from '@/lib/spotify/search';

/**
 * GET /api/universal-search?q=<query>
 *
 * Unified search endpoint. Returns results in 4 categories:
 *   users, artists, albums, songs
 *
 * Priority: Supabase first, then MusicBrainz for artists/albums/songs.
 * NO database inserts happen here — results from MusicBrainz are returned
 * with source:'musicbrainz' so the frontend can insert on click via
 * POST /api/universal-search/insert.
 *
 * Performance: All Supabase queries, MusicBrainz queries, and Spotify image
 * fetches run in parallel. Results are cached for 30s.
 */

interface SearchResult {
    type: 'user' | 'artist' | 'album' | 'song';
    id: string;
    name: string;
    imageUrl: string | null;
    subtitle: string | null;
    source: 'supabase' | 'musicbrainz';
    musicbrainzId?: string;       // MB ID for items from MusicBrainz
    artistMbId?: string | null;   // artist MB ID for albums/songs from MB
}

// ─── In-memory search cache (30s TTL) ───────────────────────────────────────

interface CacheEntry {
    data: any;
    timestamp: number;
}

const CACHE_TTL_MS = 30_000; // 30 seconds
const searchCache = new Map<string, CacheEntry>();

function getCached(key: string): any | null {
    const entry = searchCache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
        searchCache.delete(key);
        return null;
    }
    return entry.data;
}

function setCache(key: string, data: any): void {
    searchCache.set(key, { data, timestamp: Date.now() });

    // Async cleanup: evict stale entries if cache grows large
    if (searchCache.size > 200) {
        const now = Date.now();
        for (const [k, v] of searchCache) {
            if (now - v.timestamp > CACHE_TTL_MS) searchCache.delete(k);
        }
    }
}

// ─── MusicBrainz fetch (no rate-limit delay for parallel search) ────────────

async function mbFetchDirect(url: string): Promise<Response> {
    return fetch(url, {
        headers: {
            'User-Agent': USER_AGENT,
            Accept: 'application/json',
        },
    });
}

// ─── Reduced limits for faster responses ────────────────────────────────────

const SUPABASE_LIMIT = 5;
const MB_LIMIT = 5;

export async function GET(request: NextRequest) {
    try {
        const query = request.nextUrl.searchParams.get('q');

        if (!query || query.trim() === '') {
            return NextResponse.json(
                { error: 'Query parameter "q" is required' },
                { status: 400 }
            );
        }

        const q = query.trim();
        const cacheKey = q.toLowerCase();

        // Check cache first
        const cached = getCached(cacheKey);
        if (cached) {
            return NextResponse.json(cached);
        }

        const supabaseClient = await createClient();

        // ─── Phase 1: Fire ALL queries in parallel ──────────────────────

        const [
            usersResult,
            sbArtistsResult,
            sbAlbumsResult,
            sbSongsResult,
            mbArtistsResult,
            mbAlbumsResult,
            mbSongsResult,
            spotifyResult,
        ] = await Promise.allSettled([
            // Supabase queries
            supabaseClient
                .from('users')
                .select('id, name, username, profile_picture_url')
                .or(`username.ilike.%${q}%,name.ilike.%${q}%`)
                .limit(SUPABASE_LIMIT),

            supabaseClient
                .from('artists')
                .select('id, name, musicbrainz_id')
                .ilike('name', `%${q}%`)
                .limit(SUPABASE_LIMIT),

            supabaseClient
                .from('albums')
                .select('id, name, musicbrainz_id, artist_id, artists!artist_id(name)')
                .ilike('name', `%${q}%`)
                .limit(SUPABASE_LIMIT),

            supabaseClient
                .from('songs')
                .select('id, name, musicbrainz_id, artist_id, artists!artist_id(name)')
                .ilike('name', `%${q}%`)
                .limit(SUPABASE_LIMIT),

            // MusicBrainz queries (all fire in parallel — no serial rate limiting)
            searchMBArtists(q, MB_LIMIT),
            searchMBAlbums(q, MB_LIMIT),
            searchMBSongs(q, MB_LIMIT),

            // Spotify images (fires in parallel with everything else)
            searchSpotifyImages(q),
        ]);

        // ─── Phase 2: Extract Supabase results ──────────────────────────

        const usersData = usersResult.status === 'fulfilled' ? usersResult.value.data : [];
        const sbArtists = sbArtistsResult.status === 'fulfilled' ? sbArtistsResult.value.data : [];
        const sbAlbums = sbAlbumsResult.status === 'fulfilled' ? sbAlbumsResult.value.data : [];
        const sbSongs = sbSongsResult.status === 'fulfilled' ? sbSongsResult.value.data : [];

        // ─── Users ──────────────────────────────────────────────────────

        const users: SearchResult[] = (usersData || []).map((u: any) => ({
            type: 'user' as const,
            id: u.id,
            name: u.name || u.username,
            imageUrl: u.profile_picture_url || null,
            subtitle: `@${u.username}`,
            source: 'supabase' as const,
        }));

        // ─── Artists ────────────────────────────────────────────────────

        let artists: SearchResult[] = (sbArtists || []).map((a: any) => ({
            type: 'artist' as const,
            id: String(a.id),
            name: a.name || 'Unknown Artist',
            imageUrl: null,
            subtitle: null,
            source: 'supabase' as const,
        }));

        if (artists.length < 5) {
            const mbArtists = mbArtistsResult.status === 'fulfilled' ? mbArtistsResult.value : [];
            const existingMBIds = new Set((sbArtists || []).map((a: any) => a.musicbrainz_id));

            for (const mbArtist of mbArtists) {
                if (existingMBIds.has(mbArtist.id)) continue;
                if (artists.length >= SUPABASE_LIMIT) break;
                if (['[unknown]', 'various artists', '[no artist]'].includes(mbArtist.name.toLowerCase())) continue;

                artists.push({
                    type: 'artist',
                    id: `mb:${mbArtist.id}`,
                    name: mbArtist.name,
                    imageUrl: null,
                    subtitle: null,
                    source: 'musicbrainz',
                    musicbrainzId: mbArtist.id,
                });
                existingMBIds.add(mbArtist.id);
            }
        }

        // ─── Albums ─────────────────────────────────────────────────────

        let albums: SearchResult[] = (sbAlbums || []).map((a: any) => ({
            type: 'album' as const,
            id: String(a.id),
            name: a.name || 'Unknown Album',
            imageUrl: null,
            subtitle: (a.artists as any)?.name || null,
            source: 'supabase' as const,
        }));

        if (albums.length < 5) {
            const mbAlbums = mbAlbumsResult.status === 'fulfilled' ? mbAlbumsResult.value : [];
            const existingMBIds = new Set((sbAlbums || []).map((a: any) => a.musicbrainz_id));

            for (const mbAlbum of mbAlbums) {
                if (existingMBIds.has(mbAlbum.id)) continue;
                if (albums.length >= SUPABASE_LIMIT) break;

                albums.push({
                    type: 'album',
                    id: `mb:${mbAlbum.id}`,
                    name: mbAlbum.title,
                    imageUrl: null,
                    subtitle: mbAlbum.artist || null,
                    source: 'musicbrainz',
                    musicbrainzId: mbAlbum.id,
                    artistMbId: mbAlbum.artistMbId,
                });
                existingMBIds.add(mbAlbum.id);
            }
        }

        // ─── Songs ──────────────────────────────────────────────────────

        let songs: SearchResult[] = (sbSongs || []).map((s: any) => ({
            type: 'song' as const,
            id: String(s.id),
            name: s.name || 'Unknown Song',
            imageUrl: null,
            subtitle: (s.artists as any)?.name || null,
            source: 'supabase' as const,
        }));

        if (songs.length < 5) {
            const mbSongs = mbSongsResult.status === 'fulfilled' ? mbSongsResult.value : [];
            const existingMBIds = new Set((sbSongs || []).map((s: any) => s.musicbrainz_id));

            for (const mbSong of mbSongs) {
                if (existingMBIds.has(mbSong.id)) continue;
                if (songs.length >= SUPABASE_LIMIT) break;

                songs.push({
                    type: 'song',
                    id: `mb:${mbSong.id}`,
                    name: mbSong.title,
                    imageUrl: null,
                    subtitle: mbSong.artist || null,
                    source: 'musicbrainz',
                    musicbrainzId: mbSong.id,
                    artistMbId: mbSong.artistMbId,
                });
                existingMBIds.add(mbSong.id);
            }
        }

        // ─── Spotify images (already fetched in parallel) ───────────────

        const spotifyData = spotifyResult.status === 'fulfilled' ? spotifyResult.value : null;

        if (spotifyData) {
            artists = artists.map((a) => {
                const spArtist = spotifyData.artists?.items?.find((x: any) => x.name.toLowerCase() === a.name.toLowerCase());
                if (spArtist?.images?.[0]?.url) a.imageUrl = spArtist.images[0].url;
                return a;
            });
            albums = albums.map((a) => {
                const spAlbum = spotifyData.albums?.items?.find((x: any) => x.name.toLowerCase() === a.name.toLowerCase());
                if (spAlbum?.images?.[0]?.url) a.imageUrl = spAlbum.images[0].url;
                return a;
            });
            songs = songs.map((s) => {
                const spSong = spotifyData.tracks?.items?.find((x: any) => x.name.toLowerCase() === s.name.toLowerCase());
                if (spSong?.album?.images?.[0]?.url) s.imageUrl = spSong.album.images[0].url;
                return s;
            });
        }

        const responseData = {
            query: q,
            users,
            artists,
            albums,
            songs,
        };

        // Cache the result asynchronously (non-blocking)
        setCache(cacheKey, responseData);

        return NextResponse.json(responseData);
    } catch (error: any) {
        console.error('Unified search error:', error);
        return NextResponse.json(
            { error: error.message || 'Search failed' },
            { status: 500 }
        );
    }
}

// ─── MusicBrainz helpers (no serial rate-limit delays) ──────────────────────

async function searchMBArtists(query: string, limit: number) {
    try {
        const url = `${MB_BASE}/artist?query=${encodeURIComponent(query)}*&fmt=json&limit=${limit}`;
        const res = await mbFetchDirect(url);
        if (!res.ok) return [];
        const data = await res.json();
        return (data.artists || []).map((a: any) => ({
            id: a.id,
            name: a.name,
        }));
    } catch {
        return [];
    }
}

async function searchMBAlbums(query: string, limit: number) {
    try {
        const url = `${MB_BASE}/release-group?query=${encodeURIComponent(query)}&fmt=json&limit=${limit}`;
        const res = await mbFetchDirect(url);
        if (!res.ok) return [];
        const data = await res.json();
        return (data['release-groups'] || []).map((rg: any) => ({
            id: rg.id,
            title: rg.title,
            artist: rg['artist-credit']?.map((ac: any) => ac.name).join(', ') || null,
            artistMbId: rg['artist-credit']?.[0]?.artist?.id || null,
            type: rg['primary-type'],
        }));
    } catch {
        return [];
    }
}

async function searchMBSongs(query: string, limit: number) {
    try {
        const url = `${MB_BASE}/recording?query=${encodeURIComponent(query)}&fmt=json&limit=${limit}`;
        const res = await mbFetchDirect(url);
        if (!res.ok) return [];
        const data = await res.json();
        return (data.recordings || []).map((rec: any) => ({
            id: rec.id,
            title: rec.title,
            artist: rec['artist-credit']?.map((ac: any) => ac.name).join(', ') || null,
            artistMbId: rec['artist-credit']?.[0]?.artist?.id || null,
        }));
    } catch {
        return [];
    }
}
