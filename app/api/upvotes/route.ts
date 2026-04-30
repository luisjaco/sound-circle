import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase/admin';

// GET /api/upvotes?post_id=<id>&user_id=<id>
// Returns the total upvote count for a post and whether the given user has upvoted.
// Query params:
//   post_id  (required) – the review id
//   user_id  (optional) – if provided, also returns whether this user upvoted

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const postId = searchParams.get('post_id');
        const userId = searchParams.get('user_id');

        if (!postId) {
            return NextResponse.json(
                { error: 'Missing required param: post_id' },
                { status: 400 }
            );
        }

        // Get the total count
        const { count, error: countError } = await supabase
            .from('upvotes')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', postId)
            .is('comments_id', null); // only count review upvotes, not comment upvotes

        if (countError) {
            console.error('Failed to count upvotes:', countError);
            return NextResponse.json(
                { error: `Failed to count upvotes: ${countError.message}` },
                { status: 500 }
            );
        }

        // Check if the user has upvoted (if user_id is provided)
        let userUpvoted = false;
        if (userId) {
            const { data: existing } = await supabase
                .from('upvotes')
                .select('id')
                .eq('post_id', postId)
                .eq('user_id', userId)
                .is('comments_id', null)
                .limit(1);

            userUpvoted = !!(existing && existing.length > 0);
        }

        return NextResponse.json({
            post_id: Number(postId),
            count: count ?? 0,
            user_upvoted: userUpvoted,
        });
    } catch (error: any) {
        console.error('Upvotes GET error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch upvotes' },
            { status: 500 }
        );
    }
}

// POST /api/upvotes
// Toggles an upvote — if the user already upvoted, it removes it. Otherwise it adds one.
// Body: { post_id, user_id, comments_id? }

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { post_id, user_id, comments_id } = body;

        if (!post_id || !user_id) {
            return NextResponse.json(
                { error: 'Missing required fields: post_id, user_id' },
                { status: 400 }
            );
        }

        // Check if the user already upvoted this post/comment
        let existingQuery = supabase
            .from('upvotes')
            .select('id')
            .eq('post_id', post_id)
            .eq('user_id', user_id);

        if (comments_id) {
            existingQuery = existingQuery.eq('comments_id', comments_id);
        } else {
            existingQuery = existingQuery.is('comments_id', null);
        }

        const { data: existing } = await existingQuery.limit(1);

        if (existing && existing.length > 0) {
            // Already upvoted — remove it
            const { error: deleteError } = await supabase
                .from('upvotes')
                .delete()
                .eq('id', existing[0].id);

            if (deleteError) {
                console.error('Failed to remove upvote:', deleteError);
                return NextResponse.json(
                    { error: `Failed to remove upvote: ${deleteError.message}` },
                    { status: 500 }
                );
            }

            return NextResponse.json({ action: 'removed' });
        } else {
            // Not upvoted — add it
            const insertData: Record<string, any> = {
                post_id,
                user_id,
            };
            if (comments_id) {
                insertData.comments_id = comments_id;
            }

            const { error: insertError } = await supabase
                .from('upvotes')
                .insert(insertData);

            if (insertError) {
                console.error('Failed to add upvote:', insertError);
                return NextResponse.json(
                    { error: `Failed to add upvote: ${insertError.message}` },
                    { status: 500 }
                );
            }

            return NextResponse.json({ action: 'added' });
        }
    } catch (error: any) {
        console.error('Upvotes POST error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to toggle upvote' },
            { status: 500 }
        );
    }
}
