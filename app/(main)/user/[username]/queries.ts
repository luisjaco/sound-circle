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
    if (!(artists.length > 0)) return [];

    const spotifyIds = artists.map((x) => x.artists.spotify_id || '');
    // URL params will leave empty parameters blank.
    const query = new URLSearchParams({ artistIds: spotifyIds.join(',') })

    // grab data
    const artistRes = await fetch(`http://localhost:3000/api/spotify/artists?${query.toString()}`);

    let artistData = [];

    if (!artistRes.ok) {
        return [];
    }

    // match artists back with corresponding artist data.
    artistData = await artistRes.json();
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

/** @TODO untested */
export async function getAlbumComponentData(albums: SBAlbum[]) {
    if (!(albums.length > 0)) return [];

    const spotifyIds = albums.map((x) => x.albums.spotify_id || '');

    // URL params will leave empty parameters blank.
    const query = new URLSearchParams({ albumIds: spotifyIds.join(',') })

    // grab data
    const albumRes = await fetch(`http://localhost:3000/api/spotify/albums?${query.toString()}`);

    let albumData = [];

    if (!albumRes.ok) {
        return [];
    }

    // match album back with corresponding album data.
    albumData = await albumRes.json();
    albumData = albumData.albums;

    // spotify_id : image url
    const validIds: Record<string, string> = { '' : '' };
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

/** @todo untested */
export async function getSongComponentData(songs: SBSong[]) {
    if (!(songs.length > 0)) return [];

    const spotifyIds = songs.map((x) => x.songs.spotify_id || '');

    // URL params will leave empty parameters blank.
    const query = new URLSearchParams({ songIds: spotifyIds.join(',') })

    // grab data
    const songRes = await fetch(`http://localhost:3000/api/spotify/songs?${query.toString()}`);

    let songData = [];

    if (!songRes.ok) {
        return [];
    }

    // match song back with corresponding song data.
    songData = await songRes.json();
    songData = songData.tracks;
    
    // spotify_id : image url
    const validIds: Record<string, string> = { '' : '' };
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