'use client'

import ProfilePicture from "@/components/img/ProfilePicture";
import { createClient } from "@/lib/supabase/browser";
import { Home, Search } from "lucide-react";
import { notFound, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Header() {

    const router = useRouter();
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
        <div className="px-4 py-3 flex justify-around items-center w-80">
            <button
                onClick={() => router.push('/search')}
                className="flex flex-col items-center gap-1 text-gray-400 hover:text-[#1DB954] transition-colors cursor-pointer"
            >
                <Search className="w-8 h-8" />
                <span className="text-xs">Search</span>
            </button>
            <button
                className="flex flex-col items-center gap-1 text-gray-400 hover:text-[#1DB954] transition-colors cursor-pointer"
                onClick={() => router.push('/feed')}
            >
                <Home className="w-8 h-8" />
                <span className="text-xs">Home</span>
            </button>
            <button
                onClick={() => router.push(`/user/${username}`)}
                className="flex flex-col items-center gap-1 text-gray-400 hover:text-[#1DB954] transition-colors cursor-pointer"
            >
                <ProfilePicture
                    src={profilePictureUrl}
                    size={8}
                />
                <span className="text-xs">{username}</span>
            </button>
        </div>
    );
}