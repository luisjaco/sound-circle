'use client'

import { useEffect, useState } from 'react';
import SpotifyIcon from './SpotifyIcon';
import { X } from 'lucide-react';


type SpotifyButtonProps = {
    setAlreadyAuthenticated?: React.Dispatch<React.SetStateAction<true | false | null>>
}

export default function SpotifyButton({
    setAlreadyAuthenticated
}: SpotifyButtonProps) {
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [error, setError] = useState(false);

    // grabs authorization
    const retrieveStatus = async () => {
        await fetch('/api/spotify/status')
            .then(res => res.json())
            .then(data => {
                if (data.connected) {
                    setIsAuthorized(true);
                    setAlreadyAuthenticated && setAlreadyAuthenticated(true);
                } else {
                    setIsAuthorized(false);
                    setAlreadyAuthenticated && setAlreadyAuthenticated(false);
                }
            })
            .catch(() => { });
    }

    // check if spotify is already connected when component loads
    useEffect(() => {

        let mounted = true;

        retrieveStatus();

        return () => {
            mounted = false;
        }

    }, []);

    // listen for the success message from the spotify popup after successful oauth
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return;
            if (event.data?.type === 'SPOTIFY_AUTH_SUCCESS') {
                setIsAuthorized(true);
                setAlreadyAuthenticated && setAlreadyAuthenticated(true);
                setError(false)
            } else {
                setError(true)
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const handleSpotifyConnect = () => {
        if (isAuthorized) return; // safe exit


        // open spotify oauth in a popup window
        const width = 500;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        const url = new URL('/api/spotify/auth', window.location.origin);

        window.open(
            url.toString(),
            'spotify-auth',
            `width=${width},height=${height},left=${left},top=${top}`
        );
    };

    const unauthorize = async () => {
        await fetch('/api/spotify/unauthorize', { method: 'POST' })
        await retrieveStatus();
    }

    return (
        <div className='flex flex-col justify-center items-center w-full'>
            <button
                onClick={handleSpotifyConnect}
                className={`
            w-full flex items-center justify-center text-xl 
            font-extrabold gap-2  py-4 rounded-full overflow-hidden 
            transition-colors  text-black
                ${isAuthorized ? 'bg-[#0f5d2b] ring-[#1DB954] ring-2 cursor-not-allowed' : 'bg-[#1DB954] cursor-pointer hover:bg-[#4bf486] '}
            `}
            >
                <SpotifyIcon className='text-black' />
                <p>{isAuthorized ? "Authenticated" : "Spotify"}</p>
                {isAuthorized && (<X onClick={unauthorize} className='ml-5 w-6 h-6 stroke-3 cursor-pointer hover:text-[#FA2D48] transition-colors' />)}
            </button>
            <p hidden={!error} className={`text-xs pt-2`}>There was an error authenticating your Spotify account.</p>
        </div>
    )
}