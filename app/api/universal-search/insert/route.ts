import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase/admin';
import { addArtistsToSupabase, findArtistIds } from '@/lib/supabase/table/artists';
import { fetchPlatformIdsFallback } from '@/lib/platforms';

/**
 * POST /api/universal-search/insert
 *
 * Inserts a MusicBrainz entity into Supabase when a user clicks a search result.
 * This runs asynchronously from the user's perspective — the frontend fires this
 * and doesn't block.
 *
 * Body: { type: 'artist' | 'album' | 'song', musicbrainzId, name, artistMbId?, artistName? }
 * Returns: { id: <supabase id>, type, source: 'supabase' }
 */

interface InsertRequest {
    type: 'artist' | 'album' | 'song';
    musicbrainzId: string;
    name: string;
    artistMbId?: string | null;
    artistName?: string | null;
}

export async function POST(req: NextRequest) {
    try {
        const body: InsertRequest = await req.json();

        if (!body.type || !body.musicbrainzId || !body.name) {
            return NextResponse.json(
                { error: 'Missing required fields: type, musicbrainzId, name' },
                { status: 400 }
            );
        }

        const { type, musicbrainzId, name, artistMbId, artistName } = body;

        //ARTIST
        if (type === 'artist') {
            // Check if already exists
            const existing = await findArtistIds([musicbrainzId]);
            if (existing && existing.length > 0) {
                return NextResponse.json({
                    id: existing[0].id,
                    type: 'artist',
                    source: 'supabase',
                });
            }

            // Insert using addArtistsToSupabase (fetches Spotify + Apple Music IDs)
            const inserted = await addArtistsToSupabase([{ id: musicbrainzId, name }]);

            if (!inserted || inserted.length === 0) {
                return NextResponse.json(
                    { error: 'Failed to insert artist' },
                    { status: 500 }
                );
            }

            return NextResponse.json({
                id: inserted[0].id,
                type: 'artist',
                source: 'supabase',
            });
        }

        //ALBUM
        if (type === 'album') {
            // Check if already exists
            const { data: existingAlbum } = await supabase
                .from('albums')
                .select('id')
                .eq('musicbrainz_id', musicbrainzId)
                .limit(1);

            if (existingAlbum && existingAlbum.length > 0) {
                return NextResponse.json({
                    id: existingAlbum[0].id,
                    type: 'album',
                    source: 'supabase',
                });
            }

            // Resolve artist first
            const artistDbId = await resolveArtistId(artistMbId || null, artistName || null);

            // Fetch platform IDs
            const { spotifyId, appleId } = await fetchPlatformIdsFallback('album', name, artistName);

            const insertData: Record<string, any> = {
                musicbrainz_id: musicbrainzId,
                name,
                spotify_id: spotifyId || '',
                apple_music_id: appleId || '',
            };
            if (artistDbId) {
                insertData.artist_id = artistDbId;
            }

            const { data: newAlbum, error: albumErr } = await supabase
                .from('albums')
                .insert(insertData)
                .select('id')
                .single();

            if (albumErr) {
                console.error(`Failed to insert album ${name}:`, albumErr);
                return NextResponse.json(
                    { error: `Failed to insert album: ${albumErr.message}` },
                    { status: 500 }
                );
            }

            return NextResponse.json({
                id: newAlbum.id,
                type: 'album',
                source: 'supabase',
            });
        }

        // SONG 
        if (type === 'song') {
            // Check if already exists
            const { data: existingSong } = await supabase
                .from('songs')
                .select('id')
                .eq('musicbrainz_id', musicbrainzId)
                .limit(1);

            if (existingSong && existingSong.length > 0) {
                return NextResponse.json({
                    id: existingSong[0].id,
                    type: 'song',
                    source: 'supabase',
                });
            }

            // Resolve artist first
            const artistDbId = await resolveArtistId(artistMbId || null, artistName || null);

            if (!artistDbId) {
                return NextResponse.json(
                    { error: 'Could not resolve artist for song insert' },
                    { status: 500 }
                );
            }

            // Fetch platform IDs
            const { spotifyId, appleId } = await fetchPlatformIdsFallback('song', name, artistName);

            const insertData: Record<string, any> = {
                musicbrainz_id: musicbrainzId,
                name,
                artist_id: artistDbId,
                isrc: '',
                spotify_id: spotifyId || '',
                apple_music_id: appleId || '',
            };

            const { data: newSong, error: songErr } = await supabase
                .from('songs')
                .insert(insertData)
                .select('id')
                .single();

            if (songErr) {
                console.error(`Failed to insert song ${name}:`, songErr);
                return NextResponse.json(
                    { error: `Failed to insert song: ${songErr.message}` },
                    { status: 500 }
                );
            }

            return NextResponse.json({
                id: newSong.id,
                type: 'song',
                source: 'supabase',
            });
        }

        return NextResponse.json(
            { error: `Unknown type: ${type}` },
            { status: 400 }
        );
    } catch (error: any) {
        console.error('Insert error:', error);
        return NextResponse.json(
            { error: error.message || 'Insert failed' },
            { status: 500 }
        );
    }
}

// Helper: resolve artist MusicBrainz ID to Supabase ID

async function resolveArtistId(
    artistMbId: string | null,
    artistName: string | null
): Promise<number | null> {
    if (!artistMbId) return null;

    const existing = await findArtistIds([artistMbId]);
    if (existing && existing.length > 0) {
        return existing[0].id;
    }

    const inserted = await addArtistsToSupabase([
        { id: artistMbId, name: artistName || 'Unknown Artist' }
    ]);

    if (inserted && inserted.length > 0) {
        return inserted[0].id;
    }

    return null;
}
