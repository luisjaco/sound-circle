'use client';

import React from 'react';
import { useMusicKit } from './providers/MusicKitProvider';
import { Music } from 'lucide-react';

export default function AppleMusicAuthBtn() {
    const { isAuthorized, authorize, unauthorize, musicKit } = useMusicKit();

    const handleAuth = async () => {
        try {
            if (isAuthorized) {
                await unauthorize();
            } else {
                await authorize();
            }
        } catch (error) {
            console.error('Apple Music Auth Error:', error);
        }
    };

    // Don't render until MusicKit is loaded
    if (!musicKit) {
        return (
            <button disabled className="flex items-center gap-2 bg-neutral-800 text-neutral-500 px-4 py-2 rounded-full font-medium cursor-not-allowed">
                <Music className="w-5 h-5" />
                <span>Loading...</span>
            </button>
        );
    }

    return (
        <button
            onClick={handleAuth}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 ${isAuthorized
                    ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20'
                    : 'bg-[#FA243C] text-white hover:bg-[#D61E32] shadow-lg shadow-[#FA243C]/20'
                }`}
        >
            <Music className="w-5 h-5" />
            <span>{isAuthorized ? 'Disconnect Apple Music' : 'Connect Apple Music'}</span>
        </button>
    );
}
