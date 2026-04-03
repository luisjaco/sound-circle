'use server'

import Artist from '@/components/Artist';
import Album from '@/components/Album';
import Song from '@/components/Song';
import { createClient } from '@/lib/supabase/server';
import { Disc2, Music2, SquareUserRound } from 'lucide-react'
import {
    getTopArtists,
    getArtistComponentData,
    getTopAlbums,
    getAlbumComponentData,
    getTopSongs,
    getSongComponentData
} from '../queries';

type Props = {
    userId: string,
}


export default async function Favorites({
    userId,
}: Props) {

    const supabase = await createClient();

    const [topArtists, topAlbums, topSongs] = await Promise.all([
        getTopArtists(supabase, userId, 3),
        getTopAlbums(supabase, userId, 3),
        getTopSongs(supabase, userId, 3)
    ]);

    // grab favorite artists.
    const [favoriteArtists, favoriteAlbums, favoriteSongs] = await Promise.all([
        getArtistComponentData(topArtists),
        getAlbumComponentData(topAlbums),
        getSongComponentData(topSongs)
    ]);

    const populateArtists = () => {
        // we need top three artists, if user has less than three we will use blank placeholders.
        let i = 0
        const artists = [];

        for (const artist of favoriteArtists) {
            artists.push(
                <Artist
                    id={artist.id}
                    name={artist.name}
                    spotify_image={artist.spotify_image}
                />
            )
            i++;
        }

        // cleanup
        while (i < 3) {
            artists.push(<Artist />);
            i++;
        }

        return artists;
    }

    const populateAlbums = () => {
        // we need top three albums, if user has less than three we will use blank placeholders.
        let i = 0
        const albums = [];

        for (const album of favoriteAlbums) {
            albums.push(
                <Album
                    id={album.id}
                    name={album.name}
                    artistName={album.artist_name}
                    spotify_image={album.spotify_image}
                />
            )
            i++;
        }

        // cleanup
        while (i < 3) {
            albums.push(<Album />);
            i++;
        }

        return albums;
    }

    const populateSongs = () => {
        // we need top three songs, if user has less than three we will use blank placeholders.
        let i = 0
        const songs = [];

        for (const song of favoriteSongs) {
            songs.push(
                <Song
                    id={song.id}
                    name={song.name}
                    /** @todo album name */
                    artistName={song.artist_name}
                    spotify_image={song.spotify_image}
                />
            )
            i++;
        }

        // cleanup
        while (i < 3) {
            songs.push(<Song />);
            i++;
        }

        return songs;
    }


    const artists = (
        <div>
            <div className="flex items-center justify-center gap-2 mb-4 px-1 border-b border-gray-800">
                <h3 className="text-white font-bold text-s mb-2">Favorite Artists</h3>
            </div>

            <div>
                <div className="flex flex-col gap-3 h-60 w-full">
                    {
                        (favoriteArtists.length > 0) ? (
                            populateArtists().map((x, key) => {
                                return (
                                    <div key={key}>{x}</div>
                                )
                            })) : (
                            <div className='flex flex-col h-60 w-full justify-center items-center'>
                                <div className="w-14 h-14 rounded-full bg-gray-800 flex items-center justify-center mb-2">
                                    <SquareUserRound className="w-10 h-10 text-gray-600" />
                                </div>
                                <p className='text-gray-600'>No favorite artists yet</p>
                            </div>
                        )
                    }
                </div>
            </div>
        </div>
    )

    const albums = (
        <div>
            <div className="flex items-center justify-center gap-2 mb-4 px-1 border-b border-gray-800">
                <h3 className="text-white font-bold text-s mb-2">Favorite Albums</h3>
            </div>

            <div>
                <div className="flex flex-col gap-3">
                    {
                        (favoriteAlbums.length > 0) ? (
                            populateAlbums().map((x, key) => {
                                return (
                                    <div key={key}>{x}</div>
                                )
                            })) :
                            (
                                <div className='flex flex-col h-60 w-full justify-center items-center'>
                                    <div className="w-14 h-14 rounded-full bg-gray-800 flex items-center justify-center mb-2">
                                        <Disc2 className="w-10 h-10 text-gray-600" />
                                    </div>
                                    <p className='text-gray-600'>No favorite albums yet</p>
                                </div>
                            )
                    }
                </div>
            </div>
        </div>
    )

    const songs = (
        <div>
            <div className="flex items-center justify-center gap-2 mb-4 px-1 border-b border-gray-800">
                <h3 className="text-white font-bold text-s mb-2">Favorite Songs</h3>
            </div>

            <div>
                <div className="flex flex-col gap-3">
                    {
                        (favoriteSongs.length > 0) ? (
                            populateSongs().map((x, key) => {
                                return (
                                    <div key={key}>{x}</div>
                                )
                            })) : (
                            <div className='flex flex-col h-60 w-full justify-center items-center'>
                                <div className="w-14 h-14 rounded-full bg-gray-800 flex items-center justify-center mb-2">
                                    <Music2 className="w-10 h-10 text-gray-600" />
                                </div>
                                <p className='text-gray-600'>No favorite songs yet</p>
                            </div>
                        )
                    }
                </div>
            </div>
        </div>
    )

    return (
        <div className="flex py-6 border-b border-gray-800 h-90 w-full items-center">

            <div className="grid grid-cols-3 gap-6 w-full">

                {artists}
                {albums}
                {songs}

            </div>
        </div>
    )
}
