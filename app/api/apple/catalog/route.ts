import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

/**
 * POST /api/apple/catalog
 *
 * Accepts Apple Music library track IDs and fetches their catalog equivalents
 * from the Apple Music API. Catalog tracks include ISRCs which are needed
 * for accurate MusicBrainz lookups.
 *
 * The Apple Music API can look up catalog songs by their catalog ID.
 * Library tracks (starting with "i.") need to be converted to catalog IDs first,
 * but often the playParams.catalogId is available. If not, we search by ISRC or name.
 *
 * Body: { trackIds: string[], userMusicToken: string }
 * Response: { tracks: EnrichedTrack[] }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { trackIds, userMusicToken } = body;

        if (!Array.isArray(trackIds) || trackIds.length === 0) {
            return NextResponse.json(
                { error: 'Request body must include a non-empty "trackIds" array' },
                { status: 400 }
            );
        }

        if (!userMusicToken) {
            return NextResponse.json(
                { error: 'userMusicToken is required' },
                { status: 400 }
            );
        }

        // Generate developer token
        const teamId = process.env.APPLE_TEAM_ID;
        const keyId = process.env.APPLE_KEY_ID;
        const privateKeyRaw = process.env.APPLE_PRIVATE_KEY;

        if (!teamId || !keyId || !privateKeyRaw) {
            return NextResponse.json(
                { error: 'Missing Apple Music configuration' },
                { status: 500 }
            );
        }

        const privateKey = privateKeyRaw.replace(/\\n/g, '\n');
        const developerToken = jwt.sign({}, privateKey, {
            algorithm: 'ES256',
            expiresIn: '180d',
            issuer: teamId,
            header: { alg: 'ES256', kid: keyId },
        });

        // Fetch library songs to get their catalog IDs
        // Apple Music API: GET /v1/me/library/songs/{id}
        // The response includes relationships.catalog which has the catalog song with ISRC
        const enrichedTracks: any[] = [];

        // Process in batches of 10 to avoid overwhelming Apple Music API
        const batchSize = 10;
        for (let i = 0; i < trackIds.length; i += batchSize) {
            const batch = trackIds.slice(i, i + batchSize);

            const promises = batch.map(async (id: string) => {
                try {
                    const isLibraryId = id.startsWith('i.') || id.startsWith('l.');
                    const headers = {
                        Authorization: `Bearer ${developerToken}`,
                        'Music-User-Token': userMusicToken,
                    };

                    if (isLibraryId) {
                        // Library track — fetch with catalog relationship to get ISRC
                        const url = `https://api.music.apple.com/v1/me/library/songs/${id}?include=catalog`;
                        const res = await fetch(url, { headers });

                        if (!res.ok) {
                            console.error(`Apple library fetch failed for ${id}: ${res.status}`);
                            return { id, isrc: null, catalogId: null };
                        }

                        const data = await res.json();
                        const song = data.data?.[0];
                        if (!song) return { id, isrc: null, catalogId: null };

                        const catalogSongs = song.relationships?.catalog?.data;
                        if (catalogSongs && catalogSongs.length > 0) {
                            const catalogSong = catalogSongs[0];
                            return {
                                id,
                                isrc: catalogSong.attributes?.isrc || null,
                                catalogId: catalogSong.id || null,
                            };
                        }

                        const catalogId = song.attributes?.playParams?.catalogId || null;
                        return { id, isrc: null, catalogId };
                    } else {
                        // Catalog track — fetch directly from catalog (has ISRC)
                        const url = `https://api.music.apple.com/v1/catalog/us/songs/${id}`;
                        const res = await fetch(url, { headers });

                        if (!res.ok) {
                            console.error(`Apple catalog fetch failed for ${id}: ${res.status}`);
                            return { id, isrc: null, catalogId: id };
                        }

                        const data = await res.json();
                        const song = data.data?.[0];
                        if (!song) return { id, isrc: null, catalogId: id };

                        return {
                            id,
                            isrc: song.attributes?.isrc || null,
                            catalogId: id,
                        };
                    }
                } catch (err) {
                    console.error(`Error fetching catalog for ${id}:`, err);
                    return { id, isrc: null, catalogId: null };
                }
            });

            const results = await Promise.all(promises);
            enrichedTracks.push(...results);
        }

        return NextResponse.json({ tracks: enrichedTracks });
    } catch (error: any) {
        console.error('Apple catalog error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
