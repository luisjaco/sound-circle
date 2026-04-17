'use client'
type Props = {
    children: React.ReactNode;
}

import Header from './components/Header';
import SideBar from "./components/Sidebar";
import ListeningHistory from './components/ListeningHistory';
import { Suspense, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { notFound } from 'next/navigation';

export default function MainLayout({ children }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [listeningHistoryOpen, setListeningHistoryOpen] = useState(false);

    const supabase = createClient();
    const [username, setUsername] = useState('');
    const [profilePictureUrl, setProfilePictureUrl] = useState('');

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

            setUsername(profile.username);
            setProfilePictureUrl(profile.profile_picture_url);
        }

        grabCurrentUser();

        return () => {
            isMounted = false;
        }
    }, []);



    return (
        <div className="min-h-screen bg-black pb-20">
            <Header
                setSidebarOpen={setSidebarOpen}
                username={username}
                profilePictureUrl={profilePictureUrl}
            />
            <SideBar
                setListeningHistoryOpen={setListeningHistoryOpen}
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                username={username}
                profilePictureUrl={profilePictureUrl}
            />
            <ListeningHistory 
                listeningHistoryOpen={listeningHistoryOpen}
                setListeningHistoryOpen={setListeningHistoryOpen}
            />
            <Suspense>
                {children}
            </Suspense>
            
        </div>
    );
}