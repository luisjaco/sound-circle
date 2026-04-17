'use client'

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ClockFading } from 'lucide-react';
import LHAppleMusic from './LHAppleMusic';
import LHSpotify from './LHSpotify';
import SpotifyIcon from '@/components/SpotifyIcon';
import AppleMusicIcon from '@/components/AppleMusicIcon';

type ListeningHistoryProps = {
    listeningHistoryOpen: boolean,
    setListeningHistoryOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function ListeningHistory({
    listeningHistoryOpen,
    setListeningHistoryOpen
}: ListeningHistoryProps) {

    const [mode, setMode] = useState<'spotify' | 'apple_music' | null>(null);

    const header = (
        <div className='flex flex-col w-full gap-3'>

            <div
                className="flex border-b border-gray-700 w-full text-xl font-bold items-center pt-4 gap-4 pb-4 justify-center"
                onClick={() => setListeningHistoryOpen(true)}
            >
                <ClockFading className="w-11 h-11" />
                <p>Listening History</p>
            </div>
            <div className="flex w-full text-lg items-center pt-4 pb-4 justify-around">
                <div
                    className={`flex gap-2 items-center justify-center ${mode === 'spotify' ? 'text-[#1DB954] border-[#1DB954]' : 'hover:text-[#1DB954] hover:border-[#1DB954] border-gray-700'}  transition-colors cursor-pointer w-45 border-b-3 pb-3`}
                    onClick={() => setMode('spotify')}    
                >
                    <SpotifyIcon />
                    <p>Spotify</p>
                </div>
                <div
                    className={`flex gap-2 items-center justify-center ${mode === 'apple_music' ? 'text-[#FA2D48] border-[#FA2D48]' : 'hover:text-[#FA2D48] hover:border-[#FA2D48] border-gray-700'} transition-colors cursor-pointer w-45 border-b-3 pb-3`}
                    onClick={() => setMode('apple_music')}
                    >
                    <AppleMusicIcon />
                    <p>Apple Music</p>
                </div>

            </div>

        </div>
    );

    return (
        <>
            {(listeningHistoryOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40"
                    onClick={() => setListeningHistoryOpen(false)}
                />
            ))}

            <aside
                className={`
          fixed top-0 right-0 h-full w-xl bg-[#0a0a0a]
          transform transition-transform duration-300 z-60
          border-l-4 border-[#1DB954]
          ${listeningHistoryOpen ? "translate-x-0" : "translate-x-full"}
        `}
            >
                <div className="px-6 flex flex-col h-full w-full justify-between items-center">
                    {header}
                    {mode === 'spotify' && (<LHSpotify/>)}
                    {mode === 'apple_music' && (<LHAppleMusic/>)}
                </div>
            </aside>
        </>
    );


}