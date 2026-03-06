/**
 * MusicBrainz API Helper Library
 * Provides rate-limited lookups against the MusicBrainz API:
 * -ISRC-based recording lookup (primary strategy)
 * -Text search fallback by track name + artist name
 * Rate limit: max 1 request per second (MusicBrainz policy).
 */

const MB_BASE = 'https://musicbrainz.org/ws/2';
const USER_AGENT = 'SoundCircle/1.0.0 (https://github.com/luisjaco/sound-circle)';

//Rate Limiter

let lastRequestTime = 0;

async function rateLimitedFetch(url: string): Promise<Response> {
    const now = Date.now();
    const elapsed = now - lastRequestTime;
    if (elapsed < 1100) {
        // wait enough so we never exceed 1 req/sec
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

//Types

export interface MBRecording {
    id: string; // MBID
    title: string;
    artistCredit: string;
    artistId?: string;       // Artist MBID
    releaseId?: string;      // Release/Album MBID
    releaseTitle?: string;   // Release/Album title
    firstReleaseDate?: string;
    length?: number; // ms
}

export interface TrackInput {
    sourceId: string;
    platform: 'apple' | 'spotify';
    name: string;
    artistName: string;
    isrc?: string;
    albumName?: string;
    durationInMillis?: number;
    artworkUrl?: string;
}

export type ResolveStatus = 'matched' | 'not_found' | 'error';

export interface TrackResult {
    sourceId: string;
    platform: 'apple' | 'spotify';
    name: string;
    artistName: string;
    musicBrainzId: string | null;
    musicBrainzTitle: string | null;
    musicBrainzArtist: string | null;
    musicBrainzArtistId: string | null;
    musicBrainzReleaseId: string | null;
    musicBrainzReleaseTitle: string | null;
    status: ResolveStatus;
    error?: string;
}

export interface MBArtist {
    id: string; // MBID
    name: string;
    sortName?: string;
    type?: string;
    country?: string;
}

//ISRC Lookup

export async function lookupByISRC(isrc: string): Promise<MBRecording | null> {
    try {
        // Using /recording search by ISRC is preferred because the /isrc endpoint drops the 'releases' array in its responses
        const res = await rateLimitedFetch(`${MB_BASE}/recording?query=isrc:${encodeURIComponent(isrc)}&fmt=json&limit=1`);

        if (!res.ok) {
            if (res.status === 404) return null;
            throw new Error(`MusicBrainz ISRC lookup failed: ${res.status}`);
        }

        const data = await res.json();
        const recordings: any[] = data.recordings;

        if (!recordings || recordings.length === 0) return null;

        // Take the first recording (best match)
        const rec = recordings[0];
        return {
            id: rec.id,
            title: rec.title,
            artistCredit: rec['artist-credit']
                ?.map((ac: any) => ac.name || ac.artist?.name)
                .join(', ') || 'Unknown',
            artistId: rec['artist-credit']?.[0]?.artist?.id,
            releaseId: rec.releases?.[0]?.id,
            releaseTitle: rec.releases?.[0]?.title,
            firstReleaseDate: rec['first-release-date'],
            length: rec.length,
        };
    } catch (err) {
        console.error(`ISRC lookup error for ${isrc}:`, err);
        return null;
    }
}

//Text Search Fallback

export async function searchRecording(
    trackName: string,
    artistName: string
): Promise<MBRecording | null> {
    try {
        //Build query: recording:"track name" AND artist:"artist name"
        const query = `recording:"${escapeLucene(trackName)}" AND artist:"${escapeLucene(artistName)}"`;
        const url = `${MB_BASE}/recording?query=${encodeURIComponent(query)}&fmt=json&limit=1`;

        const res = await rateLimitedFetch(url);

        if (!res.ok) {
            throw new Error(`MusicBrainz search failed: ${res.status}`);
        }

        const data = await res.json();
        const recordings: any[] = data.recordings;

        if (!recordings || recordings.length === 0) return null;

        const rec = recordings[0];
        //Only accept if score is reasonably high
        if (rec.score !== undefined && rec.score < 80) return null;

        return {
            id: rec.id,
            title: rec.title,
            artistCredit: rec['artist-credit']
                ?.map((ac: any) => ac.name || ac.artist?.name)
                .join(', ') || 'Unknown',
            artistId: rec['artist-credit']?.[0]?.artist?.id,
            releaseId: rec.releases?.[0]?.id,
            releaseTitle: rec.releases?.[0]?.title,
            firstReleaseDate: rec['first-release-date'],
            length: rec.length,
        };
    } catch (err) {
        console.error(`Search error for "${trackName}" by "${artistName}":`, err);
        return null;
    }
}

//Artist Search

export async function searchArtist(query: string, limit: number = 5): Promise<MBArtist[]> {
    try {
        if (!query.trim()) return [];

        const luceneQuery = escapeLucene(query.trim());
        // Using quotes around the query usually gives better strict matches, but wildcard is better for live search.
        // We'll use a combination: standard query string.
        const url = `${MB_BASE}/artist?query=${encodeURIComponent(luceneQuery)}*&fmt=json&limit=${limit}`;

        const res = await rateLimitedFetch(url);

        if (!res.ok) {
            throw new Error(`MusicBrainz artist search failed: ${res.status}`);
        }

        const data = await res.json();
        const artists: any[] = data.artists;

        if (!artists || artists.length === 0) return [];

        return artists.map(a => ({
            id: a.id,
            name: a.name,
            sortName: a['sort-name'],
            type: a.type,
            country: a.country,
        }));
    } catch (err) {
        console.error(`Artist search error for query "${query}":`, err);
        return [];
    }
}

//Unified Resolver

export async function resolveTrack(track: TrackInput): Promise<TrackResult> {
    try {
        let recording: MBRecording | null = null;

        // Strategy 1: ISRC lookup (most accurate)
        if (track.isrc) {
            recording = await lookupByISRC(track.isrc);
        }

        // Strategy 2: Text search fallback
        if (!recording) {
            recording = await searchRecording(track.name, track.artistName);
        }

        if (recording) {
            return {
                sourceId: track.sourceId,
                platform: track.platform,
                name: track.name,
                artistName: track.artistName,
                musicBrainzId: recording.id,
                musicBrainzTitle: recording.title,
                musicBrainzArtist: recording.artistCredit,
                musicBrainzArtistId: recording.artistId || null,
                musicBrainzReleaseId: recording.releaseId || null,
                musicBrainzReleaseTitle: recording.releaseTitle || null,
                status: 'matched',
            };
        }

        return {
            sourceId: track.sourceId,
            platform: track.platform,
            name: track.name,
            artistName: track.artistName,
            musicBrainzId: null,
            musicBrainzTitle: null,
            musicBrainzArtist: null,
            musicBrainzArtistId: null,
            musicBrainzReleaseId: null,
            musicBrainzReleaseTitle: null,
            status: 'not_found',
        };
    } catch (err: any) {
        return {
            sourceId: track.sourceId,
            platform: track.platform,
            name: track.name,
            artistName: track.artistName,
            musicBrainzId: null,
            musicBrainzTitle: null,
            musicBrainzArtist: null,
            musicBrainzArtistId: null,
            musicBrainzReleaseId: null,
            musicBrainzReleaseTitle: null,
            status: 'error',
            error: err.message,
        };
    }
}

//Batch Resolver

export async function resolveTracks(tracks: TrackInput[]): Promise<TrackResult[]> {
    const results: TrackResult[] = [];
    for (const track of tracks) {
        const result = await resolveTrack(track);
        results.push(result);
    }
    return results;
}

//Helpers

function escapeLucene(str: string): string {
    return str.replace(/([+\-&|!(){}[\]^"~*?:\\/])/g, '\\$1');
}
