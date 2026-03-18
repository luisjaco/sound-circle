import { SupabaseClient } from "@supabase/supabase-js";

type Genre = {
  id: number,
  genre: string
}

type Artist = {
  id: string,
  name: string
}

export async function validateUsernameSB(username: string) {
  let errorMessage = '';
  let result = false;

  // supabase check for username originality (does username exist in table?)
  const res = await fetch(`/api/supabase/users?username=${encodeURIComponent(username)}`);

  if (!res.ok) {
    console.error('HTTP error', res.status);
    errorMessage = 'There was an error validating this username.';
  } else {

    const data = await res.json();
    if (data && data.length > 0) errorMessage = 'This username already exists.';
    else result = true;
  }

  return { errorMessage, result };
}

export async function createUser(
  supabase: SupabaseClient,
  profilePictureUrl: string,
  profilePictureFile: File,
  fullName: string,
  bio: string,
  username: string,
  city: string,
  state: string,
  genrePicks: { id: number, genre: string }[],
  artistPicks: { id: string, name: string }[]
) {
  const session = await fetch('/api/auth/session');
  const sessionData = await session.json();

  if (!session.ok) {
    return false;
  }

  const uuid = sessionData.user.id;

  // ensure user not in tables already
  const userQueryResult = await fetch(`/api/supabase/users?id=${uuid}`)
  const userQueryData = await userQueryResult.json();

  if (!userQueryResult.ok) {
    return false;
  } else if (userQueryData.length > 0) {
    console.error('user already has profile!')
    return false;
  } 

  // profile image
  let imagePath = '';
  if (profilePictureUrl && profilePictureFile) {
    const fileName = `pfp_${Date.now()}_${Math.random()}`;
    const filePath = `${uuid}/${fileName}`;

    const { error } = await supabase
      .storage
      .from('profile_images')
      .upload(filePath, profilePictureFile);

    if (error) {
      return false;
    } else {
      const { publicUrl } = await supabase
        .storage
        .from('profile_images')
        .getPublicUrl(filePath)
        .data;

      if (publicUrl) {
        imagePath = publicUrl;
      }
      else {
        return false;
      }
    }
  }

  // user data
  const { data, error } = await supabase
    .from('users')
    .insert({
      'id': uuid,
      'name': fullName,
      'bio': bio,
      'username': username,
      'city': city,
      'state': state,
      'profile_picture_url': imagePath,
    })

  if (error) {
    console.log('users error', error);
    return false;
  }

  // user_favorite_genres insert
  const favoriteGenres = genrePicks.map((x) => ({ user_id: uuid, genre_id: x.id }));
  const favoriteGenreQuery = supabase
    .from('user_favorite_genres')
    .insert(favoriteGenres);

  // user_favorite_artists insert (artist.id is the Supabase artists table id)
  const favoriteArtists = artistPicks.map((x) => ({ user_id: uuid, artist_id: x.id }));
  const favoriteArtistQuery = supabase
    .from('user_favorite_artists')
    .insert(favoriteArtists);

  const queries = [favoriteGenreQuery, favoriteArtistQuery];

  const [genres, artists] = await Promise.all(queries);

  if (genres.error || artists.error) {
    if (genres.error) console.log("user_favorite_genres error", genres.error);
    if (artists.error) console.log("user_favorite_artists error", artists.error);
    return false;
  } else {
    return true;
  }
}

export async function searchGenres(genre: string) {
  let genres: Genre[];
  let result: boolean;

  try {
    const res = await fetch(`/api/supabase/genres?genre=${encodeURIComponent(genre)}`);

    if (!res.ok) {
      genres = [];
      result = false;
    } else {
      const data = await res.json();
      const filteredResults = (data || []).filter((x: Genre) =>
        x.genre.toLowerCase()
      );
      genres = filteredResults;
      result = true;
    }
  } catch (err) {
    console.error("Genre search failed", err);
    genres = []
    result = false;
  }

  return { genres: genres, result: result }
};

export async function searchArtists(artist: string) {
  let artists: Artist[];
  let result: boolean;

  try {
    const res = await fetch(`/api/musicbrainz/artist-search?q=${encodeURIComponent(artist)}&limit=10`);

    if (!res.ok) {
      artists = [];
      result = false;
    } else {
      const data = await res.json();
      const filteredResults = (data.results || []).filter((x: Artist) =>
        x.name.toLowerCase()
      );
      artists = filteredResults;
      result = true;
    }
  } catch (err) {
    console.error('Artist seach failed', err);
    artists = [];
    result = false;
  }

  return { artists: artists, result: result };
};