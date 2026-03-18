import { SupabaseClient } from "@supabase/supabase-js";
import { notFound } from 'next/navigation';

export async function getProfile(supabase: SupabaseClient, username: string) {
    let isOwner = false;

    const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

    if (!profile) {
        notFound();
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        isOwner = user?.id === profile.id;
    }

    const profileInfo = { username, isOwner, ...profile };

    return { userId: profile.id, profileInfo: profileInfo };
}

export async function getProfileStatistics(supabase: SupabaseClient, userId: string) {
    const songReviewsQuery = supabase
        .from('song_reviews')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

    const albumReviewQuery = supabase
        .from('album_reviews')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

    const followersQuery = supabase
        .from('friends')
        .select('*', { count: 'exact', head: true })
        .eq('following', userId);

    const followingQuery = supabase
        .from('friends')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

    const [songReviews, albumReviews, followers, following] = await Promise.all([
        songReviewsQuery,
        albumReviewQuery,
        followersQuery,
        followingQuery
    ]);

    if (songReviews.error || albumReviews.error || followers.error || following.error) {
        notFound();
    } else {
        const sR = songReviews.count || 0;
        const aR = albumReviews.count || 0;
        const reviewCount = sR + aR;
        return [reviewCount, followers.count, following.count];
    }
}   