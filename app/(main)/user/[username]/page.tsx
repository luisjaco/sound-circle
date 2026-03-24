import { createClient } from '@/lib/supabase/server';
import ProfileHeader from './components/ProfileHeader'
import Favorites from './components/Favorites';
import ProfileFooter from './components/ProfileFooter';
import { 
    getProfile, 
    getProfileStatistics,
    getTopArtists, 
    getArtistComponentData, 
    getTopAlbums, 
    getAlbumComponentData,
    getTopSongs,
    getSongComponentData
} from './queries';

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

export default async function ProfilePage({ params }: { params: { username: string } }) {
    const supabase = await createClient();
    const { username } = await params;

    const { userId, profileInfo } = await getProfile(supabase, username);
    const [reviewCount, followers, following] = await getProfileStatistics(supabase, userId);

    // grab favorite artists.
    const topArtists: SBArtist[] = await getTopArtists(supabase, userId, 3);
    const artistComponentData = await getArtistComponentData(topArtists);

    // grab favorite albums.
    const topAlbums: SBAlbum[] = await getTopAlbums(supabase, userId, 3);
    const albumComponentData = await getAlbumComponentData(topAlbums);

    // grab favorite songs.
    const topSongs: SBSong[] = await getTopSongs(supabase, userId, 3);
    const songComponentData = await getSongComponentData(topSongs); 

    return (
        <div className="min-h-screen bg-black pb-20">
            <div className="max-w-4xl mx-auto px-4">
                <ProfileHeader
                    userId={userId}
                    username={profileInfo.username}
                    isOwner={profileInfo.isOwner}
                    name={profileInfo.name}
                    city={profileInfo.city}
                    state={profileInfo.state}
                    bio={profileInfo.bio}
                    profileUrl={profileInfo.profile_picture_url}
                    reviews={reviewCount || 0}
                    followers={followers || 0}
                    following={following || 0}
                />
                <Favorites
                    userId={userId}
                    favoriteArtists={artistComponentData}
                    favoriteAlbums={albumComponentData}
                    favoriteSongs={songComponentData}
                />
                <ProfileFooter />
            </div>
        </div>
    )
}