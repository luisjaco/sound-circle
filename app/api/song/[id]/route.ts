import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase/admin';
import { getClientToken } from '@/lib/spotify/client';
import { searchAppleMusicByISRC } from '@/lib/appleMusic/song';
import { searchSpotifyByISRC } from '@/lib/spotify/song';
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        // 1. Get song from SB
        const { data: s, error: songErr } = await supabase
            .from('songs')
            .select('*, artists (*)')
            .eq('id', id)
            .single();

        if (songErr || !s) {
            console.error(`error occurred while finding entry for song ${id}`)
            console.error(songErr);
            return NextResponse.json({ error: 'Song not found' }, { status: 404 });
        }

        let song = s;
        // 2. if apple music and spotify ids do not exist, search..
        if (!song.apple_music_id && !song.spotify_id && song.isrc) {
            
            const [ appleMusicEntry, spotifyEntry ] = await Promise.all([
                searchAppleMusicByISRC(song.isrc, true, song.name, song.artists.name),
                searchSpotifyByISRC(song.isrc)
            ])

            const appleMusicId = appleMusicEntry ? appleMusicEntry.id : null;
            const spotifyId = spotifyEntry ? spotifyEntry.id : null;

            const { data, error } = await supabase
                .from('songs')
                .update({
                    apple_music_id: appleMusicId,
                    spotify_id: spotifyId
                })
                .eq('id', id)
                .select('*')
                .single()

            if (error) {
                console.error(`error occurred while updating entry for song ${id}`)
                console.error(error);
                return NextResponse.json({ error: 'Updating error' }, { status: 401 });
            }

            song = data;
        }

        // 3. Query Spotify to gather image
        const tokenData = await getClientToken();
        let songImage = null;

        if (tokenData && song.spotify_id) {
            try {
                const res = await fetch(`https://api.spotify.com/v1/tracks/${song.spotify_id}`, {
                    headers: { Authorization: `Bearer ${tokenData.access_token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    songImage = data.album?.images?.[0]?.url || null;
                }
            } catch (e) {
                console.error('Song spotify image fetch error:', e);
            }
        }

        return NextResponse.json({
            song: { ...song, imageUrl: songImage }
        });

    } catch (error: any) {
        console.error('Song aggregate error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
