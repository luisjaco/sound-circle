'use client'
import { useState, useEffect } from 'react';
import { Heart, Loader2, Music } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ImageWithFallback } from '@/components/img/ImageWithFallback';
import Artist from '@/components/Artist';
import Album from '@/components/Album';
import Song from '@/components/Song';


type ArtistData = {
    id: string,
    name: string,
    spotify_image: string,
}

type AlbumData = {
    id: string,
    name: string,
    artist_name: string,
    spotify_image: string
}

type SongData = {
    id: string,
    name: string,
    artist_name: string,
    spotify_image: string
}

type Props = {
    userId: string,
    favoriteArtists: ArtistData[],
    favoriteAlbums: AlbumData[],
    favoriteSongs: SongData[]
}


export default function Favorites({
    userId,
    favoriteArtists,
    favoriteAlbums,
    favoriteSongs,
}: Props) {


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
                <div className="flex flex-col gap-3">
                    {
                        populateArtists().map((x, key) => {
                            return (
                                <div key={key}>{x}</div>
                            )
                        })
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
                        populateAlbums().map((x, key) => {
                            return (
                                <div key={key}>{x}</div>
                            )
                        })
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
                        populateSongs().map((x, key) => {
                            return (
                                <div key={key}>{x}</div>
                            )
                        })
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
