import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase/admin';
import { MB_BASE, USER_AGENT } from '@/lib/musicbrainz';
import { getClientToken } from '@/lib/spotify/client';
import { fetchPlatformIdsFallback } from '@/lib/platforms';

/**
 * GET /api/artist/[id]
 *
 * Implements the full flow:
 * 1. Grab artist from Supabase
 * 2. Query SB for albums & songs
 * 3. Query MB for missing albums & songs
 * 4. Upload missing MB albums & songs to Supabase
 * 5. Query Spotify to gather images in batch
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        // 1. Get artist from SB
        const { data: artist, error: artistErr } = await supabase
            .from('artists')
            .select('*')
            .eq('id', id)
            .single();

        if (artistErr || !artist) {
            return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
        }

        // 2. Query SB for albums/songs (get everything we already have)
        const { data: sbAlbums } = await supabase
            .from('albums')
            .select('id, name, musicbrainz_id, spotify_id, apple_music_id')
            .eq('artist_id', id);

        const { data: sbSongs } = await supabase
            .from('songs')
            .select('id, name, musicbrainz_id, spotify_id, apple_music_id, isrc')
            .eq('artist_id', id);

        let albums = sbAlbums || [];
        let songs = sbSongs || [];

        // rate limiter for MB requests so we don't timeout/block
        const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

        // 3. Query MB for missing albums (release-groups)
        if (artist.musicbrainz_id) {
            // fetch Top 50 albums
            const rgRes = await fetch(
                `${MB_BASE}/release-group?artist=${artist.musicbrainz_id}&limit=50&fmt=json`,
                { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } }
            );

            if (rgRes.ok) {
                const rgData = await rgRes.json();
                const mbs = rgData['release-groups'] || [];
                
                const norm = (str: string) => str.toLowerCase().replace(/\s*\[.*?\]\s*/g, '').replace(/\s*\(.*?\)\s*/g, '').replace(/[^a-z0-9]/g, '').trim();
                const seenAlbums = new Set(albums.map(a => norm(a.name)));
                const uniqueMissingAlbums = [];

                for (const mb of mbs) {
                    if (!mb.title || mb['primary-type'] !== 'Album') continue;
                    if (mb.title.toLowerCase().includes('[unknown]')) continue;
                    const key = norm(mb.title);
                    if (!seenAlbums.has(key) && !albums.find(a => a.musicbrainz_id === mb.id)) {
                        seenAlbums.add(key);
                        uniqueMissingAlbums.push(mb);
                    }
                }
                
                const missingAlbums = uniqueMissingAlbums.slice(0, 15); // Top 15 pure missing targets

                // 4. Upload missing MB albums to SB
                if (missingAlbums.length > 0) {
                    const newAlbums = await Promise.all(missingAlbums.map(async (mb: any) => {
                        const { spotifyId, appleId } = await fetchPlatformIdsFallback('album', mb.title, artist.name);
                        const insertData = {
                            musicbrainz_id: mb.id,
                            name: mb.title,
                            artist_id: id,
                            spotify_id: spotifyId || '',
                            apple_music_id: appleId || ''
                        };

                        const { data } = await supabase
                            .from('albums')
                            .insert(insertData)
                            .select('id, name, musicbrainz_id, spotify_id, apple_music_id')
                            .single();
                        return data;
                    }));
                    albums = [...albums, ...(newAlbums.filter(Boolean) as any[])];
                }
            }

            await delay(1100); // 1.1s delay to respect MB rate limit

            // fetch Top 100 songs (recordings)
            const recRes = await fetch(
                `${MB_BASE}/recording?artist=${artist.musicbrainz_id}&limit=100&fmt=json`,
                { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } }
            );

            if (recRes.ok) {
                const recData = await recRes.json();
                const mbs = recData.recordings || [];
                
                const norm = (str: string) => str.toLowerCase().replace(/\s*\[.*?\]\s*/g, '').replace(/\s*\(.*?\)\s*/g, '').replace(/[^a-z0-9]/g, '').trim();
                const seenSongs = new Set(songs.map(s => norm(s.name)));
                const uniqueMissingSongs = [];

                for (const mb of mbs) {
                    if (!mb.title) continue;
                    if (mb.title.toLowerCase().includes('[unknown]')) continue;
                    const key = norm(mb.title);
                    if (!seenSongs.has(key) && !songs.find(s => s.musicbrainz_id === mb.id)) {
                        seenSongs.add(key);
                        uniqueMissingSongs.push(mb);
                    }
                }

                // Limit insertion to 20 actual unique missing tracks to avoid excessive fallback timeouts
                const missingSongs = uniqueMissingSongs.slice(0, 20);

                // Upload missing MB songs to SB
                if (missingSongs.length > 0) {
                    const newSongs = await Promise.all(missingSongs.map(async (mb: any) => {
                        const { spotifyId, appleId } = await fetchPlatformIdsFallback('song', mb.title, artist.name);
                        const insertData = {
                            musicbrainz_id: mb.id,
                            name: mb.title,
                            artist_id: id,
                            isrc: '',
                            spotify_id: spotifyId || '',
                            apple_music_id: appleId || ''
                        };

                        const { data } = await supabase
                            .from('songs')
                            .insert(insertData)
                            .select('id, name, musicbrainz_id, spotify_id, apple_music_id, isrc')
                            .single();
                        return data;
                    }));
                    songs = [...songs, ...(newSongs.filter(Boolean) as any[])];
                }
            }
        }

        // 5. Query Spotify to gather images in batches
        const tokenData = await getClientToken();
        let artistImage = null;

        if (tokenData) {
            // Artist Image
            if (artist.spotify_id) {
                try {
                    const res = await fetch(`https://api.spotify.com/v1/artists/${artist.spotify_id}`, {
                        headers: { Authorization: `Bearer ${tokenData.access_token}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        artistImage = data.images?.[0]?.url || null;
                    }
                } catch (e) {
                    console.error('Artist spotify image fetch error:', e);
                }
            }

            // Albums Images (Spotify batch limit: 20 per request)
            const validAlbumIds = albums.map(a => a.spotify_id).filter(Boolean);
            const albumBatches = [];
            for (let i = 0; i < validAlbumIds.length; i += 20) {
                albumBatches.push(validAlbumIds.slice(i, i + 20));
            }

            for (const batch of albumBatches) {
                try {
                    const res = await fetch(`https://api.spotify.com/v1/albums?ids=${batch.join(',')}`, {
                        headers: { Authorization: `Bearer ${tokenData.access_token}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        if (data.albums) {
                            for (const spAlbum of data.albums) {
                                if (!spAlbum) continue;
                                const index = albums.findIndex(a => a.spotify_id === spAlbum.id);
                                if (index !== -1) {
                                    const isValid = spAlbum.artists?.some((art: any) => art.id === artist.spotify_id);
                                    if (artist.spotify_id && !isValid) {
                                        (albums[index] as any).invalidMatch = true;
                                        continue;
                                    }
                                    let albumUpdates: any = {};
                                    if (spAlbum.images?.[0]?.url) {
                                        albumUpdates.imageUrl = spAlbum.images[0].url;
                                    }
                                    if (spAlbum.release_date) {
                                        albumUpdates.releaseYear = parseInt(spAlbum.release_date.split('-')[0], 10);
                                    }
                                    if (spAlbum.popularity !== undefined) {
                                        albumUpdates.popularity = spAlbum.popularity;
                                    }
                                    if (Object.keys(albumUpdates).length > 0) {
                                        albums[index] = { ...albums[index], ...albumUpdates };
                                    }
                                }
                            }
                        }
                    }
                } catch (e) {}
            }

            // Songs Images (Spotify batch limit: 50 per request)
            const validSongIds = songs.map(s => s.spotify_id).filter(Boolean);
            const songBatches = [];
            for (let i = 0; i < validSongIds.length; i += 50) {
                songBatches.push(validSongIds.slice(i, i + 50));
            }

            for (const batch of songBatches) {
                try {
                    const res = await fetch(`https://api.spotify.com/v1/tracks?ids=${batch.join(',')}`, {
                        headers: { Authorization: `Bearer ${tokenData.access_token}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        if (data.tracks) {
                            for (const spTrack of data.tracks) {
                                if (!spTrack) continue;
                                const index = songs.findIndex(s => s.spotify_id === spTrack.id);
                                if (index !== -1) {
                                    const isValid = spTrack.artists?.some((art: any) => art.id === artist.spotify_id);
                                    if (artist.spotify_id && !isValid) {
                                        (songs[index] as any).invalidMatch = true;
                                        continue;
                                    }
                                    let songUpdates: any = {};
                                    if (spTrack.album?.images?.[0]?.url) {
                                        songUpdates.imageUrl = spTrack.album.images[0].url;
                                    }
                                    if (spTrack.album?.release_date) {
                                        songUpdates.releaseYear = parseInt(spTrack.album.release_date.split('-')[0], 10);
                                    }
                                    if (spTrack.popularity !== undefined) {
                                        songUpdates.popularity = spTrack.popularity;
                                    }
                                    if (Object.keys(songUpdates).length > 0) {
                                        songs[index] = { ...songs[index], ...songUpdates };
                                    }
                                }
                            }
                        }
                    }
                } catch (e) {}
            }
        }

        // Helper to normalize strings for aggressive deduplication
        const normalize = (str: string) => str.toLowerCase().replace(/\s*\[.*?\]\s*/g, '').replace(/\s*\(.*?\)\s*/g, '').replace(/[^a-z0-9]/g, '').trim();

        // Filter and deduplicate albums
        const albumMap = new Map();
        for (const alb of albums) {
            const a = alb as any;
            if (a.invalidMatch) continue; // Skip mistaken platform mappings
            if (!a.releaseYear) continue; // Skip if no year found
            if (a.name.toLowerCase().includes('[unknown]')) continue;
            
            const key = normalize(a.name);
            if (!albumMap.has(key) || (!albumMap.get(key).imageUrl && a.imageUrl)) {
                albumMap.set(key, a);
            }
        }
        let cleanAlbums = Array.from(albumMap.values());

        // Filter and deduplicate songs
        const songMap = new Map();
        for (const song of songs) {
            const s = song as any;
            if (s.invalidMatch) continue; // Skip mistaken platform mappings
            if (!s.releaseYear) continue; // Skip if no year found
            if (s.name.toLowerCase().includes('[unknown]')) continue;
            
            const key = normalize(s.name);
            if (!songMap.has(key) || (!songMap.get(key).imageUrl && s.imageUrl)) {
                songMap.set(key, s);
            }
        }
        let cleanSongs = Array.from(songMap.values());

        // Sort both prominently by Spotify popularity descending, then default fallback to release year descending
        cleanAlbums.sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0) || b.releaseYear - a.releaseYear);
        cleanSongs.sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0) || b.releaseYear - a.releaseYear);
        
        return NextResponse.json({
            artist: { ...artist, imageUrl: artistImage },
            albums: cleanAlbums,
            songs: cleanSongs
        });

    } catch (error: any) {
        console.error('Artist aggregate error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
