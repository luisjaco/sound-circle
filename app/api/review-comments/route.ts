import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase/admin';

// GET /api/review-comments
// Fetches comments from the review_comments table.
// You can filter by review_id or user_id (or both).
// Results are sorted newest first using edited_at when available, otherwise created_at.
//
// Query params:
//   review_id  – filter comments for a specific review
//   user_id    – filter comments by a specific user
//   limit      – max number of comments to return (default 50)

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);

        const reviewId = searchParams.get('review_id');
        const userId = searchParams.get('user_id');
        const limit = Math.min(Number(searchParams.get('limit') || 50), 100);

        if (!reviewId && !userId) {
            return NextResponse.json(
                { error: 'At least one filter is required: review_id or user_id' },
                { status: 400 }
            );
        }

        let query = supabase
            .from('review_comments')
            .select(`
                id,
                created_at,
                edited_at,
                content,
                is_flagged,
                user_id,
                review_id,
                users!user_id (
                    id,
                    username,
                    name,
                    profile_picture_url
                )
            `)
            .limit(limit);

        if (reviewId) {
            query = query.eq('review_id', reviewId);
        }

        if (userId) {
            query = query.eq('user_id', userId);
        }

        // Sort newest first — use created_at since Supabase can't do
        // COALESCE in the order clause. We'll re-sort in JS for edited_at priority.
        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;

        if (error) {
            console.error('Failed to fetch review comments:', error);
            return NextResponse.json(
                { error: `Failed to fetch comments: ${error.message}` },
                { status: 500 }
            );
        }

        // Re-sort so that comments with edited_at use that timestamp instead of created_at.
        // This gives us proper "newest activity first" ordering.
        const sorted = (data || []).sort((a: any, b: any) => {
            const dateA = new Date(a.edited_at || a.created_at).getTime();
            const dateB = new Date(b.edited_at || b.created_at).getTime();
            return dateB - dateA;
        });

        return NextResponse.json({ comments: sorted });
    } catch (error: any) {
        console.error('Review comments GET error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch comments' },
            { status: 500 }
        );
    }
}

// POST /api/review-comments
// Creates a new comment on a review.
// Body: { review_id, user_id, content }

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { review_id, user_id, content } = body;

        if (!review_id || !user_id || !content?.trim()) {
            return NextResponse.json(
                { error: 'Missing required fields: review_id, user_id, content' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('review_comments')
            .insert({
                review_id,
                user_id,
                content: content.trim(),
                is_flagged: false,
                created_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) {
            console.error('Failed to insert review comment:', error);
            return NextResponse.json(
                { error: `Failed to insert comment: ${error.message}` },
                { status: 500 }
            );
        }

        return NextResponse.json({ comment: data });
    } catch (error: any) {
        console.error('Review comments POST error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create comment' },
            { status: 500 }
        );
    }
}

// PUT /api/review-comments
// Updates an existing comment's content and sets the edited_at timestamp.
// Body: { id, user_id, content }
// The user_id is checked to make sure only the comment author can edit.

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, user_id, content } = body;

        if (!id || !user_id || !content?.trim()) {
            return NextResponse.json(
                { error: 'Missing required fields: id, user_id, content' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('review_comments')
            .update({
                content: content.trim(),
                edited_at: new Date().toISOString(),
            })
            .eq('id', id)
            .eq('user_id', user_id) // only the author can edit their own comment
            .select()
            .single();

        if (error) {
            console.error('Failed to update review comment:', error);
            return NextResponse.json(
                { error: `Failed to update comment: ${error.message}` },
                { status: 500 }
            );
        }

        return NextResponse.json({ comment: data });
    } catch (error: any) {
        console.error('Review comments PUT error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update comment' },
            { status: 500 }
        );
    }
}
