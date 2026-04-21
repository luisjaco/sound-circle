'use client'

import AppleMusicButton from '@/components/AppleMusicButton';
import { useMusicKit } from '@/components/providers/MusicKitProvider';
import Song from '@/components/Song';
import { HIDE_SCROLLBAR } from '@/components/ui/utils';
import { useEffect, useState } from 'react';

type AMTrack = {
    name: string,
    id: string,
    url: string,
    isrc: string,
    image_url: string,
    album_name: string,
    artist_name: string,
}

export default function LHAppleMusic() {
    const { musicKit, isAuthorized } = useMusicKit();
    const [musicData, setMusicData] = useState<React.ReactElement[]>();
    const [error, setError] = useState(false);

    useEffect(() => {
        let mounted = true;

        const fetchRecentTracks = async () => {
            if (!musicKit || !isAuthorized) return;
            setError(false)

            try {
                const res = await musicKit.api.music(
                    'v1/me/recent/played/tracks',
                    { limit: 30 }
                );

                if (res.errors) {
                    setError(true)
                } else {

                    let items: any[] = [];
                    if (Array.isArray(res)) items = res;
                    else if (res.data?.data) items = res.data.data;
                    else if (res.data) items = res.data;

                    setError(false);
                    populateTracks(items);
                }

            } catch (err) {
                console.error(err)
                setError(true)
            }
        };

        if (isAuthorized === true) fetchRecentTracks();

        return () => { mounted = false }
    }, [isAuthorized])

    function populateTracks(data: any) {

        // filter data
        const tracks: AMTrack[] = [];
        for (const t of data) {
            const attributes = t.attributes

            const formatted_track: AMTrack = {
                name: attributes.name || null,
                id: t.id || null,
                url: attributes.url || null,
                isrc: attributes.isrc || null,
                image_url: attributes.artwork?.url.replace('{w}', 300).replace('{h}', 300) || null,

                album_name: attributes.albumName || null,
                artist_name: attributes.artistName || null,
            }

            tracks.push(formatted_track)
        }

        // create elements
        const trackElements = [];
        for (const t of tracks) {
            // if isrc not present, skip (won't be able to match)
            if (t.isrc === null) continue;

            trackElements.push(
                <Song
                    isrc={t.isrc}
                    name={t.name}
                    artistName={t.artist_name}
                    image={t.image_url}
                />
            )
        }

        setMusicData(trackElements);
    }

    const authenticate = (
        <div className='flex flex-col gap-2 w-full h-full items-center justify-center px-6'>
            <AppleMusicButton />
            <p>Authenticate to access history.</p>
        </div>
    )

    const history = (
        <div className={`flex text-wrap w-full p-3 flex-col gap-3 h-full text-xs ${HIDE_SCROLLBAR}`}>
            {
                musicData && musicData.map((e, key) => {
                    return (<div key={key}>{e}</div>)
                })
            }
        </div>
    )

    const errorMessage = (
        <div className='flex flex-col gap-2 w-full h-full items-center justify-center px-6 text-red-500'>
            <p>An error occured.</p>
        </div>
    )

    return (<>
        {
            error ?
                errorMessage
                :
                (
                    <>
                        {isAuthorized === true && (history)}
                        {isAuthorized === false && (authenticate)}
                    </>
                )
        }
    </>)
}