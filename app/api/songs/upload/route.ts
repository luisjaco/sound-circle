import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase/admin';

/**
 * POST /api/songs/upload
 *
 * Uploads matched songs to Supabase, creating artist and album records as needed.
 * Flow per song:
 *   1. Upsert artist into 'artists' table (dedup by musicbrainz_id)
 *   2. Upsert album into 'albums' table (dedup by musicbrainz_id)
 *   3. Insert song into 'songs' table (dedup by source_id / musicbrainz_id / isrc)
 *
 * IDs are passed directly since table columns are now text.
 */
interface UploadSong {
    source_id: string;
    platform: 'apple' | 'spotify';
    musicbrainz_id: string;
    musicbrainz_artist_id?: string | null;
    musicbrainz_release_id?: string | null;
    isrc?: string | null;
    name: string;
    artist_name: string;
}

// ---- Route Handler ----

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const songs: UploadSong[] = body.songs;

        if (!Array.isArray(songs) || songs.length === 0) {
            return NextResponse.json(
                { error: 'Request body must include a non-empty "songs" array' },
                { status: 400 }
            );
        }

        if (songs.length > 50) {
            return NextResponse.json(
                { error: 'Maximum 50 songs per request' },
                { status: 400 }
            );
        }

        const details: { source_id: string; platform: string; action: 'inserted' | 'skipped'; reason?: string }[] = [];
        let inserted = 0;
        let skipped = 0;

        for (const song of songs) {
            if (!song.source_id || !song.musicbrainz_id || !song.platform) {
                details.push({ 
                    source_id: song.source_id || 'unknown', 
                    platform: song.platform || 'unknown',
                    action: 'skipped', 
                    reason: 'Missing required field' 
                });
                skipped++;
                continue;
            }
            console.log(`[upload] Song ${song.source_id} (${song.platform}): artist_mb=${song.musicbrainz_artist_id}, release_mb=${song.musicbrainz_release_id}, isrc=${song.isrc}`);

            // ==================== 1. ARTIST ====================
            let artistDbId: number | null = null;

            if (song.musicbrainz_artist_id) {
                // Check if artist already exists
                const { data: existingArtist } = await supabase
                    .from('artists')
                    .select('id')
                    .eq('musicbrainz_id', song.musicbrainz_artist_id)
                    .limit(1);

                if (existingArtist && existingArtist.length > 0) {
                    artistDbId = existingArtist[0].id;
                } else {
                    // Insert new artist
                    const { data: newArtist, error: artistErr } = await supabase
                        .from('artists')
                        .insert({ musicbrainz_id: song.musicbrainz_artist_id })
                        .select('id')
                        .single();

                    if (artistErr) {
                        console.error(`Failed to insert artist for song ${song.source_id} (${song.platform}):`, artistErr);
                        details.push({ 
                            source_id: song.source_id, 
                            platform: song.platform, 
                            action: 'skipped', 
                            reason: `Artist insert failed: ${artistErr.message}` 
                        });
                        skipped++;
                        continue;
                    }
                    artistDbId = newArtist.id;
                }
            }

            if (artistDbId === null) {
                details.push({ 
                    source_id: song.source_id, 
                    platform: song.platform, 
                    action: 'skipped', 
                    reason: 'No artist data available' 
                });
                skipped++;
                continue;
            }

            // ==================== 2. ALBUM ====================
            let albumDbId: number | null = null;

            if (song.musicbrainz_release_id) {
                // Check if album already exists
                const { data: existingAlbum } = await supabase
                    .from('albums')
                    .select('id')
                    .eq('musicbrainz_id', song.musicbrainz_release_id)
                    .limit(1);

                if (existingAlbum && existingAlbum.length > 0) {
                    albumDbId = existingAlbum[0].id;
                } else {
                    // Insert new album with artist reference
                    const { data: newAlbum, error: albumErr } = await supabase
                        .from('albums')
                        .insert({ musicbrainz_id: song.musicbrainz_release_id, artist_id: artistDbId })
                        .select('id')
                        .single();

                    if (albumErr) {
                        console.error(`Failed to insert album for song ${song.source_id} (${song.platform}):`, albumErr);
                        details.push({ 
                            source_id: song.source_id, 
                            platform: song.platform, 
                            action: 'skipped', 
                            reason: `Album insert failed: ${albumErr.message}` 
                        });
                        skipped++;
                        continue;
                    }
                    albumDbId = newAlbum.id;
                }
            }

            // ==================== 3. SONG (with dedup) ====================

            // Check by platform-specific ID
            const platformIdField = song.platform === 'apple' ? 'apple_music_id' : 'spotify_id';
            const { data: existingByPlatform } = await supabase
                .from('songs')
                .select('id')
                .eq(platformIdField, song.source_id)
                .limit(1);

            if (existingByPlatform && existingByPlatform.length > 0) {
                details.push({ 
                    source_id: song.source_id, 
                    platform: song.platform, 
                    action: 'skipped', 
                    reason: `Song already exists (${platformIdField})`
                });
                skipped++;
                continue;
            }

            // Check by musicbrainz_id
            const { data: existingByMB } = await supabase
                .from('songs')
                .select('id')
                .eq('musicbrainz_id', song.musicbrainz_id)
                .limit(1);

            if (existingByMB && existingByMB.length > 0) {
                details.push({ 
                    source_id: song.source_id, 
                    platform: song.platform, 
                    action: 'skipped', 
                    reason: 'Song already exists (musicbrainz_id)' 
                });
                skipped++;
                continue;
            }

            // Check by ISRC
            if (song.isrc) {
                const { data: existingByISRC } = await supabase
                    .from('songs')
                    .select('id')
                    .eq('isrc', song.isrc)
                    .limit(1);

                if (existingByISRC && existingByISRC.length > 0) {
                    details.push({ 
                        source_id: song.source_id, 
                        platform: song.platform, 
                        action: 'skipped', 
                        reason: 'Song already exists (isrc)' 
                    });
                    skipped++;
                    continue;
                }
            }

            // Insert song
            const row: Record<string, any> = {
                musicbrainz_id: song.musicbrainz_id,
                artist_id: artistDbId,
                isrc: song.isrc || "", // Default to "" as the table has a NOT NULL constraint on isrc
            };

            // Set platform-specific ID
            if (song.platform === 'apple') {
                row.apple_music_id = song.source_id;
            } else if (song.platform === 'spotify') {
                row.spotify_id = song.source_id;
            }

            // Only add album_id if we successfully resolved and inserted an album
            if (albumDbId !== null) {
                row.album_id = albumDbId;
            }

            const { error: insertError } = await supabase
                .from('songs')
                .insert(row);

            if (insertError) {
                console.error(`Failed to insert song ${song.source_id} (${song.platform}):`, insertError);
                details.push({ 
                    source_id: song.source_id, 
                    platform: song.platform, 
                    action: 'skipped', 
                    reason: `Insert failed: ${insertError.message}` 
                });
                skipped++;
            } else {
                details.push({ 
                    source_id: song.source_id, 
                    platform: song.platform, 
                    action: 'inserted' 
                });
                inserted++;
            }
        }

        return NextResponse.json({ inserted, skipped, details });
    } catch (error: any) {
        console.error('Songs upload error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
