'use client'
import { useState, useEffect } from 'react';
import { Heart, Loader2, Music } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ImageWithFallback } from '@/components/img/ImageWithFallback';
import Artist from '@/components/Artist';


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


export default function ProfileBody({
    userId,
    favoriteArtists
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
        while ( i < 3 ) {
            artists.push(<Artist />);
            i++;
        }

        return artists;
    }

    const artists = (
        <div>
            <div className="flex items-center justify-center gap-2 mb-4 px-1 border-b border-gray-800">
                <h3 className="text-white font-bold text-s mb-2">Favorite Artists</h3>
            </div>

            <div>
                <div className="flex flex-col gap-3">
                    {
                        populateArtists().map( (x, key) => {
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
                    {favoriteArtists.length > 0 ? (
                        favoriteArtists.map((artist) => (
                            <Artist
                                key={artist.id}
                                id={artist.id}
                                name={artist.name}
                                spotify_image={artist.spotify_image}
                            />
                        ))
                    ) : (
                        /* Skeleton placeholders when no data */
                        [0, 1, 2].map((i) => (
                            <div key={i} className="flex items-center gap-3" style={{ animationDelay: `${i * 150}ms` }}>
                                <div className="w-12 h-12 rounded-full bg-gray-800 animate-pulse shrink-0" style={{ animationDelay: `${i * 150}ms` }} />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3 w-20 bg-gray-800 rounded-full animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
                                    <div className="h-2 w-14 bg-gray-800/60 rounded-full animate-pulse" style={{ animationDelay: `${i * 150 + 75}ms` }} />
                                </div>
                            </div>
                        ))
                    )}
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
                    {favoriteArtists.length > 0 ? (
                        favoriteArtists.map((artist) => (
                            <Artist
                                key={artist.id}
                                id={artist.id}
                                name={artist.name}
                                spotify_image={artist.spotify_image}
                            />
                        ))
                    ) : (
                        /* Skeleton placeholders when no data */
                        [0, 1, 2].map((i) => (
                            <div key={i} className="flex items-center gap-3" style={{ animationDelay: `${i * 150}ms` }}>
                                <div className="w-12 h-12 rounded-full bg-gray-800 animate-pulse shrink-0" style={{ animationDelay: `${i * 150}ms` }} />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3 w-20 bg-gray-800 rounded-full animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
                                    <div className="h-2 w-14 bg-gray-800/60 rounded-full animate-pulse" style={{ animationDelay: `${i * 150 + 75}ms` }} />
                                </div>
                            </div>
                        ))
                    )}
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
