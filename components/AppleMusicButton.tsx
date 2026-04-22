'use client'

import { useState, useEffect } from 'react';
import { useMusicKit } from './providers/MusicKitProvider';
import AppleMusicIcon from './AppleMusicIcon';
import { X } from 'lucide-react';

export default function AppleMusicButton() {
    const [isAuthorizingApple, setIsAuthorizingApple] = useState(false);
    const [error, setError] = useState(false);

    // unlike spotify, AppleMusicKit provides an isAuthorized state variable, we don't need props.
    const musicKit = useMusicKit();

    const handleAppleMusicConnect = async () => {
        if (!musicKit.musicKit || musicKit.isAuthorized || isAuthorizingApple) return;
        
        setIsAuthorizingApple(true);
        try {
            if (!musicKit.isAuthorized) {
                await musicKit.authorize();
            }
            setError(false);
        } catch (error) {
            console.error("Apple Music authorization failed", error);
            setError(true);
        } finally {
            setIsAuthorizingApple(false);
        }
    };

    const unauthorize = async () => {
        musicKit.unauthorize(); // handles itself
    }

    return (
        <div className='flex flex-col justify-center items-center w-full'>
            <button
                onClick={handleAppleMusicConnect}
                className={`
            w-full flex items-center justify-center text-xl 
            font-extrabold gap-2  py-4 rounded-full overflow-hidden 
            transition-colors  text-black
                ${musicKit.isAuthorized ? 'bg-[#72111e] ring-[#FA2D48] ring-2 cursor-not-allowed' : 'bg-[#FA2D48] cursor-pointer hover:bg-[#f77586] '}
            `}
            >
                <AppleMusicIcon className='text-black' />
                <p>{musicKit.isAuthorized ? "Authenticated" : "Apple Music"}</p>
                {musicKit.isAuthorized && (<X onClick={unauthorize} className='ml-5 w-6 h-6 stroke-3 cursor-pointer hover:text-[#FA2D48] transition-colors' />)}
            </button>
            <p hidden={!error} className={`text-xs pt-2 align-middle`}>There was an error authenticating your Apple Music account.</p>
        </div>

    )
}