import 'server-only' // define server file

import { getArtist, getArtists } from '@/lib/spotify/artist';
import { getAlbum, getAlbums } from '@/lib/spotify/album';
import { getSong, getSongs } from '@/lib/spotify/song';
import { follow, unfollow } from '@/lib/supabase/table/friends'
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

type SBAlbum = {
    album_id: string,
    albums: {
        id: string,
        name: string,
        spotify_id: string,
        artists: {
            id: string,
            name: string
        }
    }
}

type SBSong = {
    song_id: string,
    songs: {
        id: string,
        name: string,
        spotify_id: string,
        artists: {
            id: string,
            name: string
        }
    }
}

type SBGenre = {
    user_id: string,
    genre_id: string,
    genres: {
        id: string,
        genre: string
    }
}

export async function checkFollowing(supabase: SupabaseClient, userId: string, followId: string) {
    const { data, error } = await supabase
        .from('friends')
        .select('*')
        .match({
            user_id: userId,
            following: followId
        });

    if ( error ) {
        console.error(`error when retrieving following status for user ${userId} -> ${followId}`);
        console.error(error)
        notFound();
    }

    return data.length === 1
}

export async function getProfile(supabase: SupabaseClient, username: string) {
    let isOwner = false;

    const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

    if (!profile) {
        console.error(`user "${username}" does not exist`);
        notFound();
    }

    const profileInfo = { username, ...profile }
    return profileInfo
}

export async function getClient(supabase: SupabaseClient) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        return user.id
    }

    console.error(`error when grabbing client data`);
    notFound();
}

export async function getFavoriteGenres(supabase: SupabaseClient, userId: string) {
    const { data, error } = await supabase
        .from('user_favorite_genres')
        .select(`
            user_id,
            genre_id,
            genres (
                id,
                genre
        )
        `)
        .eq('user_id', userId)
        .limit(3) as {data: SBGenre[] | null, error: object};

    if (error || !data) {
        console.error(`error when grabbing userId ${userId}'s favorite genres`);
        console.error(error);
        notFound();
    }
    
    return data;
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
        console.error(`could not find statistics for user with id: ${userId}`)
        notFound();
    } else {
        const sR = songReviews.count || 0;
        const aR = albumReviews.count || 0;
        const reviewCount = sR + aR;

        const stats = {
            reviews: reviewCount,
            followers: followers.count,
            following: following.count
        }
        return stats;
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
    if (!(artists.length > 0)) return [];

    const spotifyIds = artists.map((x) => x.artists.spotify_id || '');

    let res = ((artists.length === 1) ? await getArtist(spotifyIds[0]) : await getArtists(spotifyIds));
    if (!res) return [];

    const artistData = res.artists;
    // spotify_id : image url
    const validIds: Record<string, string> = { '': '' };
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

export async function getTopAlbums(supabase: SupabaseClient, userId: string, limit?: number) {
    let topAlbums: SBAlbum[] = [];

    let query = supabase
        .from('user_favorite_albums')
        .select(`
            album_id,
            albums ( 
                id, 
                name, 
                spotify_id,
                artist_id,
                artists (
                    id,
                    name
                ) 
            )
            `)
        .eq('user_id', userId)

    if (limit) {
        query = query.limit(limit);
    }

    const { data, error } = await query as { data: SBAlbum[] | null, error: object };


    if (error) {
        console.error(`error retrieving top albums for user ${userId}:`);
        console.error(error)
        return topAlbums;
    }

    if (data) topAlbums = data;

    return topAlbums;
}

export async function getAlbumComponentData(albums: SBAlbum[]) {
    if (!(albums.length > 0)) return [];

    const spotifyIds = albums.map((x) => x.albums.spotify_id || '');

    let res = ((albums.length === 1) ? await getAlbum(spotifyIds[0]) : await getAlbums(spotifyIds));
    if (!res) return [];

    const albumData = res.albums;

    // spotify_id : image url
    const validIds: Record<string, string> = { '': '' };
    for (const album of albumData) {
        const id = album.id as string
        validIds[id] = album.images[0]?.url || '';
    }

    let completedData: {
        id: string,
        name: string,
        artist_name: string,
        spotify_image: string
    }[] = [];

    for (const album of albums) {
        const albumData = {
            id: album.album_id,
            name: album.albums.name,
            artist_name: album.albums.artists.name,
            spotify_image: validIds[album.albums.spotify_id]
        };
        completedData.push(albumData);
    }

    return completedData;
}

export async function getTopSongs(supabase: SupabaseClient, userId: string, limit?: number) {
    let topSongs: SBSong[] = [];

    let query = supabase
        .from('user_favorite_songs')
        .select(`
            song_id,
            songs ( 
                id, 
                name, 
                spotify_id,
                artist_id,
                artists (
                    id,
                    name
                ) 
            )
            `)
        .eq('user_id', userId)

    if (limit) {
        query = query.limit(limit);
    }

    const { data, error } = await query as { data: SBSong[] | null, error: object };


    if (error) {
        console.error(`error retrieving top songs for user ${userId}:`);
        console.error(error);
        return topSongs;
    }

    if (data) topSongs = data;

    return topSongs;
}

export async function getSongComponentData(songs: SBSong[]) {
    if (!(songs.length > 0)) return [];

    const spotifyIds = songs.map((x) => x.songs.spotify_id || '');

    let res = ((songs.length === 1) ? await getSong(spotifyIds[0]) : await getSongs(spotifyIds));
    if (!res) return [];

    const songData = res.tracks;

    // spotify_id : image url
    const validIds: Record<string, string> = { '': '' };
    for (const song of songData) {
        const id = song.id as string
        validIds[id] = song.album.images[0]?.url || '';
    }

    let completedData: {
        id: string,
        name: string,
        artist_name: string,
        spotify_image: string
    }[] = [];

    for (const song of songs) {
        const songData = {
            id: song.song_id,
            name: song.songs.name,
            artist_name: song.songs.artists.name,
            spotify_image: validIds[song.songs.spotify_id]
        };
        completedData.push(songData);
    }

    return completedData;
}