'use client'
type Props = {
    children: React.ReactNode;
}

import Header from './components/Header';
import SideBar from "./components/Sidebar";
import ListeningHistory from './components/ListeningHistory';
import { Suspense, useEffect, useState, createContext, SetStateAction } from "react";
import { createClient } from "@/lib/supabase/browser";
import { notFound } from 'next/navigation';
import { AsideContext } from '../../components/AsideContext';


export default function MainLayout({ children }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [listeningHistoryOpen, setListeningHistoryOpen] = useState(false);

    const supabase = createClient();
    const [username, setUsername] = useState('');
    const [profilePictureUrl, setProfilePictureUrl] = useState('');

    const [isModerator, setIsModerator] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const grabCurrentUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();

            // error should not be possible given user is created, but if it is we will push notFound();
            if (!user) notFound();

            const { data: profile } = await supabase
                .from('users')
                .select('*')
                .eq('id', user?.id)
                .single();

            if (!profile) notFound();
            
            const { data: modData } = await supabase
                .from('moderator')
                .select('id')
                .eq('user_id', user.id)
                .maybeSingle();

            if (isMounted) {
                setUsername(profile.username);
                setProfilePictureUrl(profile.profile_picture_url);
                setIsModerator(!!modData);
            }
        }

        grabCurrentUser();

        return () => {
            isMounted = false;
        }
    }, []);

    return (
        <AsideContext.Provider value={{
            sidebarOpen,
            setSidebarOpen,
            listeningHistoryOpen,
            setListeningHistoryOpen
        }}>
            <div className="min-h-screen bg-black pb-20">
                <Header
                    username={username}
                    profilePictureUrl={profilePictureUrl}
                />
                <SideBar
                    username={username}
                    profilePictureUrl={profilePictureUrl}
                    isModerator={isModerator}
                />
                <ListeningHistory />
                <Suspense>

                    {children}

                </Suspense>
            </div>
        </AsideContext.Provider>
    );
}