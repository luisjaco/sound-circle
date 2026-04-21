"use client"

import { notFound, useRouter } from 'next/navigation';
import { ImageWithFallback } from './img/ImageWithFallback';
import { Loader2, Music2 } from 'lucide-react';
import { useState } from 'react';
import { useContext } from 'react';
import { AsideContext } from './AsideContext';

type Props = {
    id?: string,
    name?: string,
    artistName?: string,
    isrc?: string,
    image?: string,
}

export default function Song({
    id,
    name,
    isrc,
    artistName,
    image,
}: Props) {

    const context = useContext(AsideContext);
    if (!context) notFound();
    const { setSidebarOpen, setListeningHistoryOpen } = context;

    const router = useRouter();
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(false);

    const handlePush = async () => {
        if (id) router.push(`/song/${id}`);

        if (isrc && artistName && name) {
            setLoading(true);
            const res = await fetch(`/api/supabase/songs?isrc=${encodeURIComponent(isrc)}&artistName=${encodeURIComponent(artistName)}&songName=${name}`);
            setLoading(false);

            if (!res.ok || res.status > 200) {
                setError(true);
                return;
            }

            const data = await res.json()
            setError(false);
            const id = data.id;

            // only in this situation is the listening history/sidebar open. therefore we only close
            // here.
            setSidebarOpen(false);
            setListeningHistoryOpen(false);
            router.push(`/song/${id}`)
        }
    }


    const content = (
        <>
            <div className="w-16 h-16 rounded-md overflow-hidden ring-2 ring-[#1DB954] p-0.5 group-hover:ring-[#9fddb5] transition-all shrink-0 flex justify-center items-center">
                {loading ?
                    (<Loader2 className='w-8 h-8 text-[#1DB954] animate-spin' />)
                    :
                    (<>
                        {image ? (
                            <ImageWithFallback
                                src={image}
                                alt={`image of song: ${name}`}
                                className="w-full h-full rounded-md object-cover"
                            />
                        ) : (
                            <div className="w-full h-full rounded-md bg-gray-800 flex items-center justify-center">
                                <Music2 className="w-8 h-8 text-gray-600" />
                            </div>
                        )}
                    </>)}
            </div>
        </>
    );

    const song = (
        <div
            className="flex gap-3 cursor-pointer group mb-2"
            onClick={handlePush}
        >
            {content}

            <div className="flex-1 min-w-0 bg-[#181818] p-2 rounded-lg">
                <div className='ml-2'>
                    <p className="text-white text-base truncate font-bold mb-.5">
                        {name}
                    </p>
                    <p className="text-gray-500 text-s truncate">
                        Song • {artistName}
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
            {(id !== null || isrc !== null) ? (song) : (blank)}
            <p hidden={!error} className='text-red-500 text-2xs'>There was an error retrieving this song.</p>
        </>
    );
}