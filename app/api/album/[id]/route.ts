import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase/admin';
import { MB_BASE, USER_AGENT } from '@/lib/musicbrainz';
import { getClientToken } from '@/lib/spotify/client';
import { fetchPlatformIdsFallback } from '@/lib/platforms';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        // 1. Get album from SB
        const { data: album, error: albumErr } = await supabase
            .from('albums')
            .select('*, artists (*)')
            .eq('id', id)
            .single();

        if (albumErr || !album) {
            return NextResponse.json({ error: 'Album not found' }, { status: 404 });
        }

        // 1.5 Auto-repair broken/missing platform IDs seamlessly in the background
        if (!album.apple_music_id || !album.spotify_id) {
            const platformIds = await fetchPlatformIdsFallback('album', album.name, album.artists?.name);
            let patched = false;
            
            if (!album.apple_music_id && platformIds?.appleId) {
                album.apple_music_id = platformIds.appleId;
                patched = true;
            }
            if (!album.spotify_id && platformIds?.spotifyId) {
                album.spotify_id = platformIds.spotifyId;
                patched = true;
            }
            
            if (patched) {
                // Background fire-and-forget DB patch
                supabase.from('albums').update({
                    apple_music_id: album.apple_music_id || '',
                    spotify_id: album.spotify_id || ''
                }).eq('id', album.id).then();
            }
        }

        // 2. Query SB for songs tied to this album
        const { data: sbSongs } = await supabase
            .from('songs')
            .select('id, name, musicbrainz_id, spotify_id, apple_music_id, isrc')
            .eq('album_id', id);

        let songs = sbSongs || [];

        // 3. Query MB for missing songs (recordings within the release)
        if (album.musicbrainz_id) {
            // Need to fetch release to see its tracks
            // In MB, release-groups have releases, releases have media with tracks (recordings)
            // We must parse the canonical release to fetch nested tracks natively
            const rgFetch = await fetch(
                `${MB_BASE}/release-group/${album.musicbrainz_id}?inc=releases&fmt=json`,
                { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } }
            );

            if (rgFetch.ok) {
                const rgData = await rgFetch.json();
                const officialRelease = rgData.releases?.[0]; // Defaulting to canonical release
                
                if (officialRelease?.id) {
                    const recRes = await fetch(
                        `${MB_BASE}/recording?release=${officialRelease.id}&limit=50&fmt=json`,
                        { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } }
                    );

                    if (recRes.ok) {
                        const recData = await recRes.json();
                        const mbs = recData.recordings || [];
                
                        // Keep missing ones
                        const missingSongs = mbs.filter((mb: any) => 
                            mb.title && !songs.find(s => s.musicbrainz_id === mb.id)
                        );

                        // 4. Upload missing MB songs to SB
                        if (missingSongs.length > 0) {
                            const newSongs = await Promise.all(missingSongs.map(async (mb: any) => {
                                const { spotifyId, appleId } = await fetchPlatformIdsFallback('song', mb.title, album.artists?.name || null);
                                const insertData = {
                                    musicbrainz_id: mb.id,
                                    name: mb.title,
                                    artist_id: album.artist_id,
                                    album_id: id,
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
            }
        }

        // 5. Query Spotify to gather images in batches
        const tokenData = await getClientToken();
        let albumImage = null;

        if (tokenData) {
            // Album Image
            if (album.spotify_id) {
                try {
                    const res = await fetch(`https://api.spotify.com/v1/albums/${album.spotify_id}`, {
                        headers: { Authorization: `Bearer ${tokenData.access_token}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        albumImage = data.images?.[0]?.url || null;
                        if (data.release_date) {
                            (album as any).releaseYear = parseInt(data.release_date.split('-')[0], 10);
                        }
                        if (data.popularity !== undefined) {
                            (album as any).popularity = data.popularity;
                        }
                    }
                } catch (e) {
                    console.error('Album spotify image fetch error:', e);
                }
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
                                    let updates: any = {};
                                    if (spTrack.album?.images?.[0]?.url) {
                                        updates.imageUrl = spTrack.album.images[0].url;
                                    }
                                    if (spTrack.track_number) {
                                        updates.trackNumber = spTrack.track_number;
                                    }
                                    if (spTrack.duration_ms) {
                                        const dur = spTrack.duration_ms;
                                        const min = Math.floor(dur / 60000);
                                        const sec = Math.floor((dur % 60000) / 1000);
                                        updates.duration = `${min}:${sec < 10 ? '0' : ''}${sec}`;
                                    }
                                    if (spTrack.popularity !== undefined) {
                                        updates.popularity = spTrack.popularity;
                                    }
                                    if (Object.keys(updates).length > 0) {
                                        songs[index] = { ...songs[index], ...updates };
                                    }
                                }
                            }
                        }
                    }
                } catch (e) {}
            }
        }

        return NextResponse.json({
            album: { ...album, imageUrl: albumImage },
            songs
        });

    } catch (error: any) {
        console.error('Album aggregate error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
