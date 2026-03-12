import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

/**
 * POST /api/apple/favorites
 *
 * Fetches the authenticated user's favorite artists and/or albums from Apple Music.
 * Uses the Apple Music API endpoint: GET /v1/me/favorites?l=en-US&types=...
 * 
 * Body: { userMusicToken: string, types?: ('artists' | 'albums')[], limit?: number }
 * Response: { artists?: FavoriteArtist[], albums?: FavoriteAlbum[] }
 */

interface ArtworkObj {
    url: string;
    width: number;
    height: number;
    bgColor?: string;
}

interface FavoriteArtist {
    id: string;
    catalogId: string | null;
    name: string;
    artwork: ArtworkObj | null;
    genres: string[];
    url: string | null;
}

interface FavoriteAlbum {
    id: string;
    catalogId: string | null;
    name: string;
    artistName: string;
    artwork: ArtworkObj | null;
    genres: string[];
    url: string | null;
    releaseDate: string | null;
    trackCount: number | null;
}

function generateDeveloperToken(): string {
    const teamId = process.env.APPLE_TEAM_ID;
    const keyId = process.env.APPLE_KEY_ID;
    const privateKeyRaw = process.env.APPLE_PRIVATE_KEY;

    if (!teamId || !keyId || !privateKeyRaw) {
        throw new Error('Missing Apple Music configuration');
    }

    const privateKey = privateKeyRaw.replace(/\\n/g, '\n');
    return jwt.sign({}, privateKey, {
        algorithm: 'ES256',
        expiresIn: '180d',
        issuer: teamId,
        header: { alg: 'ES256', kid: keyId },
    });
}

function parseArtwork(attrs: any): ArtworkObj | null {
    const artworkObj = attrs?.artwork;
    if (!artworkObj) return null;
    return {
        url: artworkObj.url,
        width: artworkObj.width || 300,
        height: artworkObj.height || 300,
        bgColor: artworkObj.bgColor,
    };
}

// Deduplication 

function deduplicateByName<T extends { name: string }>(items: T[]): T[] {
    const seen = new Set<string>();
    return items.filter((item) => {
        const key = item.name.toLowerCase().trim();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

// Artist helpers

function parseArtist(artist: any): FavoriteArtist {
    const attrs = artist.attributes || {};
    const catalogData = artist.relationships?.catalog?.data?.[0];
    const catalogAttrs = catalogData?.attributes || {};
    const finalAttrs = catalogData ? catalogAttrs : attrs;

    return {
        id: artist.id,
        catalogId: catalogData?.id || (artist.type === 'artists' ? artist.id : null),
        name: finalAttrs.name || attrs.name || 'Unknown Artist',
        artwork: parseArtwork(finalAttrs) || parseArtwork(attrs),
        genres: finalAttrs.genreNames || attrs.genreNames || [],
        url: finalAttrs.url || attrs.url || null,
    };
}

// Album helpers 

function parseAlbum(album: any): FavoriteAlbum {
    const attrs = album.attributes || {};
    const catalogData = album.relationships?.catalog?.data?.[0];
    const catalogAttrs = catalogData?.attributes || {};
    const finalAttrs = catalogData ? catalogAttrs : attrs;

    return {
        id: album.id,
        catalogId: catalogData?.id || (album.type === 'albums' ? album.id : null),
        name: finalAttrs.name || attrs.name || 'Unknown Album',
        artistName: finalAttrs.artistName || attrs.artistName || 'Unknown Artist',
        artwork: parseArtwork(finalAttrs) || parseArtwork(attrs),
        genres: finalAttrs.genreNames || attrs.genreNames || [],
        url: finalAttrs.url || attrs.url || null,
        releaseDate: finalAttrs.releaseDate || attrs.releaseDate || null,
        trackCount: finalAttrs.trackCount || attrs.trackCount || null,
    };
}

//  Main handler 

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { userMusicToken, types = ['artists'], limit = 3 } = body;

        if (!userMusicToken) {
            return NextResponse.json(
                { error: 'userMusicToken is required' },
                { status: 400 }
            );
        }

        const developerToken = generateDeveloperToken();

        const headers = {
            Authorization: `Bearer ${developerToken}`,
            'Music-User-Token': userMusicToken,
        };

        const requestedTypes: string[] = Array.isArray(types) ? types : [types];
        const typesParam = requestedTypes.join(',');

        // Fetch favorites from /v1/me/favorites
        const favoritesUrl = `https://api.music.apple.com/v1/me/favorites?types=${typesParam}&l=en-US&limit=${limit}&relate=catalog`;
        const favRes = await fetch(favoritesUrl, { headers });

        if (!favRes.ok) {
            const errBody = await favRes.text();
            console.error(`Apple favorites fetch failed: ${favRes.status}`, errBody);

            // Fallback to library endpoints if favorites endpoint unavailable
            if (favRes.status === 404 || favRes.status === 400) {
                return await fetchLibraryFallback(headers, limit, requestedTypes);
            }

            return NextResponse.json(
                { error: `Apple Music API error: ${favRes.status}`, details: errBody },
                { status: favRes.status }
            );
        }

        const favData = await favRes.json();

        const result: Record<string, any> = {};

        // Parse artists
        if (requestedTypes.includes('artists')) {
            let artistResources: any[] = [];

            if (favData.data && Array.isArray(favData.data)) {
                artistResources = favData.data.filter(
                    (item: any) => item.type === 'artists' || item.type === 'library-artists'
                );
            }
            if (artistResources.length === 0 && favData.resources) {
                const src = favData.resources.artists || favData.resources['library-artists'];
                if (src) artistResources = Object.values(src);
            }

            result.artists = deduplicateByName(artistResources.map(parseArtist)).slice(0, limit);
        }

        // Parse albums
        if (requestedTypes.includes('albums')) {
            let albumResources: any[] = [];

            if (favData.data && Array.isArray(favData.data)) {
                albumResources = favData.data.filter(
                    (item: any) => item.type === 'albums' || item.type === 'library-albums'
                );
            }
            if (albumResources.length === 0 && favData.resources) {
                const src = favData.resources.albums || favData.resources['library-albums'];
                if (src) albumResources = Object.values(src);
            }

            result.albums = deduplicateByName(albumResources.map(parseAlbum)).slice(0, limit);
        }

        return NextResponse.json({
            ...result,
            raw: process.env.NODE_ENV === 'development' ? favData : undefined,
        });
    } catch (error: any) {
        console.error('Apple favorites error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

//  Fallback: library endpoints 

async function fetchLibraryFallback(
    headers: Record<string, string>,
    limit: number,
    types: string[]
): Promise<NextResponse> {
    try {
        const fetchLimit = Math.max(limit * 2, 10);
        const result: Record<string, any> = { source: 'library-fallback' };

        if (types.includes('artists')) {
            const url = `https://api.music.apple.com/v1/me/library/artists?limit=${fetchLimit}&include=catalog`;
            const res = await fetch(url, { headers });
            if (res.ok) {
                const data = await res.json();
                const items = (data.data || []).map(parseArtist);
                result.artists = deduplicateByName(items).slice(0, limit);
            } else {
                console.error(`Library artists fallback failed: ${res.status}`);
                result.artists = [];
            }
        }

        if (types.includes('albums')) {
            const url = `https://api.music.apple.com/v1/me/library/albums?limit=${fetchLimit}&include=catalog`;
            const res = await fetch(url, { headers });
            if (res.ok) {
                const data = await res.json();
                const items = (data.data || []).map(parseAlbum);
                result.albums = deduplicateByName(items).slice(0, limit);
            } else {
                console.error(`Library albums fallback failed: ${res.status}`);
                result.albums = [];
            }
        }

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Library fallback error:', error);
        return NextResponse.json(
            { error: error.message || 'Fallback failed' },
            { status: 500 }
        );
    }
}
