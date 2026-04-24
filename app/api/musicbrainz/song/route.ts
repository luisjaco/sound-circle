import { NextRequest, NextResponse } from 'next/server';
import { MB_BASE, USER_AGENT, escapeLucene } from '@/lib/musicbrainz';

let lastRequestTime = 0;

// helper for rate-limited fetches to musicbrainz (searches must not exceed 1 per second)
async function rateLimitedFetch(url: string): Promise<Response> {
    const now = Date.now();
    const elapsed = now - lastRequestTime;
    if(elapsed < 1100) {
        await new Promise((r) => setTimeout(r, 1100 - elapsed));
    }
    lastRequestTime = Date.now();
    return fetch(url, {
        headers: {
            'User-Agent': USER_AGENT,
            Accept: 'application/json',
        },
    });
}

// builds a musicbrainz lucene query for album searches
function buildSongQuery(raw: string): string {
    // support searches that include artist (with / or -)
    const separatorMatch = raw.match(/^(.+?)\s*[\/\-]\s*(.+)$/);
    if (separatorMatch) {
        const title = escapeLucene(separatorMatch[1].trim());
        const artist = escapeLucene(separatorMatch[2].trim());
        return `recording:"${title}" AND artist:"${artist}"`
    }
    return `recording:${escapeLucene(raw.trim())}`;
}

// searches for recordings on musicbrainz and returns a simplified result for the frontend
async function searchSong(query: string, limit: number = 5) {
    try {
        if (!query.trim()) return[];

        const luceneQuery = buildSongQuery(query);
        const url = `${MB_BASE}/recording?query=${encodeURIComponent(luceneQuery)}&fmt=json&limit=${limit}`;

        const res = await rateLimitedFetch(url);

        if(!res.ok) {
            throw new Error(`MusicBrainz song search failed: ${res.status}`);
        }

        const data = await res.json();
        const recordings: any[] = data.recordings;

        if (!recordings || recordings.length === 0) return [];

        return recordings
            .sort((a: any, b: any) => (b.score ?? 0) - (a.score ?? 0))
            .map((rec) => ({
            id: rec.id,
            name: rec.title,
            artistName: rec['artist-credit']?.map((ac: any) => ac.name || ac.artist?.name).join(', ') || null,
            artistMbId: rec['artist-credit']?.[0]?.artist?.id || null,
            albumName: rec.releases?.[0]?.title || null,
            albumMbId: rec.releases?.[0]?.id || null,
            duration: rec.length || null,
        }));
    } catch (err) {
        console.error(`Song search error for query "${query}"`, err);
        return [];
    }
}

function matchValidLimit(val: string | null, fallback: number): number {
    if (!val) return fallback;
    const parsed = parseInt(val, 10);
    return isNaN(parsed) || parsed < 1 || parsed > 50 ? fallback : parsed;
}

// route handler for song search
// validate input -> perform search -> trim results
export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const query = url.searchParams.get('q');

        if (!query || !query.trim()) {
            return NextResponse.json({ results: [] });
        }

        const limitMatch = url.searchParams.get('limit');
        const limit = matchValidLimit(limitMatch, 5);

        const results = await searchSong(query.trim(), limit + 5);
        const filtered = results.slice(0, limit);

        return NextResponse.json({ results: filtered });
    } catch (error: any) {
        console.error('Song search route error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}