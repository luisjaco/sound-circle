import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isModerator } from '@/lib/supabase/moderation';
import supabase from '@/lib/supabase/admin';

// MOD-ONLY ROUTE
// GET fetches all users who have ever been reported for the moderator dashboard

// returns per user:
// - username, profile_picture_url, banned, warned status
// - total flag count (all time)
// - 3 most recent violation reasons

export async function GET(req: NextRequest) {
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

        // fetch all reports with author id (most recent first)
        const { data: reports, error: reportsError } = await supabase
            .from('user_reported')
            .select(`
                id,
                reason,
                created_at,
                song_reviews (
                    user_id
                ),
                album_reviews (
                    user_id
                )
            `)
            .order('created_at', { ascending: false });

        if (reportsError) {
            console.error('Failed to fetch user reports:', reportsError);
            return NextResponse.json({ error: 'Failed to fetch user reports' }, { status: 500 });
        }

        // collect unique author ids in one pass
        const authorIdSet = new Set<string>();
        for (const report of reports || []) {
            const songReview = report.song_reviews as any;
            const albumReview = report.album_reviews as any;
            const authorId = songReview?.user_id || albumReview?.user_id;
            if (authorId) authorIdSet.add(authorId);
        }

        const authorIds = [...authorIdSet];
        if (authorIds.length === 0) {
            return NextResponse.json({ users: [] });
        }

        // fetch all reported users in a single query
        const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('id, username, profile_picture_url, banned, warned')
            .in('id', authorIds);

        if (usersError) {
            console.error('Failed to fetch user data:', usersError);
            return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
        }

        // build lookup map by id
        const usersById: Record<string, any> = {};
        for (const u of usersData || []) {
            usersById[u.id] = u;
        }

        // group reports by author
        const userMap: Record<string, {
            userId: string;
            username: string;
            userAvatar: string | null;
            banned: boolean;
            warned: boolean;
            flagCount: number;
            recentReasons: string[];
        }> = {};

        for (const report of reports || []) {
            const songReview = report.song_reviews as any;
            const albumReview = report.album_reviews as any;
            const authorId = songReview?.user_id || albumReview?.user_id;
            if (!authorId || !usersById[authorId]) continue;

            if (!userMap[authorId]) {
                const u = usersById[authorId];
                userMap[authorId] = {
                    userId: u.id,
                    username: u.username,
                    userAvatar: u.profile_picture_url || null,
                    banned: u.banned,
                    warned: u.warned,
                    flagCount: 0,
                    recentReasons: [],
                };
            }

            userMap[authorId].flagCount += 1;

            // reports ordered by created_at desc (first 3 are most recent)
            if (report.reason && userMap[authorId].recentReasons.length < 3) {
                userMap[authorId].recentReasons.push(report.reason);
            }
        }

        // convert to array, sort by flag count descending
        const reportedUsers = Object.values(userMap)
            .sort((a, b) => b.flagCount - a.flagCount);

        return NextResponse.json({ users: reportedUsers });
    } catch (error: any) {
        console.error('Moderation users route error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}