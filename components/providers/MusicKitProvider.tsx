'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface MusicKitContextType {
    musicKit: any;
    isAuthorized: boolean;
    authorize: () => Promise<void>;
    unauthorize: () => Promise<void>;
}

const MusicKitContext = createContext<MusicKitContextType | undefined>(undefined);

export const useMusicKit = () => {
    const context = useContext(MusicKitContext);
    if (!context) {
        throw new Error('useMusicKit must be used within a MusicKitProvider');
    }
    return context;
};

export function MusicKitProvider({ children }: { children: React.ReactNode }) {
    const [musicKit, setMusicKit] = useState<any>(null);
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        const initMusicKit = async () => {
            try {
                const res = await fetch('/api/apple/token');
                const { token } = await res.json();

                if (!token) return;

                if (!(window as any).MusicKit) {
                    const script = document.createElement('script');
                    script.src = 'https://js-cdn.music.apple.com/musickit/v3/musickit.js';
                    script.async = true;
                    script.crossOrigin = "anonymous";
                    script.onload = () => configureMusicKit(token);
                    document.body.appendChild(script);
                } else {
                    configureMusicKit(token);
                }
            } catch (error) {
                console.error('Error initializing MusicKit:', error);
            }
        };

        const configureMusicKit = async (token: string) => {
            try {
                const mk = (window as any).MusicKit;
                const instance = await mk.configure({
                    developerToken: token,
                    app: {
                        name: 'SoundCircle',
                        build: '1.0.0',
                    },
                });

                setMusicKit(instance);
                setIsAuthorized(instance.isAuthorized);

                instance.addEventListener('authorizationStatusDidChange', () => {
                    setIsAuthorized(instance.isAuthorized);
                });
            } catch (err) {
                console.error("Error configuring MusicKit", err);
            }
        };

        initMusicKit();
    }, []);

    const authorize = async () => {
        try {
            if (musicKit) {
                await musicKit.authorize();
            }
        } catch (err) {
            console.error("MusicKit Authorization Failed:", err);
        }
    };

    const unauthorize = async () => {
        try {
            if (musicKit) {
                await musicKit.unauthorize();
            }
        } catch (err) {
            console.error("MusicKit Unauthorization Failed:", err);
        }
    };

    return (
        <MusicKitContext.Provider value={{ musicKit, isAuthorized, authorize, unauthorize }}>
            {children}
        </MusicKitContext.Provider>
    );
}
