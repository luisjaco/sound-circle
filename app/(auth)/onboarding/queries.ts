import { SupabaseClient } from "@supabase/supabase-js";
import { MB_BASE, USER_AGENT } from "@/lib/musicbrainz";

type Genre = {
  id: number,
  genre: string
}

type Artist = {
  id: string,
  name: string
}

type CompletedArtist = {
  id: string,
  name: string,
  musicbrainz_id: string,
  spotify_id: string,
  apple_music_id: string,
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
  favoriteGenres: { id: number, genre: string }[],
  favoriteArtists: { id: string, name: string }[]
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

  // find supabase artist equivalents (previously only held in musicbrainz.)
  const SBArtists = await querySupabaseArtists(favoriteArtists);

  if (!SBArtists) {
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
  const genreQueryFields = favoriteGenres.map((x) => ({ user_id: uuid, genre_id: x.id }));
  const favoriteGenreQuery = supabase
    .from('user_favorite_genres')
    .insert(genreQueryFields);

  // user_favorite_artists insert
  const artistQueryFields = SBArtists.map((ar) => ({ user_id: uuid, artist_id: ar.id }));
  const favoriteArtistQuery = supabase
    .from('user_favorite_artists')
    .insert(artistQueryFields);

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
    const res = await fetch(`/api/musicbrainz/artist?q=${encodeURIComponent(artist)}&limit=10`);

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
    console.error('Artist search failed', err);
    artists = [];
    result = false;
  }

  return { artists: artists, result: result };
};

async function querySupabaseArtists(artists: Artist[]) {
  // this function will query for existing entries of supabase artists, if they do not exist,
  // the route will update the artists table, create new entries, and return the completed list of 
  // artists

  const res = await fetch('/api/supabase/artists', {
    method: 'POST',
    headers: {'Content-type' : 'application/json' },
    body:  JSON.stringify({artists: artists})
  });

  if (!res.ok) {
    return false;
  }

  const data: CompletedArtist[] = await res.json();
  console.log(data);
  return data;
};