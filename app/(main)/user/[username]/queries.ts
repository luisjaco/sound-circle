import { SupabaseClient } from "@supabase/supabase-js";
import { notFound } from 'next/navigation';

type SBArtist = {
    artist_id: string,
    artists: {
        id: string,
        name: string,
        spotify_id: string
    }
}

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

export async function getTopArtists(supabase: SupabaseClient, userId: string, limit?: number) {
    let topArtists: SBArtist[] = [];

    let query = supabase
        .from('user_favorite_artists')
        .select(`
            artist_id,
            artists ( 
                id, 
                name, 
                spotify_id 
            )
            `)
        .eq('user_id', userId)

    if (limit) {
        query = query.limit(limit);
    }

    const { data, error } = await query as { data: SBArtist[] | null, error: object };


    if (error) {
        console.error(`error retrieving top artists for user ${userId}: ${error}`);
        return topArtists;
    }

    if (data) topArtists = data;

    return topArtists;
}

export async function getArtistComponentData(artists: SBArtist[]) {
    const spotifyIds = artists.map((x) => x.artists.spotify_id || '');
    // URL params will leave empty parameters blank.
    const query = new URLSearchParams({ artistIds: spotifyIds.join(',') })

    // grab data
    const artistRes = await fetch(`http://localhost:3000/api/spotify/artists?${query.toString()}`);

    let topArtistData = [];

    if (!artistRes.ok) {
        return [];
    }

    // match artists back with corresponding artist data.
    let artistData = await artistRes.json();
    artistData = artistData.artists;

    // O(2n) operation lol

    // spotify_id : image url
    const validIds: Record<string, string> = { '' : '' };
    for (const artist of artistData) {
        const id = artist.id as string
        validIds[id] = artist.images[0]?.url || '';
    }

    let completedData: {
        id: string,
        name: string,
        spotify_image: string
    }[] = [];

    for (const artist of artists) {
        const artistData = {
            id: artist.artist_id,
            name: artist.artists.name,
            spotify_image: validIds[artist.artists.spotify_id]
        };
        completedData.push(artistData);
    }

    return completedData;
}