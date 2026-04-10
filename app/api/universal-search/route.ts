import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import supabase from '@/lib/supabase/admin';
import { MB_BASE, USER_AGENT } from '@/lib/musicbrainz';
import { searchSpotifyImages } from '@/lib/spotify/search';
import { addArtistsToSupabase, findArtistIds } from '@/lib/supabase/table/artists';

/**
 * GET /api/universal-search?q=<query>
 *
 * Unified search endpoint. Returns results in 4 categories:
 *   users, artists, albums, songs
 *
 * Priority: Supabase first, then MusicBrainz for artists/albums/songs.
 * If MusicBrainz results are found that don't exist in Supabase,
 * they are inserted into Supabase (artists, albums, songs only – not users).
 *
 * Artist inserts use addArtistsToSupabase which resolves Spotify + Apple Music IDs
 * via MusicBrainz relational data before inserting.
 */

interface SearchResult {
    type: 'user' | 'artist' | 'album' | 'song';
    id: string;
    name: string;
    imageUrl: string | null;
    subtitle: string | null;   // artist name for songs, null for others
}

// rate limiter for musicbrainz
let lastMBRequest = 0;
async function mbFetch(url: string): Promise<Response> {
    const now = Date.now();
    const elapsed = now - lastMBRequest;
    if (elapsed < 1100) {
        await new Promise((r) => setTimeout(r, 1100 - elapsed));
    }
    lastMBRequest = Date.now();
    return fetch(url, {
        headers: {
            'User-Agent': USER_AGENT,
            Accept: 'application/json',
        },
    });
}

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
        const supabaseClient = await createClient();

        // 1. USERS (Supabase only) 
        const { data: usersData } = await supabaseClient
            .from('users')
            .select('id, name, username, profile_picture_url')
            .or(`username.ilike.%${q}%,name.ilike.%${q}%`)
            .limit(10);

        const users: SearchResult[] = (usersData || []).map((u: any) => ({
            type: 'user' as const,
            id: u.id,
            name: u.name || u.username,
            imageUrl: u.profile_picture_url || null,
            subtitle: `@${u.username}`,
        }));

        // 2. ARTISTS
        // Search Supabase first
        const { data: sbArtists } = await supabaseClient
            .from('artists')
            .select('id, name, musicbrainz_id')
            .ilike('name', `%${q}%`)
            .limit(10);

        let artists: SearchResult[] = (sbArtists || []).map((a: any) => ({
            type: 'artist' as const,
            id: String(a.id),
            name: a.name || 'Unknown Artist',
            imageUrl: null,
            subtitle: null,
        }));

        // If fewer than 5 results from Supabase, supplement with MusicBrainz
        if (artists.length < 5) {
            const mbArtists = await searchMBArtists(q, 10);
            const existingMBIds = new Set((sbArtists || []).map((a: any) => a.musicbrainz_id));

            // Collect artists that need to be inserted
            const artistsToInsert: { id: string; name: string }[] = [];

            for (const mbArtist of mbArtists) {
                if (existingMBIds.has(mbArtist.id)) continue;
                if (artists.length + artistsToInsert.length >= 10) break;

                // filter junk entries
                if (['[unknown]', 'various artists', '[no artist]'].includes(mbArtist.name.toLowerCase())) continue;

                artistsToInsert.push({ id: mbArtist.id, name: mbArtist.name });
                existingMBIds.add(mbArtist.id);
            }

            // Use addArtistsToSupabase which fetches Spotify + Apple Music IDs
            if (artistsToInsert.length > 0) {
                const insertedArtists = await addArtistsToSupabase(artistsToInsert);

                if (insertedArtists) {
                    for (const inserted of insertedArtists) {
                        const original = artistsToInsert.find(a => a.id === inserted.musicbrainz_id);
                        artists.push({
                            type: 'artist',
                            id: String(inserted.id),
                            name: inserted.name || original?.name || 'Unknown Artist',
                            imageUrl: null,
                            subtitle: null,
                        });
                    }
                } else {
                    // Fallback: still show the artists in results even if insert failed
                    for (const mbArtist of artistsToInsert) {
                        artists.push({
                            type: 'artist',
                            id: mbArtist.id,
                            name: mbArtist.name,
                            imageUrl: null,
                            subtitle: null,
                        });
                    }
                }
            }
        }

        //3. ALBUMS (release-groups)
        const { data: sbAlbums } = await supabaseClient
            .from('albums')
            .select('id, name, musicbrainz_id, artist_id, artists!artist_id(name)')
            .ilike('name', `%${q}%`)
            .limit(10);

        let albums: SearchResult[] = (sbAlbums || []).map((a: any) => ({
            type: 'album' as const,
            id: String(a.id),
            name: a.name || 'Unknown Album',
            imageUrl: null,
            subtitle: (a.artists as any)?.name || null,
        }));

        if (albums.length < 5) {
            const mbAlbums = await searchMBAlbums(q, 10);
            const existingMBIds = new Set((sbAlbums || []).map((a: any) => a.musicbrainz_id));

            for (const mbAlbum of mbAlbums) {
                if (existingMBIds.has(mbAlbum.id)) continue;
                if (albums.length >= 10) break;

                // Resolve the artist first so we have artist_id for the album
                const artistDbId = await resolveArtistId(mbAlbum.artistMbId, mbAlbum.artist);

                const insertData: Record<string, any> = {
                    musicbrainz_id: mbAlbum.id,
                    name: mbAlbum.title,
                };
                if (artistDbId) {
                    insertData.artist_id = artistDbId;
                }

                const { data: inserted, error: albumErr } = await supabase
                    .from('albums')
                    .upsert(insertData, { onConflict: 'musicbrainz_id' })
                    .select('id')
                    .single();

                if (albumErr) {
                    console.error(`Failed to insert album ${mbAlbum.title}:`, albumErr);
                }

                albums.push({
                    type: 'album',
                    id: inserted ? String(inserted.id) : mbAlbum.id,
                    name: mbAlbum.title,
                    imageUrl: null,
                    subtitle: mbAlbum.artist || null,
                });
                existingMBIds.add(mbAlbum.id);
            }
        }

        // ==================== 4. SONGS (recordings) ====================
        const { data: sbSongs } = await supabaseClient
            .from('songs')
            .select('id, name, musicbrainz_id, artist_id, artists!artist_id(name)')
            .ilike('name', `%${q}%`)
            .limit(10);

        let songs: SearchResult[] = (sbSongs || []).map((s: any) => ({
            type: 'song' as const,
            id: String(s.id),
            name: s.name || 'Unknown Song',
            imageUrl: null,
            subtitle: (s.artists as any)?.name || null,
        }));

        if (songs.length < 5) {
            const mbSongs = await searchMBSongs(q, 10);
            const existingMBIds = new Set((sbSongs || []).map((s: any) => s.musicbrainz_id));

            for (const mbSong of mbSongs) {
                if (existingMBIds.has(mbSong.id)) continue;
                if (songs.length >= 10) break;

                // Resolve the artist first so we have artist_id for the song
                const artistDbId = await resolveArtistId(mbSong.artistMbId, mbSong.artist);

                if (!artistDbId) {
                    // Still show in results but skip the DB insert (artist_id is required)
                    songs.push({
                        type: 'song',
                        id: mbSong.id,
                        name: mbSong.title,
                        imageUrl: null,
                        subtitle: mbSong.artist || null,
                    });
                    existingMBIds.add(mbSong.id);
                    continue;
                }

                const insertData: Record<string, any> = {
                    musicbrainz_id: mbSong.id,
                    name: mbSong.title,
                    artist_id: artistDbId,
                    isrc: '',
                };

                const { data: inserted, error: songErr } = await supabase
                    .from('songs')
                    .upsert(insertData, { onConflict: 'musicbrainz_id' })
                    .select('id')
                    .single();

                if (songErr) {
                    console.error(`Failed to insert song ${mbSong.title}:`, songErr);
                }

                songs.push({
                    type: 'song',
                    id: inserted ? String(inserted.id) : mbSong.id,
                    name: mbSong.title,
                    imageUrl: null,
                    subtitle: mbSong.artist || null,
                });
                existingMBIds.add(mbSong.id);
            }
        }

        //5. Images from spotify
        const spotifyData = await searchSpotifyImages(q);
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

        return NextResponse.json({
            query: q,
            users,
            artists,
            albums,
            songs,
        });
    } catch (error: any) {
        console.error('Unified search error:', error);
        return NextResponse.json(
            { error: error.message || 'Search failed' },
            { status: 500 }
        );
    }
}

// ==================== Helper: resolve artist MusicBrainz ID to Supabase ID ====================

/**
 * Given a MusicBrainz artist ID and name, ensures the artist exists in Supabase
 * (using addArtistsToSupabase which also fetches Spotify + Apple Music IDs)
 * and returns the Supabase artist.id.
 */
async function resolveArtistId(
    artistMbId: string | null,
    artistName: string | null
): Promise<number | null> {
    if (!artistMbId) return null;

    // Check if artist already exists in Supabase
    const existing = await findArtistIds([artistMbId]);
    if (existing && existing.length > 0) {
        return existing[0].id;
    }

    // Insert via addArtistsToSupabase (fetches Spotify + Apple Music IDs)
    const inserted = await addArtistsToSupabase([
        { id: artistMbId, name: artistName || 'Unknown Artist' }
    ]);

    if (inserted && inserted.length > 0) {
        return inserted[0].id;
    }

    return null;
}

// ==================== MusicBrainz helpers ====================

async function searchMBArtists(query: string, limit: number) {
    try {
        const url = `${MB_BASE}/artist?query=${encodeURIComponent(query)}*&fmt=json&limit=${limit}`;
        const res = await mbFetch(url);
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
        const res = await mbFetch(url);
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
        const res = await mbFetch(url);
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
