/**
 * MusicBrainz API Helper Library
 *
 * Provides rate-limited lookups against the MusicBrainz API:
 * - ISRC-based recording lookup (primary strategy)
 * - Text search fallback by track name + artist name
 *
 * Rate limit: max 1 request per second (MusicBrainz policy).
 */

const MB_BASE = 'https://musicbrainz.org/ws/2';
const USER_AGENT = 'SoundCircle/1.0.0 (https://github.com/luisjaco/sound-circle)';

// ---------- Rate Limiter ----------

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

// ---------- Types ----------

export interface MBRecording {
    id: string; // MBID
    title: string;
    artistCredit: string;
    firstReleaseDate?: string;
    length?: number; // ms
}

export interface TrackInput {
    appleMusicId: string;
    name: string;
    artistName: string;
    isrc?: string;
    albumName?: string;
    durationInMillis?: number;
    artworkUrl?: string;
}

export type ResolveStatus = 'matched' | 'not_found' | 'error';

export interface TrackResult {
    appleMusicId: string;
    name: string;
    artistName: string;
    musicBrainzId: string | null;
    musicBrainzTitle: string | null;
    musicBrainzArtist: string | null;
    status: ResolveStatus;
    error?: string;
}

// ---------- ISRC Lookup ----------

export async function lookupByISRC(isrc: string): Promise<MBRecording | null> {
    try {
        const res = await rateLimitedFetch(`${MB_BASE}/isrc/${encodeURIComponent(isrc)}?inc=artist-credits&fmt=json`);

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
            firstReleaseDate: rec['first-release-date'],
            length: rec.length,
        };
    } catch (err) {
        console.error(`ISRC lookup error for ${isrc}:`, err);
        return null;
    }
}

// ---------- Text Search Fallback ----------

export async function searchRecording(
    trackName: string,
    artistName: string
): Promise<MBRecording | null> {
    try {
        // Build Lucene query: recording:"track name" AND artist:"artist name"
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
        // Only accept if score is reasonably high
        if (rec.score !== undefined && rec.score < 80) return null;

        return {
            id: rec.id,
            title: rec.title,
            artistCredit: rec['artist-credit']
                ?.map((ac: any) => ac.name || ac.artist?.name)
                .join(', ') || 'Unknown',
            firstReleaseDate: rec['first-release-date'],
            length: rec.length,
        };
    } catch (err) {
        console.error(`Search error for "${trackName}" by "${artistName}":`, err);
        return null;
    }
}

// ---------- Unified Resolver ----------

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
                appleMusicId: track.appleMusicId,
                name: track.name,
                artistName: track.artistName,
                musicBrainzId: recording.id,
                musicBrainzTitle: recording.title,
                musicBrainzArtist: recording.artistCredit,
                status: 'matched',
            };
        }

        return {
            appleMusicId: track.appleMusicId,
            name: track.name,
            artistName: track.artistName,
            musicBrainzId: null,
            musicBrainzTitle: null,
            musicBrainzArtist: null,
            status: 'not_found',
        };
    } catch (err: any) {
        return {
            appleMusicId: track.appleMusicId,
            name: track.name,
            artistName: track.artistName,
            musicBrainzId: null,
            musicBrainzTitle: null,
            musicBrainzArtist: null,
            status: 'error',
            error: err.message,
        };
    }
}

// ---------- Batch Resolver ----------

export async function resolveTracks(tracks: TrackInput[]): Promise<TrackResult[]> {
    const results: TrackResult[] = [];
    for (const track of tracks) {
        const result = await resolveTrack(track);
        results.push(result);
    }
    return results;
}

// ---------- Helpers ----------

function escapeLucene(str: string): string {
    // Escape Lucene special characters: + - && || ! ( ) { } [ ] ^ " ~ * ? : \ /
    return str.replace(/([+\-&|!(){}[\]^"~*?:\\/])/g, '\\$1');
}
