import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase/admin';

// GET /api/search-reviews
// Grabs all reviews for a given album or song, sorted newest first.
// Pass ?type=album&album_id=123  or  ?type=song&song_id=456

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);

        const type = searchParams.get('type');
        const albumId = searchParams.get('album_id');
        const songId = searchParams.get('song_id');

        if (!type || (type !== 'album' && type !== 'song')) {
            return NextResponse.json(
                { error: 'Missing or invalid "type" param. Must be "album" or "song".' },
                { status: 400 }
            );
        }

        // grab album reviews
        if (type === 'album') {
            if (!albumId) {
                return NextResponse.json(
                    { error: 'Missing required param: album_id' },
                    { status: 400 }
                );
            }

            const { data, error } = await supabase
                .from('album_reviews')
                .select(`
                    *,
                    users (
                        id,
                        name,
                        username,
                        profile_picture_url
                    )
                    `)
                .eq('album_id', albumId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Failed to fetch album reviews:', error);
                return NextResponse.json(
                    { error: `Failed to fetch album reviews: ${error.message}` },
                    { status: 500 }
                );
            }

            return NextResponse.json({ reviews: data, type: 'album' });
        }

        // grab song reviews
        if (type === 'song') {
            if (!songId) {
                return NextResponse.json(
                    { error: 'Missing required param: song_id' },
                    { status: 400 }
                );
            }

            const { data, error } = await supabase
                .from('song_reviews')
                .select(`
                    *,
                    users (
                        id,
                        name,
                        username,
                        profile_picture_url
                    )
                    `)
                .eq('song_id', songId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Failed to fetch song reviews:', error);
                return NextResponse.json(
                    { error: `Failed to fetch song reviews: ${error.message}` },
                    { status: 500 }
                );
            }

            return NextResponse.json({ reviews: data, type: 'song' });
        }
    } catch (error: any) {
        console.error('Search reviews error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to search reviews' },
            { status: 500 }
        );
    }
}
