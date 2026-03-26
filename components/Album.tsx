"use client"

import { useRouter } from 'next/navigation';
import { ImageWithFallback } from './img/ImageWithFallback';
import { Disc2 } from 'lucide-react';
import { useEffect } from 'react';

type Props = {
    id?: string,
    name?: string,
    artistName?: string,
    spotify_image?: string,
}


export default function Album({
    id,
    name,
    spotify_image,
    artistName,
}: Props) {

    const router = useRouter();

    useEffect(() => {
        console.log(spotify_image);
    }, [])


    const album = (
        <div
            className="flex gap-3 cursor-pointer group mb-2"
            onClick={() => router.push(`/album/${id}`)}
        >
            <div className="w-16 h-16 rounded-md overflow-hidden ring-2 ring-[#1DB954] p-0.5 group-hover:ring-[#1ed760] transition-all shrink-0">
                {spotify_image ? (
                    <ImageWithFallback
                        src={spotify_image}
                        alt={`image of album: ${name}`}
                        className="w-full h-full rounded-md object-cover"
                    />
                ) : (
                    <div className="w-full h-full rounded-md bg-gray-800 flex items-center justify-center">
                        <Disc2 className="w-8 h-8 text-gray-600" />
                    </div>
                )}
            </div>

            <div className="flex-1 min-w-0 bg-[#181818] p-2 rounded-lg">
                <div className='ml-2'>
                    <p className="text-white text-base truncate font-bold mb-.5">
                        {name}
                    </p>
                    <p className="text-gray-500 text-s truncate">
                        Album • {artistName}
                    </p>
                </div>
            </div>
        </div>
    );

    const blank = (
        <div
            className="flex gap-3 group mb-2"
        >
            <div className="w-16 h-16 rounded-md overflow-hidden ring-2 ring-[#181818] p-0.5 group-hover:ring-[#212121] transition-all shrink-0">
                <div className="w-full h-full rounded-md bg-[#070707] flex items-center justify-center">

                </div>
            </div>

            <div className="flex-1 min-w-0 bg-[#070707] p-2 rounded-lg">
                <div className='ml-2'>

                </div>
            </div>
        </div>
    )

    return (
        <>
            {id ? (album) : (blank)}
        </>
    );
}