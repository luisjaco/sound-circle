import { createClient } from "@/lib/supabase/server";
import { fetchMBFavorites } from './helpers';

// route handler for /api/favorites
// GET loads the user's current favorites
// PATCH replaces them with newly selected favorites

// GET: fetch current favorites
export async function GET() {
    const supabase = await createClient();

    // get logged-in user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if ( authError || !user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // fetch favorite genres
    const { data: genreData, error: genreError } = await supabase
        .from('user_favorite_genres')
        .select(`
            genre_id,
            genres (
                id,
                genre
            )
        `)
        .eq('user_id', user.id);
    if (genreError) {
        return Response.json({ error: 'Failed to fetch favorite genres' }, { status: 500 });
    }
    const favoriteGenres = (genreData || [])
        .map((row: any) => row.genres)
        .filter(Boolean);


    // fetch favorites from musicbrainz
    let favoriteArtists;
    let favoriteAlbums;
    let favoriteSongs;
    try {
        // artists
        favoriteArtists = await fetchMBFavorites({
            supabase,
            joinTable: 'user_favorite_artists',
            foreignKey: 'artist_id',
            relationName: 'artists',
            selectFields: `
                id,
                name,
                spotify_id,
                musicbrainz_id
            `,
            userId: user.id,
        });

        // albums
        favoriteAlbums = await fetchMBFavorites({
            supabase,
            joinTable: 'user_favorite_albums',
            foreignKey: 'album_id',
            relationName: 'albums',
            selectFields: `
                id,
                name,
                spotify_id,
                musicbrainz_id
            `,
            userId: user.id,
        });

        // songs
        favoriteSongs = await fetchMBFavorites({
            supabase,
            joinTable: 'user_favorite_songs',
            foreignKey: 'song_id',
            relationName: 'songs',
            selectFields: `
                id,
                name,
                spotify_id,
                musicbrainz_id
            `,
            userId: user.id,
        });
    } catch (error) {
        console.error(error);
        return Response.json({ error: 'Failed to fetch music favorites' }, { status: 500 });
    }

    return Response.json({
        favoriteGenres,
        favoriteArtists,
        favoriteAlbums,
        favoriteSongs
    });
}

// PATCH: delete current -> insert new favorites
export async function PATCH(req: Request) {
    const supabase = await createClient();

    // get logged-in user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if ( authError || !user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // parse the payload of submitted favorites
    let body: {
        favoriteGenres?: number[];
        favoriteArtists?: number[];
        favoriteAlbums?: number[];
        favoriteSongs?: number[];
    };

    try {
        body = await req.json();
    } catch {
        return Response.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // invalid or missing values fall back to empty arrays
    const favoriteGenres = Array.isArray(body.favoriteGenres) ? body.favoriteGenres : [];
    const favoriteArtists = Array.isArray(body.favoriteArtists) ? body.favoriteArtists : [];
    const favoriteAlbums = Array.isArray(body.favoriteAlbums) ? body.favoriteAlbums : [];
    const favoriteSongs = Array.isArray(body.favoriteSongs) ? body.favoriteSongs : [];

    // max of 3 favorites per category
    const MAX = 3;
    if (
        favoriteGenres.length > MAX ||
        favoriteArtists.length > MAX ||
        favoriteAlbums.length > MAX ||
        favoriteSongs.length > MAX
    ) {
        return Response.json(
            { error: `Each favorites category can have a maximum of ${MAX} items.` },
            { status: 400 }
        );
    }

    // convert submitted ids into proper shape for their corresponding join table
    const genreRows = favoriteGenres.map((genreId) => ({
        user_id: user.id,
        genre_id: genreId
    }));
    const artistRows = favoriteArtists.map((artistId) => ({
        user_id: user.id,
        artist_id: artistId
    }));
    const albumRows = favoriteAlbums.map((albumId) => ({
        user_id: user.id,
        album_id: albumId
    }));
    const songRows = favoriteSongs.map((songId) => ({
        user_id: user.id,
        song_id: songId
    }));

    // clear all current favorites
    const [
        deleteGenres,
        deleteArtists,
        deleteAlbums,
        deleteSongs
    ] = await Promise.all([
        supabase.from('user_favorite_genres').delete().eq('user_id', user.id),
        supabase.from('user_favorite_artists').delete().eq('user_id', user.id),
        supabase.from('user_favorite_albums').delete().eq('user_id', user.id),
        supabase.from('user_favorite_songs').delete().eq('user_id', user.id),
    ]);
        
    // stop if any deletions fail
    if (
        deleteGenres.error ||
        deleteArtists.error ||
        deleteAlbums.error ||
        deleteSongs.error
    ) {
        console.error('Failed to clear existing favorites', {
            deleteGenres: deleteGenres.error,
            deleteArtists: deleteArtists.error,
            deleteAlbums: deleteAlbums.error,
            deleteSongs: deleteSongs.error
        });

        return Response.json(
            { error: 'Failed to clear existing favorites' },
            { status: 500 }
        );
    }

    // only add insert queries for categories that have newly selected rows
    const insertQueries = [];

    if(genreRows.length > 0) {
        insertQueries.push(
            supabase.from('user_favorite_genres').insert(genreRows)
        );
    }
    if(artistRows.length > 0) {
        insertQueries.push(
            supabase.from('user_favorite_artists').insert(artistRows)
        );
    }
    if(albumRows.length > 0) {
        insertQueries.push(
            supabase.from('user_favorite_albums').insert(albumRows)
        );
    }
    if(songRows.length > 0) {
        insertQueries.push(
            supabase.from('user_favorite_songs').insert(songRows)
        );
    }

    // run final inserts
    const insertResults = await Promise.all(insertQueries);

    const insertError = insertResults.find((result) => result.error);

    if (insertError?.error) {
        console.error('Failed to insert favorites', insertError.error);
        return Response.json(
            { error: 'Failed to save favorites' },
            { status: 500 }
        );
    }

    return Response.json({
        message: 'Favorites updated successfully.'
    });
}