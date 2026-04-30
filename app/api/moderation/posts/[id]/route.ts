import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isModerator } from '@/lib/supabase/moderation';
import supabase from '@/lib/supabase/admin'; 

// PATCH edits the content of a flagged review
// DELETE deletes a flagged review entirely (report rows cascade automatically)

// PATCH: edit review content
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
 
        let body: { type?: string; content?: string };
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }
 
        const { type, content } = body;
 
        if (type !== 'song_review' && type !== 'album_review') {
            return NextResponse.json(
                { error: 'Missing or invalid type. Must be song_review or album_review' },
                { status: 400 }
            );
        }
 
        if (!content?.trim()) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }
 
        const reviewTable = type === 'song_review' ? 'song_reviews' : 'album_reviews';
 
        const { error: updateError } = await supabase
            .from(reviewTable)
            .update({
                review: content.trim(),
                edited_at: new Date().toISOString(),
            })
            .eq('id', reviewId)
            .select();
 
        if (updateError) {
            console.error('Failed to edit review:', updateError);
            return NextResponse.json({ error: 'Failed to edit review' }, { status: 500 });
        }
 
        return NextResponse.json({ message: 'Review updated successfully.' });
    } catch (error: any) {
        console.error('Edit review route error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
 
// DELETE: delete review entirely (report rows cascade automatically)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
 
        const reviewTable = type === 'song_review' ? 'song_reviews' : 'album_reviews';
 
        const { error: deleteError } = await supabase
            .from(reviewTable)
            .delete()
            .eq('id', reviewId);
 
        if (deleteError) {
            console.error('Failed to delete review:', deleteError);
            return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
        }
 
        return NextResponse.json({ message: 'Review deleted successfully.' });
    } catch (error: any) {
        console.error('Delete review route error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}