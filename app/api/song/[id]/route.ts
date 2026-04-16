import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase/admin';
import { getClientToken } from '@/lib/spotify/client';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        // 1. Get song from SB
        const { data: song, error: songErr } = await supabase
            .from('songs')
            .select('*, artists (*)')
            .eq('id', id)
            .single();

        if (songErr || !song) {
            return NextResponse.json({ error: 'Song not found' }, { status: 404 });
        }

        // 2. Query Spotify to gather image
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
