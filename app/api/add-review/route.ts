import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase/admin';

// POST /api/add-review
// Takes in a type ('album' or 'song') to figure out which table to insert into.
// Also needs the album_id or song_id, the user_id, and optionally a rating + review text.
// Returns the newly created review row.

interface ReviewRequest {
    type: 'album' | 'song';
    album_id?: number;
    song_id?: number;
    user_id: string;
    rating?: number | string | null;
    review?: string | null;
    is_public?: boolean;
}

export async function POST(req: NextRequest) {
    try {
        const body: ReviewRequest = await req.json();

        // make sure we at least have a type and user
        if (!body.type || !body.user_id) {
            return NextResponse.json(
                { error: 'Missing required fields: type, user_id' },
                { status: 400 }
            );
        }

        if (body.type !== 'album' && body.type !== 'song') {
            return NextResponse.json(
                { error: `Invalid type: ${body.type}. Must be "album" or "song".` },
                { status: 400 }
            );
        }

        const { type, user_id, rating, review, is_public } = body;

        // handle album reviews
        if (type === 'album') {
            if (!body.album_id) {
                return NextResponse.json(
                    { error: 'Missing required field: album_id (for album review)' },
                    { status: 400 }
                );
            }

            const { data, error } = await supabase
                .from('album_reviews')
                .insert({
                    album_id: body.album_id,
                    user_id,
                    rating: rating != null ? Number(rating) : null,
                    review: review ?? null,
                    is_public: is_public ?? true,
                    is_flagged: false,
                    created_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (error) {
                console.error('Failed to insert album review:', error);
                return NextResponse.json(
                    { error: `Failed to insert album review: ${error.message}` },
                    { status: 500 }
                );
            }

            return NextResponse.json({ review: data, type: 'album' });
        }

        // handle song reviews
        if (type === 'song') {
            if (!body.song_id) {
                return NextResponse.json(
                    { error: 'Missing required field: song_id (for song review)' },
                    { status: 400 }
                );
            }

            const { data, error } = await supabase
                .from('song_reviews')
                .insert({
                    song_id: body.song_id,
                    user_id,
                    rating: rating != null ? String(rating) : null, // this column is varchar in supabase
                    review: review ?? null,
                    is_public: is_public ?? true,
                    is_flagged: false,
                    created_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (error) {
                console.error('Failed to insert song review:', error);
                return NextResponse.json(
                    { error: `Failed to insert song review: ${error.message}` },
                    { status: 500 }
                );
            }

            return NextResponse.json({ review: data, type: 'song' });
        }

        // shouldn't ever get here but just in case
        return NextResponse.json(
            { error: `Unknown type: ${type}` },
            { status: 400 }
        );
    } catch (error: any) {
        console.error('Review insert error:', error);
        return NextResponse.json(
            { error: error.message || 'Review insert failed' },
            { status: 500 }
        );
    }
}
