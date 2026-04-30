import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isModerator } from '@/lib/supabase/moderation';
import supabase from '@/lib/supabase/admin';
 
// PATCH dismisses a flagged review without deleting its content
// - deletes all report rows for this review from user_reported
// - sets is_flagged = false on the review

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        // auth check with regular client
        const authClient = await createClient();
        const { data: { user }, error: authError } = await authClient.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // mod check with admin client (bypasses rls)
        const mod = await isModerator(supabase, user.id);
        if (!mod) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;
        const reviewId = parseInt(id, 10);
        if (isNaN(reviewId)) {
            return NextResponse.json({ error: 'Invalid review ID' }, { status: 400 });
        }
 
        const type = req.nextUrl.searchParams.get('type');
        if (type !== 'song_review' && type !== 'album_review') {
            return NextResponse.json(
                { error: 'Missing or invalid type param. Must be song_review or album_review' },
                { status: 400 }
            );
        }
 
        const reviewTable  = type === 'song_review' ? 'song_reviews'   : 'album_reviews';
        const reviewColumn = type === 'song_review' ? 'song_review_id' : 'album_review_id';
 
        // delete all report rows for this review
        const { error: deleteError } = await supabase
            .from('user_reported')
            .delete()
            .eq(reviewColumn, reviewId);
 
        if (deleteError) {
            console.error('Failed to delete report rows:', deleteError);
            return NextResponse.json({ error: 'Failed to dismiss reports' }, { status: 500 });
        }
 
        // clear the review flag
        const { error: unflagError } = await supabase
            .from(reviewTable)
            .update({ is_flagged: false })
            .eq('id', reviewId);
 
        if (unflagError) {
            console.error('Failed to unflag review:', unflagError);
            return NextResponse.json({ error: 'Failed to clear flag on review' }, { status: 500 });
        }
 
        return NextResponse.json({ message: 'Review dismissed successfully.' });
    } catch (error: any) {
        console.error('Dismiss route error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}