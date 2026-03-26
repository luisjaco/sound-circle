'use client';

import { useEffect } from 'react';

// this page is opened in the spotify oauth popup
// once loaded, it signals the original onboarding window that auth is 
// complete and then closes itself

export default function SpotifyPopupPage() {
    useEffect(() => {
        if(window.opener) {
            // signal the original onboarding window that spotify connected successfully
            window.opener.postMessage({ type: 'SPOTIFY_AUTH_SUCCESS' }, window.location.origin);
            window.close(); 
        }
    }, []);

    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <p className="text-white text-sm">Connecting to Spotify...</p>
        </div>
    );
}