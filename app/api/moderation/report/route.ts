import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import supabaseAdmin from '@/lib/supabase/admin';

// POST allows a logged-in user to report a song or album review

// - blocks duplicate reports from the same user on the same review
// - immediately sets is_flagged = true on the review
// - inserts a row into user_reported with the reason

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
 
        // get logged-in user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
       
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
 
        // parse body
        let body: {
            type?: 'song_review' | 'album_review';
            reviewId?: number;
            reason?: string;
        };
 
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }
 
        const { type, reviewId, reason } = body;
 
        if (!type || !reviewId || !reason?.trim()) {
            return NextResponse.json(
                { error: 'Missing required fields: type, reviewId, reason' },
                { status: 400 }
            );
        }
 
        if (type !== 'song_review' && type !== 'album_review') {
            return NextResponse.json(
                { error: 'Invalid type. Must be song_review or album_review' },
                { status: 400 }
            );
        }
 
        const reviewColumn = type === 'song_review' ? 'song_review_id' : 'album_review_id';
        const reviewTable  = type === 'song_review' ? 'song_reviews'   : 'album_reviews';
 
        // confirm the review exists
        const { data: review, error: reviewError } = await supabase
            .from(reviewTable)
            .select('id')
            .eq('id', reviewId)
            .single();
 
        if (reviewError || !review) {
            return NextResponse.json({ error: 'Review not found' }, { status: 404 });
        }
 
        // block duplicate reports (same user on the same review)
        const { data: existing } = await supabase
            .from('user_reported')
            .select('id')
            .eq('user_id', user.id)
            .eq(reviewColumn, reviewId)
            .maybeSingle();

        console.log('existing report:', existing);
        console.log('reviewColumn:', reviewColumn);
        console.log('reviewId:', reviewId);
        console.log('user.id:', user.id);
        
        if (existing) {
            return NextResponse.json(
                { error: 'You have already reported this review' },
                { status: 409 }
            );
        }
 
        // insert report row
        const { error: insertError } = await supabase
            .from('user_reported')
            .insert({
                user_id: user.id,
                [reviewColumn]: reviewId,
                reason: reason.trim(),
            });
 
        if (insertError) {
            console.error('Failed to insert report:', insertError);
            return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 });
        }
 
        // set is_flagged = true on the review
        const { error: flagError } = await supabaseAdmin
            .from(reviewTable)
            .update({ is_flagged: true })
            .eq('id', reviewId);
 
        if (flagError) {
            console.error('Failed to flag review:', flagError);
            // report was inserted, flag update failed (not critical)
        }
 
        return NextResponse.json({ message: 'Report submitted successfully.' });
    } catch (error: any) {
        console.error('Report route error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}