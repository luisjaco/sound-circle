'use client';

import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useMusicKit } from "@/components/providers/MusicKitProvider";
import AppleMusicButton from '@/components/AppleMusicButton';
import SpotifyButton from '@/components/SpotifyButton';

type Props = {
    arrowPress: number;
    setComponentState: React.Dispatch<React.SetStateAction<'inactive' | 'working' | 'failure' | 'success'>>;
}

export default function StreamingServices({
    arrowPress,
    setComponentState,
}:  Props
) {



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
                    <SpotifyButton />
                    <AppleMusicButton />
                </div>

                <p className="text-gray-500 text-sm text-center">
                    You can connect later if you'd prefer.
                </p>
            </div>
        </div>
    );
}