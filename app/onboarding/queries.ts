import { SupabaseClient } from "@supabase/supabase-js";

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

  /** @TODO currently, skip adding artists. */
  // const favoriteArtists = artistPicks.map((x) => ({user_id: uuid, artist_id: x.id}));
  // const favoriteArtistQuery = supabase
  //   .from('user_favorite_artists')
  //   .insert(favoriteArtists);

  const queries = [favoriteGenreQuery] //, favoriteArtistQuery];

  const [genres] = await Promise.all(queries);

  if (genres.error) { //|| artists.error ) {
    if (genres.error) console.log("user_favorite_genres error", genres.error);
    // if (artists.error) console.log("user_favorite_artists error", artists.error);
    return false;
  } else {
    return true;
  }
}

