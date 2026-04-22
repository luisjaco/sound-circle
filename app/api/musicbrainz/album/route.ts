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
function buildAlbumQuery(raw: string): string {
    // support searches that include artist (with / or -)
    const separatorMatch = raw.match(/^(.+?)\s*[\/\-]\s*(.+)$/);
    if (separatorMatch) {
        const title = escapeLucene(separatorMatch[1].trim());
        const artist = escapeLucene(separatorMatch[2].trim());
        return `releasegroup:"${title}" AND artist:"${artist}"`
    }
    return `releasegroup:${escapeLucene(raw.trim())}`;
}

// searches for release groups on musicbrainz and returns a simplified result for the frontend
async function searchAlbum(query: string, limit: number = 5) {
    try {
        if (!query.trim()) return[];

        const luceneQuery = buildAlbumQuery(query);
        const url = `${MB_BASE}/release-group?query=${encodeURIComponent(luceneQuery)}&fmt=json&limit=${limit}`;

        const res = await rateLimitedFetch(url);

        if(!res.ok) {
            throw new Error(`MusicBrainz album search failed: ${res.status}`);
        }

        const data = await res.json();
        const releaseGroups: any[] = data['release-groups'];

        if (!releaseGroups || releaseGroups.length === 0) return [];

        return releaseGroups
            .sort((a: any, b: any) => (b.score ?? 0) - (a.score ?? 0))
            .map((rg) => ({
            id: rg.id,
            name: rg.title,
            artistName: rg['artist-credit']?.map((ac: any) => ac.name || ac.artist?.name).join(', ') || null,
            artistMbId: rg['artist-credit']?.[0]?.artist?.id || null,
            type: rg['primary-type'] || null,
            firstReleaseDate: rg['first-release-date'] || null,
        }));
    } catch (err) {
        console.error(`Album search error for query "${query}"`, err);
        return [];
    }
}

function matchValidLimit(val: string | null, fallback: number): number {
    if (!val) return fallback;
    const parsed = parseInt(val, 10);
    return isNaN(parsed) || parsed < 1 || parsed > 50 ? fallback : parsed;
}

// route handler for album search
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

        const results = await searchAlbum(query.trim(), limit + 5);
        const filtered = results.slice(0, limit);

        return NextResponse.json({ results: filtered });
    } catch (error: any) {
        console.error('Album search route error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}