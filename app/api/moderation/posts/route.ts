import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isModerator } from '@/lib/supabase/moderation';
import supabase from '@/lib/supabase/admin';

// MOD-ONLY ROUTE
// GET fetches all flagged songs and album reviews for the moderator dashboard 

// returns a unified list of flagged posts with:
// - review id, type, content, rating, created_at
// - song/album name and artist name
// - author username and pfp
// - flag count and deduplicated list of reasons

export async function GET(req: NextRequest) {
    try {
        const authClient = await createClient();
 
        const { data: { user }, error: authError } = await authClient.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
 
        const mod = await isModerator(supabase, user.id);
        if (!mod) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
 
        // fetch flagged song reviews
        const { data: songReviews, error: songError } = await supabase
            .from('song_reviews')
            .select(`
                id,
                review,
                rating,
                created_at,
                edited_at,
                user_id,
                users (
                    username,
                    profile_picture_url
                ),
                songs (
                    name,
                    artists (
                        name
                    )
                )
            `)
            .eq('is_flagged', true);
 
        if (songError) {
            console.error('Failed to fetch flagged song reviews:', songError);
            return NextResponse.json({ error: 'Failed to fetch flagged posts' }, { status: 500 });
        }
 
        // fetch flagged album reviews
        const { data: albumReviews, error: albumError } = await supabase
            .from('album_reviews')
            .select(`
                id,
                review,
                rating,
                created_at,
                edited_at,
                user_id,
                users (
                    username,
                    profile_picture_url
                ),
                albums (
                    name,
                    artists (
                        name
                    )
                )
            `)
            .eq('is_flagged', true);
 
        if (albumError) {
            console.error('Failed to fetch flagged album reviews:', albumError);
            return NextResponse.json({ error: 'Failed to fetch flagged posts' }, { status: 500 });
        }
 
        // fetch reports for song reviews separately to avoid postgrest fk ambiguity
        const songReviewIds = (songReviews || []).map((r: any) => r.id);
        const albumReviewIds = (albumReviews || []).map((r: any) => r.id);
 
        const [songReportsRes, albumReportsRes] = await Promise.all([
            songReviewIds.length > 0
                ? supabase.from('user_reported').select('song_review_id, reason').in('song_review_id', songReviewIds)
                : { data: [] },
            albumReviewIds.length > 0
                ? supabase.from('user_reported').select('album_review_id, reason').in('album_review_id', albumReviewIds)
                : { data: [] },
        ]);
 
        // build lookup maps by review id
        const songReportMap: Record<number, string[]> = {};
        for (const rep of songReportsRes.data || []) {
            if (!songReportMap[rep.song_review_id]) songReportMap[rep.song_review_id] = [];
            songReportMap[rep.song_review_id].push(rep.reason);
        }
 
        const albumReportMap: Record<number, string[]> = {};
        for (const rep of albumReportsRes.data || []) {
            if (!albumReportMap[rep.album_review_id]) albumReportMap[rep.album_review_id] = [];
            albumReportMap[rep.album_review_id].push(rep.reason);
        }
 
        // normalize song reviews
        const normalizedSongs = (songReviews || []).map((r: any) => ({
            id: r.id,
            type: 'song_review' as const,
            content: r.review,
            rating: r.rating,
            createdAt: r.created_at,
            editedAt: r.edited_at,
            username: r.users?.username || null,
            userAvatar: r.users?.profile_picture_url || null,
            itemName: r.songs?.name || null,
            artistName: r.songs?.artists?.name || null,
            flagCount: (songReportMap[r.id] || []).length,
            reasons: [...new Set(songReportMap[r.id] || [])],
        }));
 
        // normalize album reviews
        const normalizedAlbums = (albumReviews || []).map((r: any) => ({
            id: r.id,
            type: 'album_review' as const,
            content: r.review,
            rating: r.rating,
            createdAt: r.created_at,
            editedAt: r.edited_at,
            username: r.users?.username || null,
            userAvatar: r.users?.profile_picture_url || null,
            itemName: r.albums?.name || null,
            artistName: r.albums?.artists?.name || null,
            flagCount: (albumReportMap[r.id] || []).length,
            reasons: [...new Set(albumReportMap[r.id] || [])],
        }));
 
        // merge and sort descending by flag count
        const allFlagged = [...normalizedSongs, ...normalizedAlbums]
            .sort((a, b) => b.flagCount - a.flagCount);
 
        return NextResponse.json({ posts: allFlagged });
    } catch (error: any) {
        console.error('Moderation posts route error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}