import { createClient } from '@/lib/supabase/server';
import { UnifiedReview } from '@/lib/types/review';
import { getSongs } from '@/lib/spotify/song';
import { getAlbums } from '@/lib/spotify/album';

function chunkArray<T>(array: T[], size: number): T[][] {
    const chunked = [];
    for (let i = 0; i < array.length; i += size) {
        chunked.push(array.slice(i, i + size));
    }
    return chunked;
}

/**
 * GET /api/supabase/reviews
 *
 * Unified endpoint that fetches both song_reviews and album_reviews,
 * merges them, and sorts by effective date (edited_at if present, otherwise created_at) ascending.
 *
 * Query Parameters:
 *   - username (optional): Filter reviews by a specific user's username
 *   - type (optional): 'songs' | 'albums' — filter to only song or album reviews (default: both)
 */
export async function GET(req: Request) {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);

    const username = searchParams.get('username');
    const type = searchParams.get('type'); // 'songs' | 'albums' | null

    // Validate type param if provided
    if (type && type !== 'songs' && type !== 'albums') {
        return Response.json(
            { error: 'Invalid type parameter. Must be "songs" or "albums".' },
            { status: 400 }
        );
    }

    // Resolve username → user_id if provided
    let userId: string | null = null;
    if (username) {
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('username', username)
            .single();

        if (userError || !user) {
            return Response.json(
                { error: `User "${username}" not found` },
                { status: 404 }
            );
        }
        userId = user.id;
    }

    const reviews: UnifiedReview[] = [];

    //SONG REVIEWS
    if (type !== 'albums') {
        let songQuery = supabase
            .from('song_reviews')
            .select(`
                id,
                is_public,
                rating,
                review,
                edited_at,
                created_at,
                is_flagged,
                user_id,
                song_id,
                users!user_id (
                    id,
                    username,
                    name,
                    profile_picture_url
                ),
                songs!song_id (
                    id,
                    name,
                    spotify_id,
                    apple_music_id,
                    artists!artist_id (
                        id,
                        name
                    )
                )
            `);

        if (userId) {
            songQuery = songQuery.eq('user_id', userId);
        }

        const { data: songData, error: songError } = await songQuery;

        if (songError) {
            console.error('Error fetching song reviews:', songError);
        }

        if (songData) {
            for (const row of songData as any[]) {
                const sortDate = row.edited_at || row.created_at;
                reviews.push({
                    id: row.id,
                    review_type: 'song',
                    is_public: row.is_public,
                    rating: row.rating != null ? Number(row.rating) : null,
                    review: row.review,
                    edited_at: row.edited_at,
                    created_at: row.created_at,
                    is_flagged: row.is_flagged,
                    user: row.users,
                    song: row.songs,
                    album: null,
                    sort_date: sortDate,
                });
            }
        }
    }

    //ALBUM REVIEWS 
    if (type !== 'songs') {
        let albumQuery = supabase
            .from('album_reviews')
            .select(`
                id,
                is_public,
                rating,
                review,
                edited_at,
                created_at,
                is_flagged,
                user_id,
                album_id,
                users!user_id (
                    id,
                    username,
                    name,
                    profile_picture_url
                ),
                albums!album_id (
                    id,
                    name,
                    spotify_id,
                    apple_music_id,
                    artists!artist_id (
                        id,
                        name
                    )
                )
            `);

        if (userId) {
            albumQuery = albumQuery.eq('user_id', userId);
        }

        const { data: albumData, error: albumError } = await albumQuery;

        if (albumError) {
            console.error('Error fetching album reviews:', albumError);
        }

        if (albumData) {
            for (const row of albumData as any[]) {
                const sortDate = row.edited_at || row.created_at;
                reviews.push({
                    id: row.id,
                    review_type: 'album',
                    is_public: row.is_public,
                    rating: row.rating != null ? Number(row.rating) : null,
                    review: row.review,
                    edited_at: row.edited_at,
                    created_at: row.created_at,
                    is_flagged: row.is_flagged,
                    user: row.users,
                    song: null,
                    album: row.albums,
                    sort_date: sortDate,
                });
            }
        }
    }

    // Sort by effective date descending (most recent first - edited_at if present, else created_at)
    reviews.sort((a, b) => {
        const aTime = new Date(a.sort_date).getTime();
        const bTime = new Date(b.sort_date).getTime();
        return bTime - aTime;
    });

    // ==================== FETCH COVER ART ====================
    const songSpotifyIds = Array.from(new Set(
        reviews.filter(r => r.review_type === 'song' && r.song?.spotify_id)
            .map(r => r.song!.spotify_id!)
    ));

    const albumSpotifyIds = Array.from(new Set(
        reviews.filter(r => r.review_type === 'album' && r.album?.spotify_id)
            .map(r => r.album!.spotify_id!)
    ));

    const songImageMap = new Map<string, string>();
    const albumImageMap = new Map<string, string>();

    if (songSpotifyIds.length > 0) {
        const chunks = chunkArray(songSpotifyIds, 50);
        for (const chunk of chunks) {
            try {
                const data = await getSongs(chunk);
                if (data && data.tracks) {
                    for (const track of data.tracks) {
                        if (track && track.album?.images?.[0]?.url) {
                            songImageMap.set(track.id, track.album.images[0].url);
                        }
                    }
                }
            } catch (e) {
                console.error('Error fetching spotify songs for cover art:', e);
            }
        }
    }

    if (albumSpotifyIds.length > 0) {
        const chunks = chunkArray(albumSpotifyIds, 20); // Spotify /v1/albums max is 20
        for (const chunk of chunks) {
            try {
                const data = await getAlbums(chunk);
                if (data && data.albums) {
                    for (const album of data.albums) {
                        if (album && album.images?.[0]?.url) {
                            albumImageMap.set(album.id, album.images[0].url);
                        }
                    }
                }
            } catch (e) {
                console.error('Error fetching spotify albums for cover art:', e);
            }
        }
    }

    // Map the images back to the reviews
    for (const review of reviews) {
        if (review.review_type === 'song' && review.song?.spotify_id) {
            review.song.cover_art_url = songImageMap.get(review.song.spotify_id) || null;
        } else if (review.review_type === 'album' && review.album?.spotify_id) {
            review.album.cover_art_url = albumImageMap.get(review.album.spotify_id) || null;
        }
    }

    return Response.json(reviews);
}
