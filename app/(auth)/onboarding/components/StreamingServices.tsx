'use client';

import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useMusicKit } from "@/components/providers/MusicKitProvider";

type Props = {
    arrowPress: number;
    setComponentState: React.Dispatch<React.SetStateAction<'inactive' | 'working' | 'failure' | 'success'>>;
}

export default function StreamingServices({
    arrowPress,
    setComponentState,
}:  Props
) {

    const { musicKit, isAuthorized } = useMusicKit();
    const [appleConnectedMessage, setAppleConnectedMessage] = useState('');
    const [isAuthorizingApple, setIsAuthorizingApple] = useState(false);
    const [spotifyConnected, setSpotifyConnected] = useState(false);

    // check if spotify is already connected when component loads
    useEffect(() => {
        fetch('api/spotify/status')
            .then(res => res.json())
            .then(data => {
                if (data.connected) setSpotifyConnected(true);
            })
            .catch(() => {});
    }, []);

    // listen for the success message from the spotify popup after successful oauth
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return;
            if (event.data?.type === 'SPOTIFY_AUTH_SUCCESS') {
                setSpotifyConnected(true);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const handleSpotifyConnect = () => {
        // open spotify oauth in a popup window to preserve all onboadring state in the original window
        const width = 500;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        window.open(
            'api/spotify/auth',
            'spotify-auth',
            `width=${width},height=${height},left=${left},top=${top}`
        );
    };

    const handleAppleMusicConnect = async () => {
        if (!musicKit) return;
        setIsAuthorizingApple(true);
        setAppleConnectedMessage('');
        try {
            if (!isAuthorized) {
                await musicKit.authorize();
            }
            setAppleConnectedMessage('Account connected successfully.');
        } catch (error) {
            console.error("Apple Music authorization failed", error);
            setAppleConnectedMessage('Failed to connect to Apple Music.');
        } finally {
            setIsAuthorizingApple(false);
        }
    };

    useEffect(() => {
        if (arrowPress === 0) return; // skip inital load

        // no need for check here
        setComponentState('success')
    }, [arrowPress])

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1">
                <h2 className="text-white mb-2">Connect music services</h2>
                <p className="text-gray-400 text-lg mb-8">
                    Optionally connect Spotify or Apple Music to import your listening history.
                </p>

                <div className="space-y-4 mb-6">
                    <button
                        onClick={handleSpotifyConnect}
                        disabled={spotifyConnected}
                        className={`w-full flex items-center justify-center gap-3 py-4 rounded-full 
                            font-medium transition-colors hover:bg-[#1ed760] text-black overflow-hidden
                            ${spotifyConnected
                                ? 'bg-[#1DB954] opacity-50 cursor-not-allowed text-black' 
                                : 'bg-[#1DB954] hover:bg-[#1ed760] text-black cursor-pointer'
                            }`}
                    >
                        {spotifyConnected ? (
                            <span className="text-sm font-semibold">Connected to Spotify ✓</span>
                        ) : (
                            <img
                                src="/brand/spotify.svg"
                                alt="Spotify"
                                className="w-6 h-6 shrink-0 scale-[10.6] object-contain"
                            />
                        )} 
                    </button>

                    <button
                        onClick={handleAppleMusicConnect}
                        disabled={isAuthorizingApple || isAuthorized}
                        className={`w-full flex items-center justify-center gap-3 bg-white 
                            hover:bg-gray-100 text-black py-4 rounded-full font-medium 
                            transition-colors overflow-hidden 
                            ${isAuthorized ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                        {isAuthorizingApple ? (
                            <Loader2 className="w-6 h-6 animate-spin text-black" />
                        ) : (
                            <img
                                src="/brand/apple-music.svg"
                                alt="Apple Music"
                                className="w-6 h-6 shrink-0 scale-[6.6] object-contain"
                            />
                        )}
                    </button>
                </div>

                {appleConnectedMessage && (
                    <p className={`text-sm text-center mb-6 font-medium ${appleConnectedMessage.includes('Failed') ? 'text-red-500' : 'text-green-500'}`}>
                        {appleConnectedMessage}
                    </p>
                )}

                <p className="text-gray-500 text-sm text-center">
                    You can connect later if you'd prefer.
                </p>
            </div>
        </div>
    );
}