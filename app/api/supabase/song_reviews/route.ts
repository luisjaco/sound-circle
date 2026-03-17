import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
    const supabase = await createClient();

    const { searchParams } = new URL(req.url);

    const countOnly = searchParams.get('count');
    const userId = searchParams.get('userId');
    const reviewId = searchParams.get('reviewId');

    if (!userId && !reviewId) {
        return Response.json(
            { error: 'Bad Request' },
            { status: 500 }
        );
    }

    // specific review
    if ( reviewId ) {
        const { data, error } = await supabase
            .from('song_reviews')
            .select('*')
            .eq('id', reviewId);

        if ( error ) {
            return Response.json (
                { error: "Invalid Query" },
                { status: 500 }
            );
        } else {
            return Response.json (
                data
            )
        }
    }

    // count of reviews
    if ( countOnly ) {
        const { data, error } = await supabase
            .from('song_reviews')
            .select('*', {count: "exact", head: true})
            .eq('user_id', userId);

        if ( error ) {
            return Response.json (
                { error: "Invalid Query "},
                { status: 500 }
            );
        } else {
            return Response.json(
                data
            );
        }
    }

    // all reviews
    const { data, error } = await supabase
        .from('song_reviews')
        .select('*')
        .eq('user_id', userId);

    if ( error ) {
        return Response.json(
            { error: "Invalid Query" },
            { status: 500 }
        )
    } else {
        return Response.json(
            data
        )
    }
}