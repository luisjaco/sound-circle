'use client'
import { useEffect, useState } from 'react';
import SpotifyButton from '@/components/SpotifyButton';
import { HIDE_SCROLLBAR } from '@/components/ui/utils';
import Song from '@/components/Song';

type SPTrack = {
    name: string,
    id: string,
    url: string,
    isrc: string,
    image_url: string,
    album_name: string,
    album_spotify_id: string,
    artist_name: string,
    artist_id: string,
}

export default function LHSpotify() {
    const [authenticated, setAuthenticated] = useState<true | false | null>(null);
    const [musicData, setMusicData] = useState<React.ReactElement[]>();
    const [error, setError] = useState(false);

    // check if spotify is already connected when component loads
    useEffect(() => {
        let mounted = true;

        const retrieveStatus = async () => {
            await fetch('/api/spotify/status')
                .then(res => res.json())
                .then(data => {
                    if (data.connected) {
                        setAuthenticated(true)
                    }
                    else setAuthenticated(false)
                })
                .catch(() => { });
        }

        retrieveStatus();

        return () => { mounted = false };

    }, []);

    // load data once authenticated.
    useEffect(() => {
        let mounted = true;

        const retrieveHistory = async () => {
            const res = await fetch('/api/spotify/recentTracks');

            if (!res.ok) {
                setError(true);
                return;
            }

            setError(false);
            const data = await res.json()
            populateTracks(data)
        }

        if (authenticated === true) retrieveHistory();

        return () => { mounted = false }
    }, [authenticated])

    function populateTracks(data: any) {

        const tracks: SPTrack[] = [];

        for (const t of data.items) {
            const track = t.track
            const formatted_track: SPTrack = {
                name: track.name || null,
                id: track.id || null,
                url: track.external_urls?.spotify || null,
                isrc: track.external_ids?.isrc || null,
                image_url: track.album?.images[0]?.url || null,

                album_name: track.album?.name || null,
                album_spotify_id: track.album?.id,

                artist_name: track.album?.artists[0]?.name || null,
                artist_id: track.album?.artists[0]?.id || null
            }


            tracks.push(formatted_track)
        }


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
            <SpotifyButton setAlreadyAuthenticated={setAuthenticated} />
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
                        {authenticated === null && (<></>)}
                        {authenticated === true && (history)}
                        {authenticated === false && (authenticate)}
                    </>
                )
        }
    </>)
}